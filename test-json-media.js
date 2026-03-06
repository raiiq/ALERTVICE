const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testJson() {
    const jsonStr = JSON.stringify(['https://example.com/1.jpg', 'https://example.com/2.jpg']);
    const { error } = await supabase.from('posts').upsert({
        telegram_id: 'test/json',
        language: 'en',
        title: 'Test JSON Media',
        image_url: jsonStr,
        post_date: new Date().toISOString()
    }, { onConflict: 'telegram_id, language' });

    if (error) console.error("Error:", error);
    else console.log("Successfully saved JSON string to image_url");
}
testJson();
