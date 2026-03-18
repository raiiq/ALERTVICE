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

    const idx = html.indexOf('alertvice/');
    if (idx !== -1) {
        console.log("Snippet found at", idx);
        console.log("HTML Around:", html.substring(idx - 200, idx + 1000));
    } else {
        console.log("No alertvice/ string found");
    }
}

diagnose();
