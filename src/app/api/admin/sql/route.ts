import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { query } = await request.json();
        
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Use RPC to execute raw SQL (requires the exec_sql function to be created in Supabase)
        const { data, error } = await supabase.rpc('exec_sql', {
            query_text: query
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ result: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
