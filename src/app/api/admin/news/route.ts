import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('post_date', { ascending: false })
        .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: data });
}

export async function DELETE(request: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, language } = await request.json();
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('telegram_id', id)
            .eq('language', language);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, summary, tag, language, image_url, video_url } = body;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Generate a pseudo-random telegram_id for manual posts
        const manualId = `manual_${Date.now()}`;

        const { data, error } = await supabase
            .from('posts')
            .insert([{
                telegram_id: manualId,
                title,
                summary,
                tag,
                language,
                image_url: image_url || [],
                video_url: video_url || [],
                post_date: new Date().toISOString(),
                has_video: (video_url && video_url.length > 0)
            }])
            .select();

        if (error) throw error;
        return NextResponse.json({ success: true, post: data[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, language, updates } = await request.json();
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Ensure has_video is synced if video_url is updated
        if (updates.video_url !== undefined) {
            updates.has_video = updates.video_url.length > 0;
        }

        const { error } = await supabase
            .from('posts')
            .update(updates)
            .eq('telegram_id', id)
            .eq('language', language);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
