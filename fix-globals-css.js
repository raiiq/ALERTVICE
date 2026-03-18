const fs = require('fs');
const filePath = 'c:\\Users\\outof\\News ALERTVICE\\news-site\\src\\app\\globals.css';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the unclosed string and the mangled part
// 808: .liquid-nav-glass::before {
// 809:   content: " \;
// 810:  position: absolute;

// It should probably be content: "";

content = content.replace(/content: " \\;/g, 'content: "";');

// Also notice the mangled lines 797-803
// 797:                                                           275);
// 801: }liquid-nav-glass button {
// 802:   position: relative;
// 803: .liquid-nav-glass button:active {er(0.175, 0.885, 0.32, 1.2

// This looks like multiple overlapping writes happened.
// I will try to clean up the section from 795 to 810

const lines = content.split('\n');
const fixedLines = [...lines];

// Lines are 0-indexed in the array
// 795 is index 794
// 809 is index 808

// Let's just redefine the whole block for safety if I can identify the start and end of the mess.
// It seems the "liquid-nav-glass" styles are what gotten corrupted.

const newBlock = `.liquid-nav-glass {
  background: rgba(var(--primary-rgb), 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.liquid-nav-glass button {
  position: relative;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.liquid-nav-glass button:active {
  transform: scale(0.85);
}

/* Shimmer effect for liquid glass */
.liquid-nav-glass::before {
  content: "";
  position: absolute;
  top: 0; 
  left: -100%;
  width: 100%; 
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05) 50%,
    transparent
  );
  animation: nav-shimmer 8s infinite ease-in-out;
  pointer-events: none;
}`;

// Replacing lines 790 to 821 inclusive (indices 789 to 820)
fixedLines.splice(789, 821 - 790 + 1, newBlock);

fs.writeFileSync(filePath, fixedLines.join('\n'));
console.log('Fixed globals.css block');
