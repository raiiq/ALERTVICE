import { syncTelegramChannel } from './src/lib/telegramSync';

async function deepCorrect() {
    console.log("🚀 STARTING DEEP CORRECTIVE SYNC...");
    
    // Page 1: Latest 100 (Now includes bypass filter)
    console.log("Syncing Page 1 (Latest)...");
    await syncTelegramChannel();

    // Page 2: Before 5300
    console.log("Syncing Page 2 (Before 5300)...");
    await syncTelegramChannel("5300");

    // Page 3: Before 5200
    console.log("Syncing Page 3 (Before 5200)...");
    await syncTelegramChannel("5200");

    // Page 4: Before 5100
    console.log("Syncing Page 4 (Before 5100)...");
    await syncTelegramChannel("5100");

    console.log("✅ Deep Correction Finished. All 400+ potential records updated.");
}

deepCorrect();
