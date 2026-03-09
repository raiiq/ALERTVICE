const https = require('https');
const fs = require('fs');

https.get('https://oilprice.com/', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('oil-dump.html', data);
        console.log('Dumped oil-dump.html');
    });
});
