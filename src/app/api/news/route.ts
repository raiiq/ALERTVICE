import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
    try {
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'en';
        const limitStr = searchParams.get('limit') || '40';
        const offsetStr = searchParams.get('offset') || '0';

        const limit = parseInt(limitStr);
        const offset = parseInt(offsetStr);
        const q = searchParams.get('q') || '';
        const targetLanguage = lang === 'ar' ? 'Arabic' : 'English';

        // Only sync with Telegram on the first page load (offset 0 and no search query)
        if (offset === 0 && !q) {
            try {
                const response = await fetch('https://t.me/s/alertvice', {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    cache: 'no-store'
                });

                if (response.ok) {
                    const html = await response.text();
                    let allHtml = html;
                    let $ = cheerio.load(html);

                    let currentLink: string | null | undefined = $('a.tme_extra_link[href*="before="]').attr('href');
                    let pagesCrawled = 0;

                    while (currentLink && pagesCrawled < 2) {
                        try {
                            const olderRes = await fetch(`https://t.me${currentLink}`, {
                                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
                                cache: 'no-store'
                            });
                            if (olderRes.ok) {
                                const olderHtml = await olderRes.text();
                                allHtml = olderHtml + allHtml;
                                const $older = cheerio.load(olderHtml);
                                currentLink = $older('a.tme_extra_link[href*="before="]').attr('href');
                                pagesCrawled++;
                            } else {
                                currentLink = null;
                            }
                        } catch (e) {
                            break;
                        }
                    }

                    const $all = cheerio.load(allHtml);
                    let scrapedPosts: any[] = [];

                    $all('.tgme_widget_message').each((i, el) => {
                        let id = $all(el).attr('data-post');

                        // Normalize ID: ensure it has the channel prefix to prevent duplicates like '3801' vs 'alertvice/3801'
                        if (id && !id.includes('/')) {
                            id = `alertvice/${id}`;
                        }

                        const textElement = $all(el).find('.tgme_widget_message_text');
                        const textHtml = textElement.html() || '';
                        const plainText = textElement.text().trim() || '';

                        let imageUrls: string[] = [];
                        let videoUrls: string[] = [];

                        // Collect all videos
                        $all(el).find('video').each((_, v) => {
                            const src = $all(v).attr('src');
                            if (src) videoUrls.push(src);
                        });

                        // Collect all photos from style backgrounds
                        $all(el).find('.tgme_widget_message_photo_wrap, .tgme_widget_message_video_thumb').each((_, p) => {
                            const style = $all(p).attr('style') || '';
                            const match = style.match(/background-image:url\(['"]?(.*?)['"]?\)/);
                            if (match && match[1]) imageUrls.push(match[1]);
                        });

                        const hasVideo = videoUrls.length > 0 || $all(el).find('.tgme_widget_message_video_player').length > 0;
                        const dateStr = $all(el).find('.tgme_widget_message_date time').attr('datetime');
                        const views = $all(el).find('.tgme_widget_message_views').text();

                        if (id && (textHtml || imageUrls.length > 0 || hasVideo)) {
                            scrapedPosts.push({
                                id,
                                textHtml,
                                plainText,
                                // Store multiple as JSON if > 1, else single string
                                imageUrl: imageUrls.length > 1 ? JSON.stringify(imageUrls) : (imageUrls[0] || null),
                                hasVideo,
                                videoUrl: videoUrls.length > 1 ? JSON.stringify(videoUrls) : (videoUrls[0] || null),
                                date: dateStr || new Date().toISOString(),
                                views: views || '0'
                            });
                        }
                    });

                    // IMPORTANT: Reverse so we process NEWEST ones first
                    scrapedPosts = scrapedPosts.reverse();

                    if (scrapedPosts.length > 0) {
                        // Fetch both ID and title to check if translation is needed
                        const { data: existingPosts } = await supabase
                            .from('posts')
                            .select('telegram_id, title')
                            .eq('language', lang)
                            .in('telegram_id', scrapedPosts.map(p => p.id));

                        const existingMap = new Map((existingPosts || []).map(p => [p.telegram_id, p.title]));

                        // Detect Arabic in titles for English language
                        const containsArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

                        let newPosts = scrapedPosts.filter(p => {
                            if (!existingMap.has(p.id)) return true; // Missing
                            if (lang === 'en' && containsArabic(existingMap.get(p.id) || '')) return true; // Needs re-translation
                            return false;
                        });

                        // Limit batch for stability
                        newPosts = newPosts.slice(0, 20);

                        if (newPosts.length > 0) {
                            if (ai) {
                                try {
                                    const prompts = newPosts.map((p, idx) => `[${idx}] ${p.plainText.substring(0, 700) || "(Visual Update)"}`);

                                    const result = await ai.models.generateContent({
                                        model: 'gemini-2.0-flash',
                                        contents: [{
                                            role: 'user',
                                            parts: [{
                                                text: `You are a world-class news translator and editor. 
                                                TASK: Translate the following news snippets from Arabic to ${targetLanguage} and provide a summary.
                                                
                                                REQUIREMENTS:
                                                - EVERYTHING in the output (titles and summaries) must be in the ${targetLanguage} language.
                                                - Title: Dramatic, 5-10 word headline.
                                                - Summary: Concise, 1-2 sentences capturing the core intel.
                                                - Category: Choose exactly one: "politics", "tech", "market", or "world".
                                                
                                                OUTPUT FORMAT (STRICT JSON):
                                                { "items": { "0": { "title": "...", "summary": "...", "tag": "..." } } }
                                                
                                                TEXT BATCH:
                                                ${prompts.join('\n')}`
                                            }]
                                        }]
                                    });

                                    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
                                    const cleanJson = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
                                    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);

                                    if (jsonMatch) {
                                        const parsed = JSON.parse(jsonMatch[0]);
                                        newPosts.forEach((p, idx) => {
                                            const item = parsed.items && parsed.items[idx.toString()];
                                            if (item && item.title && item.summary) {
                                                p.aiTitle = item.title;
                                                p.aiSummary = item.summary;
                                                p.aiTag = item.tag;
                                            }
                                        });
                                    }
                                } catch (aiErr) {
                                    console.error("AI Generation Error:", aiErr);
                                }
                            }

                            // FALLBACK TRANSLATION (If AI failed or missed some posts)
                            for (const p of newPosts) {
                                if (!p.aiTitle || !p.aiSummary) {
                                    const fallbackTitle = p.plainText ? p.plainText.substring(0, 60) : "Visual Intelligence Update";
                                    const fallbackSummary = p.plainText ? p.plainText.substring(0, 200) : "New media content received via Telegram intelligence channel.";

                                    p.aiTitle = await freeTranslate(fallbackTitle, lang);
                                    p.aiSummary = await freeTranslate(fallbackSummary, lang);
                                    p.aiTag = "world";
                                }
                            }

                            const dbUpserts = newPosts.map(p => ({
                                telegram_id: p.id,
                                title: p.aiTitle,
                                summary: p.aiSummary,
                                tag: p.aiTag || "world",
                                content_html: p.textHtml,
                                image_url: p.imageUrl,
                                has_video: p.hasVideo,
                                video_url: p.videoUrl,
                                post_date: p.date,
                                views: p.views,
                                language: lang
                            }));

                            await supabase.from('posts').upsert(dbUpserts, { onConflict: 'telegram_id, language' });
                        }
                    }
                }
            } catch (syncError) {
                console.error("Background sync failed:", syncError);
            }
        }

        // FETCH FROM DB WITH PAGINATION AND SEARCH
        let queryBuilder = supabase
            .from('posts')
            .select('*')
            .eq('language', lang);

        if (q) {
            queryBuilder = queryBuilder.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
        }

        const { data: finalPosts, error: dbError } = await queryBuilder
            .order('post_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (dbError) throw dbError;

        const formattedPosts = (finalPosts || []).map(p => ({
            id: p.telegram_id,
            textHtml: p.content_html,
            plainText: "",
            imageUrl: p.image_url,
            hasVideo: p.has_video,
            videoUrl: p.video_url,
            date: p.post_date,
            views: p.views,
            aiTitle: p.title,
            aiSummary: p.summary,
            aiTag: p.tag
        }));

        return NextResponse.json({ posts: formattedPosts, hasMore: formattedPosts.length === limit });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch news', details: error.message }, { status: 500 });
    }
}
