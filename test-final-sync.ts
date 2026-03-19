import { syncTelegramChannel } from './src/lib/telegramSync';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSync() {
  console.log('Force Syncing...');
  const result = await syncTelegramChannel();
  console.log('Sync Result:', result);
  
  const { createClient } = await import('@supabase/supabase-js');
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data } = await s.from('posts').select('title, summary, language').eq('language', 'ar').limit(3).order('post_date', { ascending: false });
  console.log('New Arabic Content (Sample):');
  console.log(JSON.stringify(data, null, 2));
}

testSync();
