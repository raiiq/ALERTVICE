const fs = require('fs');
const path = 'c:/Users/outof/News ALERTVICE/news-site/src/app/components/Navbar.tsx';
const content = fs.readFileSync(path, 'utf8');

const target = /useEffect\(\(\) => \{[\s\r\n]+checkAdmin\(\);[\s\r\n]+\}, \[\]\);/;
const replacement = `useEffect(() => {
        checkAdmin();
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);`;

if (target.test(content)) {
    const newContent = content.replace(target, replacement);
    fs.writeFileSync(path, newContent);
    console.log("Success");
} else {
    console.error("Pattern not found");
}
