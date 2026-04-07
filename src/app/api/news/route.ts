import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncTelegramChannel } from '@/lib/telegramSync';

// Tactical optimization: Allow edge caching while keeping dynamism
export const dynamic = 'force-dynamic';
export const revalidate = 60; // 60s baseline edge revalidation

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const type = searchParams.get('type') || 'article';
    const q = searchParams.get('q') || '';
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '30');

    try {
        const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

        // 1. Background Sync (Decoupled from blocking path)
        // Only attempt sync on the first page and if not a search
        if (offset === 0 && !q) {
            // FIRE AND FORGET: Do not await external network sync on the critical path
            (async () => {
                try {
                    // Check if we already synced recently to avoid slamming Telegram/Supabase
                    const { data: latest } = await supabaseAdmin!
                        .from('posts')
                        .select('post_date')
                        .order('post_date', { ascending: false })
                        .limit(1);
                    
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                    if (!latest?.[0] || latest[0].post_date < fiveMinutesAgo) {
                        console.log("[API News] Background Sync Initiated");
                        await syncTelegramChannel();
                    }
                } catch (e) {
                    console.error("Background sync failed silently:", e);
                }
            })();
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

            if (!urgent && posts.length === 0 && offset > 0 && !q) {
                // We reached the end of synced DB but frontend wants more
                // Run sync synchronously to provide data in THIS request
                const { data: oldest } = await supabaseAdmin.from('posts').select('telegram_id').order('telegram_id', { ascending: true }).limit(1);
                if (oldest?.[0]) {
                    await syncTelegramChannel(oldest[0].telegram_id);
                    // Refetch now that sync is done
                    const { data: refetched } = await query.range(fetchOffset, fetchOffset + fetchLimit - 1);
                    if (refetched && refetched.length > 0) {
                        finalPosts = refetched;
                    }
                }
            } else if (!urgent && posts.length < fetchLimit && !q) {
                // Near the end, background-sync for the NEXT scroll
                (async () => {
                    const { data: oldest } = await supabaseAdmin.from('posts').select('telegram_id').order('telegram_id', { ascending: true }).limit(1);
                    if (oldest?.[0]) await syncTelegramChannel(oldest[0].telegram_id);
                })();
            }

            // Intelligence Signaling Framework:
            // Ensure hasMore stays true for Articles during pagination to allow deep-sync to catch up
            const hasMore = !urgent && (posts.length === fetchLimit || (type === 'article' && offset < 5000));

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
                hasMore: hasMore,
                nextOffset: fetchOffset + posts.length
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=59',
                }
            });
        }

        return NextResponse.json({ posts: [] });
    } catch (error: any) {
        console.error("News API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
