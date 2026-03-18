import * as cheerio from 'cheerio';

async function testFetch() {
    console.log("Fetching https://t.me/s/alertvice...");
    const response = await fetch('https://t.me/s/alertvice', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        cache: 'no-store'
    });
    
    if (!response.ok) {
        console.error("HTTP Error:", response.status, response.statusText);
        return;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const messages = $('.tgme_widget_message');
    console.log(`Found ${messages.length} messages.`);
    if (messages.length > 0) {
        const first = messages.first().text().replace(/\s+/g, ' ').substring(0, 100);
        console.log("First msg text:", first);
    } else {
        console.log("Page title:", $('title').text());
        console.log("HTML snippet:", html.substring(0, 200));
    }
}
testFetch().catch(console.error);
