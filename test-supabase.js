require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.from('posts').upsert([
        { telegram_id: 'alertvice/999999', title: 'Test EN', language: 'en' },
        { telegram_id: 'alertvice/999999', title: 'Test AR', language: 'ar' }
    ], { onConflict: 'telegram_id, language' });

    console.log("Upsert result:", { data, error });
}
test();
