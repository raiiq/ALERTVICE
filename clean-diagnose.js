const fs = require('fs');
const filePath = 'c:\\Users\\outof\\News ALERTVICE\\news-site\\src\\app\\globals.css';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Try to detect and remove line numbers that were accidentally baked in
const cleanedLines = lines.map(line => {
  // If the line matches something like "123: content", remove "123: "
  const match = line.match(/^\d+:\s?(.*)/);
  if (match) {
    return match[1];
  }
  return line;
});

// Also find and remove double-baked line numbers
const doubleCleanedLines = cleanedLines.map(line => {
  const match = line.match(/^\d+:\s?(.*)/);
  if (match) {
    return match[1];
  }
  return line;
});

// Now let's just rewrite the section that was messed up.
// It seems the mess is from line 750 to line 850 in the current file.

// Let's print out what we see from 750 to 850 after cleaning.
console.log(`--- Cleaned Lines 750 to 850 ---`);
for (let i = 749; i < Math.min(doubleCleanedLines.length, 850); i++) {
  console.log(`${i + 1}: ${doubleCleanedLines[i]}`);
}
