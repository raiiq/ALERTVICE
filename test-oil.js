const https = require('https');

https.get('https://oilprice.com/', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        // Look for Brent and WTI prices in the HTML
        const brentMatch = data.match(/Brent Crude.*?value">([\d.]+)/i);
        const wtiMatch = data.match(/WTI Crude.*?value">([\d.]+)/i);

        console.log('Brent:', brentMatch ? brentMatch[1] : 'Not found');
        console.log('WTI:', wtiMatch ? wtiMatch[1] : 'Not found');

        // Check if there is a data attribute or JSON
        const tableMatch = data.match(/<table.*?id="oilprices".*?>(.*?)<\/table>/s);
        if (tableMatch) {
            console.log('Found oilprices table');
            const rows = tableMatch[1].match(/<tr.*?>(.*?)<\/tr>/gs);
            rows.forEach(row => {
                if (row.includes('Brent') || row.includes('WTI')) {
                    console.log('Row:', row.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
                }
            });
        } else {
            console.log('oilprices table not found');
        }
    });
}).on('error', (err) => {
    console.error('Error:', err);
});
