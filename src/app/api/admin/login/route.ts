import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = (body.email || '').trim().toLowerCase();
        const password = (body.password || '').trim();

        if (!email || !password) {
            return NextResponse.json({ error: 'Identification keys required.' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const MASTER_EMAIL = 'outofrai@gmail.com';
        const MASTER_PASS = 'baraa762020';

        let isValid = false;
        let adminData = null;

        // 1. Check Database First
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .maybeSingle();
            
            if (data) {
                isValid = true;
                adminData = data;
            }
        } catch (e) {
            console.error("DB Query failed, falling back to master check", e);
        }

        // 2. Master Bypass / Auto-Repair Logic
        if (!isValid && email === MASTER_EMAIL && password === MASTER_PASS) {
            isValid = true;
            
            // Background Task: Ensure Admin Record exists in DB
            try {
                // We don't await this to keep login fast, but we'll try to upsert
                await supabase
                    .from('admins')
                    .upsert([{ 
                        email: MASTER_EMAIL, 
                        password: MASTER_PASS,
                        last_login: new Date().toISOString()
                    }], { onConflict: 'email' });
            } catch (err) {
                console.error("Auto-sync failed (Table might not exist yet)", err);
            }
        }

        if (isValid) {
            const cookieStore = await cookies();
            
            cookieStore.set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });

            // Log activity
            if (email === MASTER_EMAIL) {
                try {
                    await supabase
                        .from('admins')
                        .update({ last_login: new Date().toISOString() })
                        .eq('email', email);
                } catch (e) { /* ignore log failure */ }
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Access Denied: Terminal mismatch or invalid keys.' }, { status: 401 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Secure Channel Error: ' + error.message }, { status: 500 });
    }
}
