import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extend Vercel serverless timeout

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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15, params is a Promise
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'en';
        const targetLanguage = lang === 'ar' ? 'Arabic' : 'English';

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Default client for reading
        const supabase = createClient(supabaseUrl, supabaseKey);
        // Admin client for bypass RLS if key is present
        const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

        // Check DB First for persistence
        const { data: dbPost } = await supabase
            .from('posts')
            .select('*')
            .eq('telegram_id', id)
            .eq('language', lang)
            .single();

        if (dbPost) {
            return NextResponse.json({
                post: {
                    id: `alertvice/${dbPost.telegram_id}`,
                    dbId: dbPost.id,
                    textHtml: dbPost.content_html,
                    plainText: "",
                    imageUrl: dbPost.image_url,
                    hasVideo: dbPost.has_video,
                    videoUrl: dbPost.video_url,
                    aiTitle: dbPost.title,
                    aiTag: dbPost.tag,
                    date: dbPost.post_date,
                    views: dbPost.views
                }
            });
        }

        // Fetching the embed view of a single message if not found in DB
        const response = await fetch(`https://t.me/alertvice/${id}?embed=1`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from Telegram, status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const el = $('.tgme_widget_message').first();
        if (!el.length) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Get the message text including HTML formatting
        const textElement = $(el).find('.tgme_widget_message_text');
        const textHtml = textElement.html() || '';
        const plainText = textElement.text().trim() || '';

        // Extract image/video URL
        let imageUrl = null;
        let hasVideo = false;
        let videoUrl = null;

        const videoEl = $(el).find('video').first();
        if (videoEl.length) {
            hasVideo = true;
            videoUrl = videoEl.attr('src') || null;
        } else if ($(el).find('.tgme_widget_message_video_player').length) {
            hasVideo = true;
        }

        const photoEl = $(el).find('.tgme_widget_message_photo_wrap, .tgme_widget_message_video_thumb').first();
        if (photoEl.length) {
            const style = photoEl.attr('style') || '';
            const match = style.match(/background-image:url\(['"]?(.*?)['"]?\)/);
            if (match && match[1]) {
                imageUrl = match[1];
            }
        }

        if (!imageUrl) {
            const imgEl = $(el).find('img.tgme_widget_message_photo').first();
            if (imgEl.length) {
                imageUrl = imgEl.attr('src') || imageUrl;
            }
        }

        const dateStr = $(el).find('.tgme_widget_message_date time').attr('datetime');
        const views = $(el).find('.tgme_widget_message_views').text();

        let aiTitle = lang === 'ar' ? "تحديث عاجل" : "BREAKING ALERT";
        let aiFormattedHtml = null;
        let aiTag = "politics";

        // Generate AI Title, Translated Article & Tag
        if (ai && plainText) {
            try {
                const aiRes = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You are an expert news editor. Evaluate the following telegram post: "${plainText}". \n\n1. Translate it into natural, professional ${targetLanguage}.\n2. Turn it into a well-formatted web news article using basic HTML tags (<p>, <br>, <strong>).\n3. Provide a dramatic 5-10 word headline in ${targetLanguage}.\n4. Categorize the news into a single tag strictly chosen from: "politics", "tech", "market", or "world" (keep the tag in English). If unsure, use "politics".\n\nOutput strictly JSON: { "title": "...", "html": "...", "tag": "..." }`
                });
                const responseText = aiRes.text || "";
                const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    aiTitle = parsed.title || aiTitle;
                    aiFormattedHtml = parsed.html || null;
                    aiTag = parsed.tag || aiTag;
                }
            } catch (e) {
                console.error("Single AI Title gen failed", e);
            }
        } else {
            const lText = plainText.toLowerCase();
            if (lText.includes("سوق") || lText.includes("أسهم") || lText.includes("شراء") || lText.includes("بيع") || lText.includes("سعر") || lText.includes("اقتصاد") || lText.includes("دولار") || lText.includes("تداول") || lText.includes("buy") || lText.includes("sell") || lText.includes("stock") || lText.includes("market") || lText.includes("price") || lText.includes("economy")) aiTag = "market";
            else if (lText.includes("تقنية") || lText.includes("تطبيق") || lText.includes("برمج") || lText.includes("تحديث") || lText.includes("اختراق") || lText.includes("ذكاء اصطناعي") || lText.includes("هاتف") || lText.includes("app") || lText.includes("software") || lText.includes("tech") || lText.includes("hack") || lText.includes("update") || lText.includes("platform")) aiTag = "tech";
            else if (lText.includes("رئيس") || lText.includes("حكومة") || lText.includes("انتخاب") || lText.includes("حرب") || lText.includes("سياسة") || lText.includes("عسكري") || lText.includes("وزير") || lText.includes("جيش") || lText.includes("gov") || lText.includes("president") || lText.includes("election") || lText.includes("politics") || lText.includes("war") || lText.includes("military")) aiTag = "politics";
            else if (lText.includes("عالم") || lText.includes("دول") || lText.includes("أمم") || lText.includes("أزمة") || lText.includes("world") || lText.includes("global") || lText.includes("international")) aiTag = "world";

            if (plainText.length > 10) {
                const words = plainText.split(' ').slice(0, 10);
                const [titleRes, summaryRes] = await Promise.all([
                    freeTranslate(`${words.join(' ')}...`, lang),
                    freeTranslate(plainText, lang)
                ]);
                aiTitle = titleRes;
                aiFormattedHtml = `<p>${summaryRes}</p>`;
            }
        }

        // Save to DB for persistence if we have admin rights
        let dbId = null;
        if (supabaseAdmin) {
            const { data: upsertData, error: upsertErr } = await supabaseAdmin.from('posts').upsert({
                telegram_id: id,
                title: aiTitle,
                summary: null,
                tag: aiTag,
                content_html: aiFormattedHtml || textHtml,
                image_url: imageUrl,
                has_video: hasVideo,
                video_url: videoUrl,
                post_date: dateStr || new Date().toISOString(),
                views: views || '0',
                language: lang
            }).select('id').single();
            if (upsertErr) console.error("Supabase upsert error (single):", upsertErr);
            else dbId = upsertData?.id;
        }

        const post = {
            id: `alertvice/${id}`,
            dbId,
            textHtml: aiFormattedHtml || textHtml,
            plainText,
            imageUrl,
            hasVideo,
            videoUrl,
            aiTitle,
            aiTag,
            date: dateStr || new Date().toISOString(),
            views: views || '0'
        };

        return NextResponse.json({ post });
    } catch (error: any) {
        console.error(`Error fetching Telegram news (ID: ${error?.message}):`, error);
        return NextResponse.json({ error: 'Failed to fetch news item', details: error.message }, { status: 500 });
    }
}
