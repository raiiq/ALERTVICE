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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'en';

        // 1. Check Unified Table First
        const { data: dbPost } = await supabase
            .from('global_posts')
            .select('*')
            .eq('id', id.includes('/') ? id : `alertvice/${id}`)
            .single();

        if (dbPost) {
            return NextResponse.json({
                post: {
                    id: dbPost.id,
                    textHtml: lang === 'ar' ? dbPost.content_ar : dbPost.content_en,
                    imageUrl: dbPost.image_url,
                    hasVideo: dbPost.has_video,
                    videoUrl: dbPost.video_url,
                    aiTitle: lang === 'ar' ? dbPost.title_ar : dbPost.title_en,
                    aiTag: lang === 'ar' ? dbPost.tag_ar : dbPost.tag_en,
                    aiSummary: lang === 'ar' ? dbPost.summary_ar : dbPost.summary_en,
                    date: dbPost.date,
                    views: dbPost.views
                }
            });
        }

        // 2. If not in DB, perform an emergency fetch and sync BOTH languages
        const response = await fetch(`https://t.me/alertvice/${id}?embed=1`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);
            const el = $('.tgme_widget_message').first();

            if (el.length) {
                const textEl = $(el).find('.tgme_widget_message_text');
                const plainText = textEl.text().trim();
                const textHtml = textEl.html() || '';

                let imageUrl = null;
                const photoEl = $(el).find('.tgme_widget_message_photo_wrap, .tgme_widget_message_video_thumb').first();
                if (photoEl.length) {
                    const style = photoEl.attr('style') || '';
                    const match = style.match(/background-image:url\(['"]?(.*?)['"]?\)/);
                    if (match && match[1]) imageUrl = match[1];
                }

                if (ai && plainText) {
                    const aiRes = await ai.models.generateContent({
                        model: 'gemini-2.0-flash',
                        contents: [{ role: 'user', parts: [{ text: `Task: Translate this into English AND Arabic. "${plainText.substring(0, 1000)}". Output JSON: { "en_title": "...", "en_summary": "...", "ar_title": "...", "ar_summary": "...", "tag": "..." }` }] }]
                    });
                    const aiText = aiRes.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                    const item = JSON.parse(aiText.replace(/```json|```/gi, '').trim() || '{}');

                    const dbData = {
                        id: `alertvice/${id}`,
                        title_en: item.en_title || "Alert",
                        summary_en: item.en_summary || "",
                        tag_en: item.tag || "world",
                        content_en: textHtml,
                        title_ar: item.ar_title || "تنبيه",
                        summary_ar: item.ar_summary || "",
                        tag_ar: item.tag || "world",
                        content_ar: textHtml,
                        image_url: imageUrl ? JSON.stringify([imageUrl]) : null,
                        has_video: $(el).find('video').length > 0,
                        date: $(el).find('.tgme_widget_message_date time').attr('datetime') || new Date().toISOString(),
                        views: $(el).find('.tgme_widget_message_views').text() || '0'
                    };

                    await supabase.from('global_posts').upsert(dbData);

                    return NextResponse.json({
                        post: {
                            id: dbData.id,
                            textHtml: lang === 'ar' ? dbData.content_ar : dbData.content_en,
                            imageUrl: dbData.image_url,
                            hasVideo: dbData.has_video,
                            aiTitle: lang === 'ar' ? dbData.title_ar : dbData.title_en,
                            date: dbData.date,
                            views: dbData.views
                        }
                    });
                }
            }
        }

        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
