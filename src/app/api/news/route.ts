import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Initialize AI
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
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const limit = parseInt(searchParams.get('limit') || '40');
    const offset = parseInt(searchParams.get('offset') || '0');
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type'); // 'signal' (no media) or 'article' (has media)

    // 1. SYNC ATOMICALLY (EN + AR)
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

                // Deduping
                const groupedMap = new Map();
                for (const p of scraped) {
                    const key = `${p.date}_${p.plainText.substring(0, 10)}`;
                    if (groupedMap.has(key)) {
                        const existing = groupedMap.get(key);
                        const parse = (v: any) => v ? JSON.parse(v) : [];
                        const mI = [...new Set([...parse(existing.imageUrl), ...parse(p.imageUrl)])].slice(0, 5);
                        const mV = [...new Set([...parse(existing.videoUrl), ...parse(p.videoUrl)])].slice(0, 5);
                        existing.imageUrl = mI.length > 0 ? JSON.stringify(mI) : null;
                        existing.videoUrl = mV.length > 0 ? JSON.stringify(mV) : null;
                    } else {
                        groupedMap.set(key, p);
                    }
                }

                const toUpsert = Array.from(groupedMap.values()).reverse();
                if (toUpsert.length > 0) {
                    const { data: exist } = await supabase.from('global_posts').select('telegram_id').in('telegram_id', toUpsert.map(p => p.id));
                    const existSet = new Set(exist?.map(p => p.telegram_id));

                    let news = toUpsert.filter(p => !existSet.has(p.id)).slice(0, 20);

                    if (news.length > 0 && ai) {
                        const batch = news.map((p, i) => `[${i}] ${p.plainText.substring(0, 800) || "Media"}`);
                        try {
                            const res = await ai.models.generateContent({
                                model: 'gemini-2.0-flash',
                                contents: [{ role: 'user', parts: [{ text: `Task: Translate the following news snippets into English AND Arabic. Output ONLY JSON. Form: { "items": { "0": { "en_title": "...", "en_summary": "...", "ar_title": "...", "ar_summary": "...", "tag": "politics|tech|market|world" } } } \n\nBatch: ${batch.join('\n')}` }] }]
                            });
                            const aiText = res.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                            const json = JSON.parse(aiText.replace(/```json|```/gi, '').trim() || '{}');

                            const dbData = news.map((p, idx) => {
                                const item = json.items?.[idx.toString()] || {};
                                return {
                                    telegram_id: p.id,
                                    title_en: item.en_title || "Intelligence Alert",
                                    summary_en: item.en_summary || "See detailed report.",
                                    tag_en: item.tag || "world",
                                    content_html_en: p.textHtml,
                                    title_ar: item.ar_title || "تنبيه استخباراتي",
                                    summary_ar: item.ar_summary || "انظر التقرير المفضل.",
                                    tag_ar: item.tag || "world",
                                    content_html_ar: p.textHtml,
                                    image_url: p.imageUrl,
                                    has_video: p.hasVideo,
                                    video_url: p.videoUrl,
                                    post_date: p.date,
                                    views: p.views
                                };
                            });
                            await supabase.from('global_posts').upsert(dbData, { onConflict: 'telegram_id' });
                        } catch (e) { console.error("Atomic Sync Failed", e); }
                    }
                }
            }
        } catch (e) { console.error("Sync partial fail", e); }
    }

    // 2. FETCH FROM THE NEW UNIFIED TABLE
    let query = supabase.from('global_posts').select('*');

    if (q) {
        query = query.or(`title_en.ilike.%${q}%,title_ar.ilike.%${q}%,summary_en.ilike.%${q}%,summary_ar.ilike.%${q}%`);
    }

    if (type === 'article') {
        query = query.or('image_url.not.is.null,video_url.not.is.null');
    }

    const { data: posts, error: err } = await query
        .order('post_date', { ascending: false })
        .range(offset, offset + limit - 1);

    if (err) throw err;

    const formatted = (posts || []).map(p => ({
        id: p.telegram_id,
        textHtml: lang === 'ar' ? p.content_html_ar : p.content_html_en,
        imageUrl: p.image_url,
        hasVideo: p.has_video,
        videoUrl: p.video_url,
        date: p.post_date,
        views: p.views,
        aiTitle: lang === 'ar' ? p.title_ar : p.title_en,
        aiSummary: lang === 'ar' ? p.summary_ar : p.summary_en,
        aiTag: lang === 'ar' ? p.tag_ar : p.tag_en
    }));

    return NextResponse.json({ posts: formatted, hasMore: formatted.length === limit });
}

