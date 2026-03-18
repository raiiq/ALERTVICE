
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function debug() {
    console.log("Checking Supabase Connection...");
    console.log("URL:", supabaseUrl);
    console.log("Key Length:", supabaseServiceKey.length);

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("CRITICAL: Missing Supabase credentials!");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("\n1. Checking posts for 'ar'...");
    const { data: arPosts, error: arError } = await supabase
        .from('posts')
        .select('id, title, telegram_id')
        .eq('language', 'ar')
        .limit(5);
    
    if (arError) console.error("AR Fetch Error:", arError);
    else console.log("AR Posts found:", arPosts?.length || 0, arPosts);

    console.log("\n2. Checking posts for 'en'...");
    const { data: enPosts, error: enError } = await supabase
        .from('posts')
        .select('id, title, telegram_id')
        .eq('language', 'en')
        .limit(5);

    if (enError) console.error("EN Fetch Error:", enError);
    else console.log("EN Posts found:", enPosts?.length || 0, enPosts);
}

debug();
