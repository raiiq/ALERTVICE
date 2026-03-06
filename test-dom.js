const cheerio = require('cheerio');

async function check() {
    const res = await fetch('https://t.me/s/alertvice');
    const html = await res.text();
    const $ = cheerio.load(html);

    $('.tgme_widget_message').each((i, el) => {
        const id = $(el).attr('data-post');
        const grouped = $(el).closest('.tgme_widget_message_grouped_wrap').length > 0;
        const hasGroup = $(el).closest('.tgme_widget_message_grouped').length > 0;
        const groupClass = $(el).parent().attr('class');
        console.log(`ID: ${id}, Parent Class: ${groupClass}`);
    });
}
check();
