import { syncTelegramChannel } from './src/lib/telegramSync';

async function fix() {
    console.log("Starting forced sync to fix dates...");
    // Modify syncTelegramChannel temporarily to NOT skip existing? 
    // Actually I can just force it if I modified the library.
    const result = await syncTelegramChannel();
    console.log("Sync result:", result);
    
    // Also try a deep sync for older ones
    const resultOld = await syncTelegramChannel("5300"); // Example historic point
    console.log("Deep sync result:", resultOld);
}

fix();
