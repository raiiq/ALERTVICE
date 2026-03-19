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

            if (type === 'article') {
                // Main Feed: Strictly WITH MEDIA only (images or video)
                query = query.or('has_video.eq.true,image_url.not.is.null');
            } else if (type === 'signal') {
                // Radar Flash: Strictly NO MEDIA
                query = query.filter('has_video', 'eq', false).filter('image_url', 'is', null);
            }

            const fetchLimit = urgent ? 100 : limit;
            const fetchOffset = urgent ? 0 : offset;

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
            } else if (type === 'signal' && finalPosts.length === 0 && lang !== 'en') {
                // RELIABILITY FALLBACK: If Arabic (or other) is empty, fetch English 
                const { data: fallback } = await supabaseAdmin.from('posts')
                    .select('*')
                    .eq('language', 'en')
                    .filter('has_video', 'eq', false)
                    .filter('image_url', 'is', null)
                    .order('post_date', { ascending: false })
                    .limit(fetchLimit);
                if (fallback) finalPosts = fallback;
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
