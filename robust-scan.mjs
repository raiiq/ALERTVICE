import fetch from 'node-fetch';

const CHANNEL_URL = "https://t.me/s/alertvice";

async function diagnose() {
    console.log("Fetching channel...");
    const response = await fetch(CHANNEL_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const html = await response.text();

    console.log("Found post matches:");
    const postDivRegex = /<div class="tgme_widget_message\s+js-widget_message"[\s\S]*?data-post="alertvice\/(\d+)"[\s\S]*?>([\s\S]*?)<div class="tgme_widget_message_footer/g;
    let match;
    let count = 0;
    while ((match = postDivRegex.exec(html)) !== null) {
        count++;
        const id = match[1];
        const content = match[2];
        console.log(`ID: ${id}, Content length: ${content.length}`);
        const textMatch = content.match(/<div class="tgme_widget_message_text js-widget_message_text"[\s\S]*?>([\s\S]*?)<\/div>/);
        if (textMatch) {
            console.log(` - Text found: ${textMatch[1].substring(0, 30)}...`);
        } else {
            console.log(` - No text found`);
        }
    }
    console.log(`Total posts processed: ${count}`);
}

diagnose();
