const cheerio = require('cheerio');

async function check() {
    const res = await fetch('https://t.me/s/alertvice');
    const html = await res.text();
    const $ = cheerio.load(html);

    $('.tgme_widget_message').each((i, el) => {
        const id = $(el).attr('data-post');
        const dateStr = $(el).find('.tgme_widget_message_date time').attr('datetime');
        const textHtml = $(el).find('.tgme_widget_message_text').html() || '';
        console.log(`ID: ${id}, Date: ${dateStr}, Text Length: ${textHtml.length}`);
    });
}
check();
