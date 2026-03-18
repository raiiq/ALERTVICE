
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function debug() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Checking dates for 'ar' posts...");
    const { data: arPosts } = await supabase
        .from('posts')
        .select('post_date, id, title')
        .eq('language', 'ar')
        .order('post_date', { ascending: false })
        .limit(10);
    
    const now = new Date();
    console.log("Current Time:", now.toISOString());
    arPosts?.forEach(p => {
        const d = new Date(p.post_date);
        const diffHrs = (now.getTime() - d.getTime()) / 3600000;
        console.log(`ID: ${p.id}, Date: ${p.post_date}, Title: ${p.title?.substring(0, 30)}, Age: ${diffHrs.toFixed(1)} hrs`);
    });
}

debug();
