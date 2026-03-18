import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CHANNEL_URL = "https://t.me/s/alertvice";

async function diagnose() {
    console.log("Fetching Telegram channel...");
    const response = await fetch(CHANNEL_URL);
    const html = await response.text();

    console.log("HTML length:", html.length);

    const idRegex = /data-post="alertvice\/(\d+)"/g;
    let matches;
    const ids = [];
    while ((matches = idRegex.exec(html)) !== null) {
        ids.push(matches[1]);
    }

    console.log("Found post IDs:", ids);

    if (ids.length === 0) {
        console.log("No posts found. Checking for alternative patterns...");
        // Log a sample of the HTML to see what's happening
        console.log("HTML Sample:", html.substring(0, 1000));
        return;
    }

    // Checking for a specific post's content structure
    const sampleId = ids[ids.length - 1];
    const contentStart = html.indexOf(`data-post="alertvice/${sampleId}"`);
    const nextStart = html.indexOf(`data-post="alertvice/`, contentStart + 1);
    const chunk = nextStart !== -1 ? html.substring(contentStart, nextStart) : html.substring(contentStart);

    const textMatch = chunk.match(/<div class="tgme_widget_message_text js-widget_message_text"[\s\S]*?>([\s\S]*?)<\/div>/);
    console.log("Sample ID:", sampleId);
    console.log("Text Match Found:", !!textMatch);
    if (textMatch) console.log("Text Content:", textMatch[1].substring(0, 50) + "...");

    const mediaRegex = /<a class="tgme_widget_message_photo_wrap"[\s\S]*?background-image:url\('([\s\S]*?)'\)/g;
    const images = [...chunk.matchAll(mediaRegex)].map(m => m[1]);
    console.log("Images Found:", images.length);

    const videoRegex = /<video[\s\S]*?src="([\s\S]*?)"/g;
    const videos = [...chunk.matchAll(videoRegex)].map(m => m[1]);
    console.log("Videos Found:", videos.length);
}

diagnose();
