const fs = require('fs');
const glob = require('glob');

const files = glob.sync('c:/Users/outof/News ALERTVICE/news-site/src/app/**/*.{tsx,ts}');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Remove all rounded classes
    content = content.replace(/rounded-(full|xl|2xl|3xl|lg|md|sm)/g, 'rounded-none');
    
    // Replace pill logic in UI components if found
    content = content.replace(/rounded-pill/g, 'rounded-none');
    
    // Formal headers and logic
    content = content.replace(/text-primary\/15/g, 'bg-primary/10 border border-primary'); // More formal background
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
    }
});
