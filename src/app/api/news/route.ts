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

                // Deduping & Album Packaging
                const groupedMap = new Map();
                for (const p of scraped) {
                    // Use date + first 20 chars as a heuristic for albums (Telegram posts albums with same text)
                    const key = `${p.date}_${p.plainText.substring(0, 20)}`;
                    if (groupedMap.has(key)) {
                        const existing = groupedMap.get(key);
                        const parse = (v: any) => v ? JSON.parse(v) : [];
                        const mI = [...new Set([...parse(existing.imageUrl), ...parse(p.imageUrl)])].slice(0, 10);
                        const mV = [...new Set([...parse(existing.videoUrl), ...parse(p.videoUrl)])].slice(0, 5);
                        existing.imageUrl = mI.length > 0 ? JSON.stringify(mI) : null;
                        existing.videoUrl = mV.length > 0 ? JSON.stringify(mV) : null;
                        if (p.hasVideo) existing.hasVideo = true;
                    } else {
                        groupedMap.set(key, p);
                    }
                }

                const toUpsert = Array.from(groupedMap.values()).reverse();
                if (toUpsert.length > 0) {
                    // Check existence by id
                    const idsJson = toUpsert.map(p => p.id);
                    const { data: exist } = await supabase.from('global_posts').select('id').in('id', idsJson);
                    const existSet = new Set(exist?.map(p => p.id));

                    // Sync the 15 most recent unsynced posts
                    let news = toUpsert.filter(p => !existSet.has(p.id)).slice(0, 15);

                    if (news.length > 0) {
                        try {
                            let dbData;
                            if (ai) {
                                const batch = news.map((p, i) => `[${i}] ${p.plainText.substring(0, 1000) || "Visual Intelligence Report"}`);
                                const res = await ai.models.generateContent({
                                    model: 'gemini-2.0-flash',
                                    contents: [{
                                        role: 'user', parts: [{
                                            text: `Task: Analyze and translate these 15 news snippets into English AND Arabic. 
                                    For EACH snippet, give:
                                    1. en_title (Catchy, capitalised, max 10 words)
                                    2. en_summary (Professional, max 30 words)
                                    3. ar_title (Clear Arabic headline)
                                    4. ar_summary (Professional Arabic summary)
                                    5. tag (ONE OF: politics, tech, market, world, security)
                                    
                                    Output ONLY RAW JSON in this form: { "items": { "0": { "en_title": "...", ... }, "1": { ... } } }
                                    
                                    Snippets:
                                    ${batch.join('\n')}`
                                        }]
                                    }]
                                });

                                const aiRaw = res.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                                const cleanJson = JSON.parse(aiRaw.replace(/```json|```/gi, '').trim() || '{}');

                                dbData = news.map((p, idx) => {
                                    const item = cleanJson.items?.[idx.toString()] || {};
                                    return {
                                        id: p.id,
                                        title_en: item.en_title || (p.plainText ? p.plainText.substring(0, 60) + "..." : "Signal Intercepted"),
                                        summary_en: item.en_summary || p.plainText.substring(0, 200),
                                        tag_en: item.tag || "world",
                                        content_en: p.textHtml,
                                        title_ar: item.ar_title || "تنبيه استخباراتي",
                                        summary_ar: item.ar_summary || "تحديث إخباري جديد.",
                                        tag_ar: item.tag || "world",
                                        content_ar: p.textHtml,
                                        image_url: p.imageUrl,
                                        has_video: p.hasVideo,
                                        video_url: p.videoUrl,
                                        date: p.date,
                                        views: p.views
                                    };
                                });
                            } else {
                                // NO AI FALLBACK - SMART EXTRACTION
                                dbData = news.map(p => {
                                    const lines = p.plainText.split('\n').filter((l: string) => l.trim().length > 0);
                                    let title = lines[0] || "Intelligence Report";
                                    if (title.length > 80) title = title.substring(0, 77) + "...";

                                    let summary = lines.slice(1).join(' ').substring(0, 200);
                                    if (!summary && p.plainText.length > title.length) {
                                        summary = p.plainText.substring(title.length, title.length + 200).trim();
                                    }

                                    return {
                                        id: p.id,
                                        title_en: title,
                                        summary_en: summary || "Automated intelligence capture.",
                                        tag_en: "world",
                                        content_en: p.textHtml,
                                        title_ar: title, // Use same title as fallback if no AI
                                        summary_ar: summary || "التقاط استخباراتي آلي.",
                                        tag_ar: "world",
                                        content_ar: p.textHtml,
                                        image_url: p.imageUrl,
                                        has_video: p.hasVideo,
                                        video_url: p.videoUrl,
                                        date: p.date,
                                        views: p.views
                                    };
                                });
                            }

                            if (dbData && dbData.length > 0) {
                                await supabase.from('global_posts').upsert(dbData, { onConflict: 'id' });
                            }
                        } catch (e) {
                            console.error("Critical Sync Catch:", e);
                            const fallbackData = news.map(p => ({
                                id: p.id,
                                title_en: "Intelligence Alert",
                                title_ar: "تنبيه استخباراتي",
                                date: p.date,
                                image_url: p.imageUrl,
                                content_en: p.textHtml,
                                content_ar: p.textHtml,
                                views: p.views
                            }));
                            await supabase.from('global_posts').upsert(fallbackData, { onConflict: 'id' });
                        }
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
        // Main feed should show EVERYTHING to avoid empty sections.
        // We don't filter by image_url here anymore.
    } else if (type === 'signal') {
        // Signals are specific text-only alerts for the sidebar
        query = query.is('image_url', null).is('video_url', null);
    }

    const { data: posts, error: err } = await query
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

    if (err) {
        console.error("Supabase query error:", err);
        return NextResponse.json({ posts: [], hasMore: false, error: err.message });
    }

    const formatted = (posts || []).map(p => ({
        id: p.id,
        textHtml: lang === 'ar' ? p.content_ar : p.content_en,
        imageUrl: p.image_url,
        hasVideo: p.has_video,
        videoUrl: p.video_url,
        date: p.date,
        views: p.views,
        aiTitle: lang === 'ar' ? p.title_ar : p.title_en,
        aiSummary: lang === 'ar' ? p.summary_ar : p.summary_en,
        aiTag: lang === 'ar' ? p.tag_ar : p.tag_en
    }));

    return NextResponse.json({ posts: formatted, hasMore: formatted.length === limit });
}

