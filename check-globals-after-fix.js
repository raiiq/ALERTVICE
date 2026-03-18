const fs = require('fs');
const filePath = 'c:\\Users\\outof\\News ALERTVICE\\news-site\\src\\app\\globals.css';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const startLine = 770;
const endLine = 850;

console.log(`--- Lines ${startLine} to ${endLine} ---`);
for (let i = startLine - 1; i < Math.min(lines.length, endLine); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
