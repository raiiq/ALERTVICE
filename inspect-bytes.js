
const fs = require('fs');
const filePath = 'c:\\Users\\outof\\News ALERTVICE\\news-site\\src\\app\\globals.css';
const buffer = fs.readFileSync(filePath);

console.log('File size:', buffer.length);

const index = 18318;
const range = 50;
const start = Math.max(0, index - range);
const end = Math.min(buffer.length, index + range);

console.log(`Printing bytes from ${start} to ${end}:`);
let output = '';
for (let i = start; i < end; i++) {
  const b = buffer[i];
  const char = (b >= 32 && b <= 126) ? String.fromCharCode(b) : `[${b}]`;
  output += char;
}
console.log(output);
