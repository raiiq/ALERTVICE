import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncTelegramChannel } from '@/lib/telegramSync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const type = searchParams.get('type') || 'article';
    const q = searchParams.get('q') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

        // 1. Sync Latest from Telegram (Library handles throttling and dual-language)
        if (offset === 0 && !q) {
            await syncTelegramChannel();
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
