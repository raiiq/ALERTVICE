const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            walk(fullPath, callback);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            callback(fullPath);
        }
    });
}

const targetDir = 'c:/Users/outof/News ALERTVICE/news-site/src/app';

walk(targetDir, file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Remove all rounded-* classes but keep rounded-none
    content = content.replace(/rounded-(full|xl|2xl|3xl|lg|md|sm)/g, 'rounded-none');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
    }
});
console.log("Cleanup Done");
