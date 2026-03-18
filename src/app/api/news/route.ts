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

let lastSyncTime = 0;
const SYNC_INTERVAL = 30000; // 30 seconds

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const type = searchParams.get('type') || 'article';
    const q = searchParams.get('q') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

        // 1. Fetch latest from Telegram via Scraping (Throttled)
        const now = Date.now();
        if (offset === 0 && !q && (now - lastSyncTime > SYNC_INTERVAL)) {
            lastSyncTime = now;
            try {
                const CHANNEL_URL = "https://t.me/s/alertvice";
                const response = await fetch(CHANNEL_URL, { 
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
                    },
                    cache: 'no-store',
                    next: { revalidate: 0 }
                });
                
                if (!response.ok) {
                    console.error("Telegram Scraper: Failed to fetch channel HTML", response.status);
                    throw new Error("Telegram unreachable");
                }

                const html = await response.text();
                console.log(`Telegram Sync: Fetched ${html.length} bytes from ${CHANNEL_URL}`);
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
                    
                    const absUrl = (u: string | undefined) => {
                        if (!u) return "";
                        if (u.startsWith('//')) return `https:${u}`;
                        if (u.startsWith('/')) return `https://t.me${u}`;
                        return u;
                    };

                    const images: string[] = [];
                    $post.find('.tgme_widget_message_photo_wrap').each((_: number, imgEl: any) => {
                        const style = $(imgEl).attr('style') || "";
                        const urlMatch = style.match(/background-image:url\('([^']+)'\)/);
                        if (urlMatch) images.push(absUrl(urlMatch[1]));
                    });

                    const videos: string[] = [];
                    $post.find('video').each((_: number, vidEl: any) => {
                        const src = absUrl($(vidEl).attr('src'));
                        if (src) videos.push(src);
                    });

                    // Capture Video Thumbnails as images
                    $post.find('.tgme_widget_message_video_player, .tgme_widget_message_video_wrap').each((_: number, vEl: any) => {
                        const style = $(vEl).attr('style') || "";
                        const urlMatch = style.match(/background-image:url\('([^']+)'\)/);
                        if (urlMatch) {
                            const u = absUrl(urlMatch[1]);
                            if (u && !images.includes(u)) images.push(u);
                        }
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

                    const newsCandidates = grouped.reverse().slice(0, 40);
                    
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

                        const { error: upsertError } = await supabaseAdmin.from('posts').upsert(dbData, { onConflict: 'telegram_id, language' });
                        if (upsertError) console.error("Supabase Upsert Error:", upsertError);
                        else console.log(`Telegram Sync: Successfully synced ${dbData.length} posts to Supabase`);
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

            // If article, fetch 4x limit so we can filter down to exactly enough media-only posts
            const dbLimit = (type === 'article' && !urgent) ? limit * 4 : limit;
            const fetchLimit = urgent ? 100 : dbLimit;
            const fetchOffset = urgent ? 0 : offset;

            if (!urgent) {
                if (type === 'signal') {
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
                // Tier 1: Strict Urgency (Keywords: عاجل, urgent, breaking, alert, broadcast, critical)
                const checkUrgent = (p: any) => {
                    const haystack = `${p.title} ${p.summary} ${p.content_html}`.toLowerCase();
                    return haystack.includes('عاجل') || haystack.includes('urgent') || haystack.includes('breaking') || 
                           haystack.includes('alert') || haystack.includes('broadcast') || haystack.includes('critical');
                };
                finalPosts = posts.filter(checkUrgent).slice(0, limit);

                if (finalPosts.length === 0 && lang !== 'en') {
                    const { data: fallback } = await supabaseAdmin.from('posts').select('*').eq('language', 'en').order('post_date', { ascending: false }).limit(fetchLimit);
                    if (fallback) finalPosts = fallback.filter(checkUrgent).slice(0, limit);
                }
            } else if (type === 'signal') {
                // Tier 2: Radar Flash (Strictly Text-primary intelligence WITHOUT MEDIA)
                const checkSignal = (p: any) => {
                    const title = p.title || "";
                    const content = p.content_html || "";
                    const hasImage = p.image_url && p.image_url !== '[]' && p.image_url !== 'null';
                    const hasVideo = p.has_video === true || (p.video_url && p.video_url !== '[]' && p.video_url !== 'null');
                    return (title.length > 0 || content.length > 0) && !hasImage && !hasVideo;
                };
                finalPosts = posts.filter(checkSignal).slice(0, limit);

                // RELIABILITY FALLBACK: If Arabic (or other) is empty, fetch English 
                if (finalPosts.length === 0 && lang !== 'en') {
                    const { data: fallback } = await supabaseAdmin.from('posts').select('*').eq('language', 'en').order('post_date', { ascending: false }).limit(fetchLimit);
                    if (fallback) finalPosts = fallback.filter(checkSignal).slice(0, limit);
                }
            } else if (type === 'article') {
                // Main Feed: Strictly WITH MEDIA only (images or video)
                const checkArticle = (p: any) => {
                    const hasImage = p.image_url && p.image_url !== '[]' && p.image_url !== 'null';
                    const hasVideo = p.has_video === true || (p.video_url && p.video_url !== '[]' && p.video_url !== 'null');
                    return hasImage || hasVideo;
                };
                finalPosts = posts.filter(checkArticle).slice(0, limit);
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
                hasMore: !urgent && posts.length === fetchLimit,
                nextOffset: fetchOffset + posts.length
            });
        }

        return NextResponse.json({ posts: [] });
    } catch (error: any) {
        console.error("News API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
