const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log('Sample Post Row:', data[0]);
  console.log('Column Types based on first row:');
  for (const key in data[0]) {
    console.log(`${key}: ${typeof data[0][key]}`);
  }
}

checkSchema();
