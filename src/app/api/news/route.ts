import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { load } from 'cheerio';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const PROXY_SECRET = "ALERTVICE_INTEL_2026";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

const ai = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

async function freeTranslate(text: string, targetLang: string) {
    if (!text) return "";
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const json = await res.json();
        return json[0].map((s: any) => s[0]).join('');
    } catch (e) {
        return text;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const type = searchParams.get('type') || 'article';
    const q = searchParams.get('q') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

        // 1. Fetch latest from Telegram via Scraping
        if (offset === 0 && !q) {
            try {
                const CHANNEL_URL = "https://t.me/s/alertvice";
                const response = await fetch(CHANNEL_URL, { 
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    cache: 'no-store' 
                });
                const html = await response.text();
                const $ = load(html);

                const rawPosts: any[] = [];
                $('.tgme_widget_message').each((_: number, el: any) => {
                    const $post = $(el);
                    const dataPost = $post.attr('data-post') || "";
                    if (!dataPost.includes('alertvice/')) return;

                    const id = dataPost.split('/').pop();
                    if (!id) return;

                    const textHtml = $post.find('.tgme_widget_message_text').html() || "";
                    const plainText = $post.find('.tgme_widget_message_text').text().trim();
                    
                    const images: string[] = [];
                    $post.find('.tgme_widget_message_photo_wrap').each((_: number, imgEl: any) => {
                        const style = $(imgEl).attr('style') || "";
                        const urlMatch = style.match(/background-image:url\('([^']+)'\)/);
                        if (urlMatch) images.push(urlMatch[1]);
                    });

                    const videos: string[] = [];
                    $post.find('video').each((_: number, vidEl: any) => {
                        const src = $(vidEl).attr('src');
                        if (src) videos.push(src);
                    });

                    const hasVideo = $post.find('.tgme_widget_message_video_player').length > 0 || videos.length > 0;

                    if (plainText || images.length > 0 || videos.length > 0) {
                        rawPosts.push({
                            id,
                            textHtml,
                            plainText,
                            imageUrl: images.length > 0 ? JSON.stringify(images) : null,
                            videoUrl: videos.length > 0 ? JSON.stringify(videos) : null,
                            hasVideo,
                            date: $post.find('time').attr('datetime') || $post.find('.time').attr('datetime') || new Date().toISOString(),
                            views: $post.find('.tgme_widget_message_views').text() || "0"
                        });
                    }
                });

                if (rawPosts.length > 0 && supabaseAdmin) {
                    // Grouping logic for multi-media posts
                    const grouped: any[] = [];
                    let last: any = null;
                    for (const post of rawPosts) {
                        if (last && last.id === post.id) {
                            const parse = (v: any) => v ? JSON.parse(v) : [];
                            const mergedImgs = [...new Set([...parse(last.imageUrl), ...parse(post.imageUrl)])].slice(0, 5);
                            const mergedVids = [...new Set([...parse(last.videoUrl), ...parse(post.videoUrl)])].slice(0, 5);
                            last.imageUrl = mergedImgs.length > 0 ? JSON.stringify(mergedImgs) : null;
                            last.videoUrl = mergedVids.length > 0 ? JSON.stringify(mergedVids) : null;
                            last.hasVideo = last.hasVideo || post.hasVideo;
                        } else {
                            grouped.push(post);
                            last = post;
                        }
                    }

                    const newsCandidates = grouped.reverse().slice(0, 20);
                    
                    // PRE-FILTER: Check Supabase for existing or SUPPRESSED (deleted) records
                    const telegramIds = newsCandidates.map(p => p.id);
                    const [existing, suppressed] = await Promise.all([
                        supabaseAdmin.from('posts').select('telegram_id').in('telegram_id', telegramIds).eq('language', lang),
                        supabaseAdmin.from('deleted_posts').select('telegram_id').in('telegram_id', telegramIds)
                    ]);
                    
                    const skipSet = new Set([
                        ...(existing.data?.map(e => e.telegram_id) || []),
                        ...(suppressed.data?.map(s => s.telegram_id) || [])
                    ]);
                    
                    const newsToProcess = newsCandidates.filter(p => !skipSet.has(p.id));

                    if (newsToProcess.length > 0) {
                        // Batch AI translation
                        if (ai) {
                            const prompts = newsToProcess.map((p, i) => `[${i}] ${p.plainText.substring(0, 600) || "Media Intel"}`);
                            try {
                                const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
                                const targetLanguage = lang === 'ar' ? 'Arabic' : 'English';
                                const promptStr = `Task: Act as a high-level intelligence analyst. Translate and summarize these news snippets into ${targetLanguage}.
REQUIRMENTS:
1. HEADLINE: Create an EXCITING, HIGH-IMPACT headline that captures the essence of the news with tactical precision. Use powerful, active words.
2. SUMMARY: Write a FORMAL, SERIOUS, and EASY TO READ one-sentence summary. It should sound like a professional intelligence briefing.
3. LANGUAGE: Output strictly in ${targetLanguage}.
4. TAG: Assign a tactical tag: [politics|military|market|world|security].

Output ONLY JSON.
Form: { "items": { "0": { "title": "HEADLINE", "summary": "SUMMARY", "tag": "TAG" } } }
Batch: ${prompts.join('\n')}`;
                                
                                const result = await model.generateContent(promptStr);
                                const response = await result.response;
                                const aiText = response.text();
                                const json = JSON.parse(aiText.replace(/```json|```/gi, '').trim() || '{}');
                                
                                newsToProcess.forEach((p, idx) => {
                                    const item = json.items?.[idx.toString()];
                                    if (item) {
                                        p.aiTitle = item.title;
                                        p.aiSummary = item.summary;
                                        p.aiTag = item.tag;
                                    }
                                });
                            } catch (e) { console.error("AI Batch failed", e); }
                        }

                        // Fallback translation for singles
                        await Promise.allSettled(newsToProcess.map(async (p) => {
                            if (!p.aiTitle) {
                                const [title, summary] = await Promise.all([
                                    freeTranslate(p.plainText?.substring(0, 60) || "Intel Update", lang),
                                    freeTranslate(p.plainText?.substring(0, 200) || "Check detailed feed.", lang)
                                ]);
                                p.aiTitle = title;
                                p.aiSummary = summary;
                                p.aiTag = "world";
                            }
                        }));

                        const dbData = newsToProcess.map(p => {
                            // Convert URLs to Proxies to bypass Telegram's temporary nature & hotlinking
                            const proxyUrl = (u: any) => {
                                if (!u) return null;
                                try {
                                    const urls = JSON.parse(u);
                                    const proxied = urls.map((url: string) => `/api/proxy?url=${encodeURIComponent(url)}&s=${PROXY_SECRET}`);
                                    return JSON.stringify(proxied);
                                } catch { return u; }
                            };

                            return {
                                telegram_id: p.id,
                                title: p.aiTitle,
                                summary: p.aiSummary,
                                tag: p.aiTag,
                                content_html: p.textHtml,
                                image_url: proxyUrl(p.imageUrl),
                                has_video: p.hasVideo,
                                video_url: proxyUrl(p.videoUrl),
                                post_date: p.date,
                                views: p.views,
                                language: lang
                            };
                        });

                        await supabaseAdmin.from('posts').upsert(dbData, { onConflict: 'telegram_id, language' });
                    }
                }
            } catch (e) {
                console.error("Sync partial fail", e);
            }
        }

        // 2. Fetch from Database
        if (supabaseAdmin) {
            const urgent = searchParams.get('urgent') === 'true';
            
            let query = supabaseAdmin
                .from('posts')
                .select('*')
                .eq('language', lang)
                .order('post_date', { ascending: false });

            // If urgent, we need to scan more records since "urgent" isn't a DB column yet
            const fetchLimit = urgent ? 100 : limit;
            const fetchOffset = urgent ? 0 : offset;

            if (!urgent) {
                if (type === 'article') {
                    query = query.or('has_video.eq.true,image_url.neq.null');
                } else if (type === 'signal') {
                    query = query.limit(50);
                }
            }

            if (q) {
                query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
            }

            const { data: posts, error } = await query.range(fetchOffset, fetchOffset + fetchLimit - 1);

            if (error) throw error;

            let finalPosts = posts;
            
            // Intelligence Signaling Framework
            if (urgent) {
                // Tier 1: Strict Urgency (Keyword: عاجل)
                finalPosts = posts.filter((p: any) => {
                    const haystack = `${p.title} ${p.summary} ${p.content_html}`.toLowerCase();
                    return haystack.includes('عاجل');
                }).slice(0, limit);
            } else if (type === 'signal') {
                // Tier 2: Radar Flash (Text-primary intelligence)
                finalPosts = posts.filter((p: any) => {
                    // Logic: Ensure we have at least a title or some text.
                    const title = p.title || "";
                    const content = p.content_html || "";
                    return (title.length > 0 || content.length > 0);
                }).slice(0, limit);

                // RELIABILITY FALLBACK: If Arabic (or other) is empty, fetch English 
                if (finalPosts.length === 0 && lang !== 'en') {
                    const { data: fallback } = await supabaseAdmin
                        .from('posts')
                        .select('*')
                        .eq('language', 'en')
                        .order('post_date', { ascending: false })
                        .limit(limit);
                    if (fallback && fallback.length > 0) finalPosts = fallback;
                }
            }

            return NextResponse.json({
                posts: finalPosts.map((p: any) => {
                    const plainText = (p.content_html || "").replace(/<[^>]*>?/gm, '').trim();
                    return {
                        id: `alertvice/${p.telegram_id}`,
                        dbId: p.id,
                        textHtml: p.content_html,
                        plainText: plainText,
                        imageUrl: p.image_url,
                        hasVideo: p.has_video,
                        videoUrl: p.video_url,
                        aiTitle: p.title || "INTEL_UPDATE",
                        aiSummary: p.summary || plainText.substring(0, 100),
                        aiTag: p.tag || "world",
                        date: p.post_date,
                        views: p.views
                    };
                }),
                hasMore: !urgent && posts.length === limit
            });
        }

        return NextResponse.json({ posts: [] });
    } catch (error: any) {
        console.error("News API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
