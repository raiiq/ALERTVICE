import fetch from 'node-fetch';
import { load } from 'cheerio';

async function testFetch() {
    const CHANNEL_URL = "https://t.me/s/alertvice";
    console.log(`Fetching from ${CHANNEL_URL}...`);
    
    try {
        const response = await fetch(CHANNEL_URL, { 
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        const $ = load(html);

        console.log(`HTML Length: ${html.length}`);
        
        const posts = $('.tgme_widget_message');
        console.log(`Found ${posts.length} messages.`);

        posts.each((i, el) => {
            const $post = $(el);
            const dataPost = $post.attr('data-post') || "";
            const text = $post.find('.tgme_widget_message_text').text().trim();
            const date = $post.find('.time').attr('datetime') || $post.find('time').attr('datetime');
            console.log(`Post [${i}] ID: ${dataPost} | Date: ${date} | Text: ${text.substring(0, 50)}...`);
        });

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testFetch();
