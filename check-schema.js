const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    // We can't easily query metadata with anon key, but we can try to insert a test row with arrays to see if it works
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    console.log("Columns:", Object.keys(data[0] || {}));
}
checkSchema();
