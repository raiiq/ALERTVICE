import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkMedia() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, language, image_url, video_url, has_video')
    .eq('language', 'ar')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log(JSON.stringify(data, null, 2));
}

checkMedia();
