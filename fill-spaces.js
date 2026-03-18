const fs = require('fs');
const path = 'c:/Users/outof/News ALERTVICE/news-site/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// REDESIGN: Change secondary grid to 2 columns to fill space better (slice 1-5 = 4 items)
content = content.replace(/grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10/g, 'grid grid-cols-1 md:grid-cols-2 gap-12');

// FIX: Ensure ticker is always visible and themed
content = content.replace(/intelligence-ticker h-12 flex items-center bg-surface border-b border-border-color/g, 'intelligence-ticker');

// FIX: Sidebar legacy cleanup
content = content.replace(/bg-surface border-l border-border-color/g, 'intelligence-sidebar');

// FIX: Empty spaces - Ensure we have a fallback if articles are missing
// Actually the slice logic is fine, it just shouldn't look empty.

// THEMATIZATION: Replace any remaining hardcoded colors in page.tsx
content = content.replace(/bg-\[\#0a0a0b\]\/40/g, 'bg-surface/40');
content = content.replace(/bg-white\/5/g, 'bg-foreground/5');
content = content.replace(/border-white\/5/g, 'border-border-color');
content = content.replace(/border-white\/10/g, 'border-border-color');
content = content.replace(/hover:border-white\/10/g, 'hover:border-primary/30');

fs.writeFileSync(path, content);
console.log("Transmission Synchronized: Feed Redesigned");
