
const fs = require('fs');
const filePath = 'c:\\Users\\outof\\News ALERTVICE\\news-site\\src\\app\\globals.css';
const buffer = fs.readFileSync(filePath);

console.log('Original size:', buffer.length);

// Replace any instance of the byte 151 (0x97) with a hyphen (0x2D)
// or we can try to decode it properly if it's Windows-1252.
// Usually 151 is a long dash.
let changed = false;
for (let i = 0; i < buffer.length; i++) {
  if (buffer[i] === 151) {
    console.log(`Replacing byte 151 at index ${i}`);
    buffer[i] = 45; // '-'
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(filePath, buffer);
  console.log('File updated successfully.');
} else {
  console.log('Found no instances of byte 151.');
}
