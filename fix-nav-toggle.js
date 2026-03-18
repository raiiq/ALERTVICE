const fs = require('fs');
const path = 'c:/Users/outof/News ALERTVICE/news-site/src/app/components/Navbar.tsx';
const content = fs.readFileSync(path, 'utf8');

const target = /\{(\s+)\/\* LANGUAGE TOGGLE \*\/(\s+)<div className="lang-toggle"/;
const match = content.match(target);
if (match) {
    const space = match[1];
    const replacement = `{${space}/* THEME TOGGLE (Apple style) */
${space}<button
${space}    onClick={() => {
${space}        const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
${space}        document.documentElement.setAttribute('data-theme', next);
${space}        localStorage.setItem('theme', next);
${space}    }}
${space}    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all group shrink-0"
${space}    title="Toggle Theme"
${space}>
${space}    <svg className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors block dark-hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
${space}        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707-.707M6.343 6.343l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
${space}    </svg>
${space}    <svg className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors hidden dark-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
${space}        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
${space}    </svg>
${space}</button>\n\n${space}/* LANGUAGE TOGGLE */\n${space}<div className="lang-toggle"`;
    
    fs.writeFileSync(path, content.replace(target, replacement));
    console.log("Success");
} else {
    console.error("Pattern not found");
}
