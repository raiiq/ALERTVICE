import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { load } from 'cheerio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';
const PROXY_SECRET = "ALERTVICE_INTEL_2026";

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
const SYNC_INTERVAL = 45000; // 45 seconds

export async function syncTelegramChannel(before?: string) {
    const now = Date.now();
    // Throttle only if NOT fetching specifically older posts
    if (!before && now - lastSyncTime < SYNC_INTERVAL) {
        return { skipped: true, reason: 'Throttled' };
    }
    if (!before) lastSyncTime = now;

    try {
        const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;
        if (!supabaseAdmin) throw new Error("Supabase unavailable");

        const CHANNEL_URL = `https://t.me/s/alertvice${before ? `?before=${before}` : ''}`;
        const response = await fetch(CHANNEL_URL, { 
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
            },
            cache: 'no-store'
        });
        
        if (!response.ok) throw new Error("Telegram unreachable");

        const html = await response.text();
        const $ = load(html);
        const rawPosts: any[] = [];

        let runningDate: string | null = null;
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
                let postDate = $post.find('time[datetime]').attr('datetime') || $post.find('a.tgme_widget_message_date time').attr('datetime') || $post.find('.time').attr('datetime') || null;
                
                // Forward-fill: Telegram's standard view is oldest-to-newest.
                // If a message lacks a date, it inherits the date of the message before it.
                if (!postDate && runningDate) {
                    postDate = runningDate;
                }
                if (postDate) {
                    runningDate = postDate;
                }

                rawPosts.push({
                    id,
                    textHtml,
                    plainText,
                    imageUrl: images.length > 0 ? JSON.stringify(images) : null,
                    videoUrl: videos.length > 0 ? JSON.stringify(videos) : null,
                    hasVideo,
                    date: postDate,
                    views: $post.find('.tgme_widget_message_views').text() || "0"
                });
            }
        });

        if (rawPosts.length === 0) return { success: true, count: 0 };

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
                if (!last.date && post.date) last.date = post.date;
            } else {
                grouped.push(post);
                last = post;
            }
        }

        const fallbackDate = new Date().toISOString();
        grouped.forEach(p => {
            if (!p.date) p.date = fallbackDate;
        });

        const newsToProcess = grouped.reverse().slice(0, 100);
        
        // DUAL SYNC: We need to process both English and Arabic
        const languages = ['en', 'ar'];
        for (const lang of languages) {
            // CLONE news items specifically for this language to avoid mutation leakage
            const newsItems = newsToProcess.map(p => ({ ...p }));
            
            // Re-sync all to fix historical date issues
            const freshItems = newsItems; // Bypass skipSet
            if (freshItems.length === 0) continue;

            // AI translation if available
            if (ai) {
                const prompts = freshItems.map((p, i) => `[${i}] ${p.plainText.substring(0, 600) || "Media Intel"}`);
                try {
                    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
                    const targetName = lang === 'ar' ? 'Arabic' : 'English';
                    const promptStr = `Task: Act as a high-level intelligence analyst. Translate and summarize these news snippets into ${targetName}.
REQUIRMENTS:
1. HEADLINE: Create an EXCITING, HIGH-IMPACT headline that captures the essence of the news with tactical precision. Use powerful, active words.
2. SUMMARY: Write a FORMAL, SERIOUS, and EASY TO READ one-sentence summary. It should sound like a professional intelligence briefing.
3. LANGUAGE: Output strictly in ${targetName}.
4. TAG: Assign a tactical tag: [politics|military|market|world|security].

Output ONLY JSON.
Form: { "items": { "0": { "title": "HEADLINE", "summary": "SUMMARY", "tag": "TAG" } } }
Batch: ${prompts.join('\n')}`;

                    const result = await model.generateContent(promptStr);
                    const response = await result.response;
                    const aiText = response.text();
                    const json = JSON.parse(aiText.replace(/```json|```/gi, '').trim() || '{}');
                    
                    freshItems.forEach((p, idx) => {
                        const item = json.items?.[idx.toString()];
                        if (item) {
                            p.aiTitle = item.title;
                            p.aiSummary = item.summary;
                            p.aiTag = item.tag;
                        }
                    });
                } catch (e) { console.error(`AI Batch failed for ${lang}`, e); }
            }

            // Fallback
            await Promise.allSettled(freshItems.map(async (p) => {
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

            const dbData = freshItems.map(p => {
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

        return { success: true, count: newsToProcess.length };
    } catch (e: any) {
        console.error("Master Sync Failure:", e);
        return { success: false, error: e.message };
    }
}
