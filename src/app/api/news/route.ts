import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Pro allows 300s; Hobby allows 60s

// Optional AI init
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function freeTranslate(text: string, targetLang: string) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0].map((item: any) => item[0]).join('');
    } catch {
        return text;
    }
}

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            { error: 'Supabase missing configuration (Requires anon key)', posts: [] },
            { status: 503 }
        );
    }
    
    // Default to anon client for reading
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Use Service Role to bypass RLS for UPSERTs inside Server API Route, if available
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    try {
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'en';
        const limit = parseInt(searchParams.get('limit') || '40');
        const offset = parseInt(searchParams.get('offset') || '0');
        const q = searchParams.get('q') || '';
        const type = searchParams.get('type'); // 'signal' (no media) or 'article' (has media)
        const targetLanguage = lang === 'ar' ? 'Arabic' : 'English';

        // SYNC LOGIC (Only on start/refresh)
        if (offset === 0 && !q) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                const response = await fetch('https://t.me/s/alertvice', {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    cache: 'no-store',
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    let scraped: any[] = [];

                    $('.tgme_widget_message').each((_, el) => {
                        let id = $(el).attr('data-post');
                        if (id && !id.includes('/')) id = `alertvice/${id}`;

                        const textEl = $(el).find('.tgme_widget_message_text');
                        const textHtml = textEl.html() || '';
                        const plainText = textEl.text().trim() || '';

                        let imgs: string[] = [];
                        let vids: string[] = [];

                        $(el).find('video').each((_, v) => {
                            const src = $(v).attr('src');
                            if (src) vids.push(src);
                        });

                        $(el).find('.tgme_widget_message_photo_wrap, .tgme_widget_message_video_thumb').each((_, p) => {
                            const style = $(p).attr('style') || '';
                            const match = style.match(/background-image:url\(['"]?(.*?)['"]?\)/);
                            if (match && match[1]) imgs.push(match[1]);
                        });

                        const date = $(el).find('.tgme_widget_message_date time').attr('datetime');
                        const vws = $(el).find('.tgme_widget_message_views').text();

                        if (id && (textHtml || imgs.length > 0 || vids.length > 0)) {
                            scraped.push({
                                id, textHtml, plainText,
                                imageUrl: imgs.length > 0 ? JSON.stringify(imgs) : null,
                                videoUrl: vids.length > 0 ? JSON.stringify(vids) : null,
                                hasVideo: vids.length > 0 || $(el).find('.tgme_widget_message_video_player').length > 0,
                                date: date || new Date().toISOString(),
                                views: vws || '0'
                            });
                        }
                    });

                    // ADVANCED GROUPING (Albums & Multi-post updates)
                    const grouped: any[] = [];
                    let last: any = null;

                    for (const post of scraped) {
                        if (last && last.date === post.date && (last.plainText === post.plainText || !post.plainText || !last.plainText)) {
                            const parse = (v: any) => v ? JSON.parse(v) : [];
                            // Merging with 5/5 LIMIT as requested
                            const mergedImgs = [...new Set([...parse(last.imageUrl), ...parse(post.imageUrl)])].slice(0, 5);
                            const mergedVids = [...new Set([...parse(last.videoUrl), ...parse(post.videoUrl)])].slice(0, 5);

                            last.imageUrl = mergedImgs.length > 0 ? JSON.stringify(mergedImgs) : null;
                            last.videoUrl = mergedVids.length > 0 ? JSON.stringify(mergedVids) : null;
                            last.hasVideo = last.hasVideo || post.hasVideo;
                            if (!last.plainText) {
                                last.plainText = post.plainText;
                                last.textHtml = post.textHtml;
                            }
                        } else {
                            grouped.push(post);
                            last = post;
                        }
                    }

                    const toUpsert = grouped.reverse();
                    if (toUpsert.length > 0) {
                        const { data: exist } = await supabase.from('posts').select('telegram_id, title').eq('language', lang).in('telegram_id', toUpsert.map(p => p.id));
                        const existMap = new Map(exist?.map(p => [p.telegram_id, p.title]));

                        let news = toUpsert.filter(p => !existMap.has(p.id) || (lang === 'en' && /[\u0600-\u06FF]/.test(existMap.get(p.id) || '')));
                        news = news.slice(0, 15); // Smaller batch for performance

                        if (news.length > 0) {
                            if (ai) {
                                const prompts = news.map((p, i) => `[${i}] ${p.plainText.substring(0, 600) || "Media Intel"}`);
                                try {
                                    const res = await ai.models.generateContent({
                                        model: 'gemini-2.0-flash',
                                        contents: [{ role: 'user', parts: [{ text: `Task: Translate the following news snippets into ${targetLanguage}. Output ONLY JSON. Form: { "items": { "0": { "title": "...", "summary": "...", "tag": "politics|tech|market|world" } } } \n\nBatch: ${prompts.join('\n')}` }] }]
                                    });
                                    const aiText = res.candidates?.[0]?.content?.parts?.[0]?.text || "";
                                    const json = JSON.parse(aiText.replace(/```json|```/gi, '').trim() || '{}');
                                    news.forEach((p, idx) => {
                                        const item = json.items?.[idx.toString()];
                                        if (item) {
                                            p.aiTitle = item.title;
                                            p.aiSummary = item.summary;
                                            p.aiTag = item.tag;
                                        }
                                    });
                                } catch (e) { console.error("AI Error", e); }
                            }

                            await Promise.allSettled(news.map(async (p) => {
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

                            const dbData = news.map(p => ({
                                telegram_id: p.id,
                                title: p.aiTitle,
                                summary: p.aiSummary,
                                tag: p.aiTag,
                                content_html: p.textHtml,
                                image_url: p.imageUrl,
                                has_video: p.hasVideo,
                                video_url: p.videoUrl,
                                post_date: p.date,
                                views: p.views,
                                language: lang
                            }));
                            if (supabaseAdmin) {
                                const { error: upsertErr } = await supabaseAdmin.from('posts').upsert(dbData, { onConflict: 'telegram_id, language' });
                                if (upsertErr) console.error("Supabase upsert error:", upsertErr);
                            } else {
                                console.warn("Missing SUPABASE_SERVICE_ROLE_KEY. Skipping UPSERT because of RLS.");
                            }
                        }
                    }
                }
            } catch (e) { console.error("Sync partial fail", e); }
        }

        // DATABASE FETCH WITH OPTIMIZED COMMANDS
        let query = supabase.from('posts').select('*').eq('language', lang);

        if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);

        // Type filters ALWAYS apply (even during search) to keep feeds clean
        if (type === 'signal') {
            // Signal monitor: text-only posts (no images AND no videos)
            query = query.is('image_url', null).is('video_url', null);
        } else if (type === 'article') {
            // Main feed: only posts WITH media (image or video)
            query = query.or('image_url.not.is.null,video_url.not.is.null');
        }

        const { data: posts, error: err } = await query
            .order('post_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (err) throw err;

        const formatted = (posts || []).map(p => ({
            id: p.telegram_id,
            textHtml: p.content_html,
            imageUrl: p.image_url,
            hasVideo: p.has_video,
            videoUrl: p.video_url,
            date: p.post_date,
            views: p.views,
            aiTitle: p.title,
            aiSummary: p.summary,
            aiTag: p.tag
        }));

        return NextResponse.json({ posts: formatted, hasMore: formatted.length === limit });
    } catch (error: any) {
        console.error('API Final Error:', error);
        return NextResponse.json({ error: 'Server error', posts: [] }, { status: 500 });
    }
}

