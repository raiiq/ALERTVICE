
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\outof\\News ALERTVICE\\news-site\\src\\app\\globals.css';
const buffer = fs.readFileSync(filePath);

console.log('File size:', buffer.length);

try {
  const content = buffer.toString('utf-8');
  console.log('The file is valid UTF-8!');
} catch (error) {
  console.log('Error decoding UTF-8:', error.message);
}

// Find the problem index
const index = 18318;
const sliceSize = 100;
const start = Math.max(0, index - sliceSize);
const end = Math.min(buffer.length, index + sliceSize);

console.log(`Buffer slice around ${index}:`);
const slice = buffer.slice(start, end);
console.log(slice);

// Try to print it as hex
let hex = '';
for (let i = 0; i < slice.length; i++) {
  hex += slice[i].toString(16).padStart(2, '0') + ' ';
}
console.log('Hex slice:');
console.log(hex);

// Check if any character is above 127
for (let i = 0; i < buffer.length; i++) {
  if (buffer[i] > 127) {
    // UTF-8 can have values > 127 but they follow a specific pattern.
    // If it's a single byte > 127 and not part of a valid multibyte sequence, it's invalid.
  }
}
