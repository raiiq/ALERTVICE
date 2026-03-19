import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkContent() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, language, title, summary, image_url')
    .eq('language', 'ar')
    .order('post_date', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  data?.forEach(p => {
    console.log(`ID: ${p.id} | Lang: ${p.language}`);
    console.log(`Title: ${p.title}`);
    console.log(`Summary: ${p.summary}`);
    console.log('---');
  });
}

checkContent();
