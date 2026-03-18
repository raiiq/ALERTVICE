import fetch from 'node-fetch';

const CHANNEL_URL = "https://t.me/s/alertvice";

async function diagnose() {
    console.log("Fetching channel...");
    const response = await fetch(CHANNEL_URL);
    const html = await response.text();

    const lastId = '5141';
    const startIdx = html.indexOf(`data-post="alertvice/${lastId}"`);
    if (startIdx !== -1) {
        // Find the boundary to the next post or the end
        const nextIdx = html.indexOf(`data-post="alertvice/`, startIdx + 10);
        const chunk = nextIdx !== -1 ? html.substring(startIdx, nextIdx) : html.substring(startIdx);
        console.log("CHUNK for ID 5141:");
        console.log(chunk);
    }
}

diagnose();
