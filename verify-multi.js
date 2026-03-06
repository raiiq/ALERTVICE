const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkMedia() {
    const { data } = await supabase.from('posts').select('telegram_id, image_url').order('created_at', { ascending: false }).limit(50);
    console.log("Checking for multi-media posts...");
    let found = false;
    data.forEach(p => {
        if (p.image_url && p.image_url.startsWith('[')) {
            console.log(`- Post ${p.telegram_id} has multi-media.`);
            found = true;
        }
    });
    if (!found) console.log("No multi-media posts found in the last 50 entries.");
}
checkMedia();
