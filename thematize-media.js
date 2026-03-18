const fs = require('fs');
const path = 'c:/Users/outof/News ALERTVICE/news-site/src/app/components/MediaDisplay.tsx';
let content = fs.readFileSync(path, 'utf8');

// Use CSS variables for all colors
content = content.replace(/bg-\[\#0a0c11\]/g, 'bg-surface');
content = content.replace(/bg-background/g, 'bg-background'); // fine
content = content.replace(/bg-white/g, 'bg-foreground');
content = content.replace(/border-primary\/20/g, 'border-border-color');
content = content.replace(/text-foreground/g, 'text-foreground'); // fine

// Fallback logic
content = content.replace(/stroke='%2338bdf8'/g, 'stroke="currentColor"');
content = content.replace(/bg-red-600/g, 'bg-red-600/80');

fs.writeFileSync(path, content);
console.log("Media Core Calibrated: Professional Theming Applied");
