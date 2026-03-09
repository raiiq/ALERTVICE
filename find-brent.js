const fs = require('fs');
const data = fs.readFileSync('oil-dump.html', 'utf8');

const regex = /Brent\s*Crude/gi;
let match;
while ((match = regex.exec(data)) !== null) {
    console.log('--- Match at index:', match.index);
    console.log(data.substring(match.index - 100, match.index + 500).replace(/\s+/g, ' '));
}
