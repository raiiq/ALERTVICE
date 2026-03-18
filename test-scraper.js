const cheerio = require('cheerio');
const fs = require('fs');

async function testFetch() {
    console.log("Fetching telegram channel...");
    const response = await fetch('https://t.me/s/alertvice', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
    });
    
    if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        let scraped = [];

        $('.tgme_widget_message').each((_, el) => {
            let id = $(el).attr('data-post');
            if (id && !id.includes('/')) id = `alertvice/${id}`;

            const textEl = $(el).find('.tgme_widget_message_text');
            const plainText = textEl.text().trim() || '';

            let imgs = [];
            let vids = [];

            $(el).find('video').each((_, v) => {
                const src = $(v).attr('src');
                if (src) vids.push(src);
            });

            $(el).find('.tgme_widget_message_photo_wrap, .tgme_widget_message_video_thumb').each((_, p) => {
                const style = $(p).attr('style') || '';
                const match = style.match(/background-image:url\(['"]?(.*?)['"]?\)/);
                if (match && match[1]) imgs.push(match[1]);
            });

            if (id) {
                scraped.push({
                    id, plainText: plainText.substring(0, 30) + "...",
                    imgs, vids,
                    date: $(el).find('.tgme_widget_message_date time').attr('datetime')
                });
            }
        });
        fs.writeFileSync('test-scraper-out.json', JSON.stringify(scraped, null, 2));
        console.log("Total scraped: ", scraped.length);
    } else {
        console.log("Failed to fetch, status: ", response.status);
    }
}

testFetch();
