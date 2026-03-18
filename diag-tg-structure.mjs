import fetch from 'node-fetch';

const CHANNEL_URL = "https://t.me/s/alertvice";

async function diagnose() {
    const response = await fetch(CHANNEL_URL);
    const html = await response.text();

    const sampleId = '5141';
    const postStartStr = `data-post="alertvice/${sampleId}"`;
    const startIdx = html.indexOf(postStartStr);
    
    if (startIdx !== -1) {
        console.log("Post structure found at index:", startIdx);
        // Look for the header of the post which usually contains the content
        const searchRange = html.substring(startIdx - 500, startIdx + 2000);
        console.log("HTML Sample around post 5141:");
        console.log(searchRange);
    } else {
        console.log("Post ID 5141 not found in HTML");
    }
}

diagnose();
