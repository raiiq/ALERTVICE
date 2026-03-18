import fetch from 'node-fetch';

const CHANNEL_URL = "https://t.me/s/alertvice";

async function diagnose() {
    console.log("Fetching channel...");
    const response = await fetch(CHANNEL_URL);
    const html = await response.text();

    const idRegex = /data-post="alertvice\/(\d+)"/g;
    let match;
    const posts = [];
    while ((match = idRegex.exec(html)) !== null) {
        posts.push({ id: match[1], index: match.index });
    }

    if (posts.length > 0) {
        const last = posts[posts.length - 1];
        console.log("Post ID:", last.id);
        const start = html.lastIndexOf('<div class="tgme_widget_message ', last.index);
        const end = html.indexOf('</div>\n</div>', last.index) + 13;
        const chunk = html.substring(start, end);
        console.log("Chunk length:", chunk.length);
        console.log("Chunk start:", html.substring(start, start + 200));
        console.log("Check for text match:");
        const textMatch = chunk.match(/<div class="tgme_widget_message_text js-widget_message_text"[\s\S]*?>([\s\S]*?)<\/div>/);
        console.log("Text match:", textMatch ? "FOUND" : "NOT FOUND");
        if (textMatch) console.log("Text:", textMatch[1].substring(0, 100));
        
        console.log("Check for photos:");
        const photoRegex = /<a class="tgme_widget_message_photo_wrap"[\s\S]*?background-image:url\('([\s\S]*?)'\)/g;
        const photos = [...chunk.matchAll(photoRegex)];
        console.log("Photos:", photos.length);
    }
}

diagnose();
