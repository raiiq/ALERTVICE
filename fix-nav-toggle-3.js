const fs = require('fs');
const content = fs.readFileSync('c:/Users/outof/News ALERTVICE/news-site/src/app/components/Navbar.tsx', 'utf8');

const replacement = `                            {/* THEME TOGGLE (Apple style) */}
                            <button
                                onClick={() => {
                                    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                                    document.documentElement.setAttribute('data-theme', next);
                                    localStorage.setItem('theme', next);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all group shrink-0"
                                title="Toggle Theme"
                            >
                                <svg className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors block dark-hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707-.707M6.343 6.343l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                </svg>
                                <svg className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors hidden dark-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </button>

                            {/* LANGUAGE TOGGLE */}`;

const search = /\{\/\* LANGUAGE TOGGLE \*\/\}[\r\n\s]+<div className="lang-toggle"/;

if (search.test(content)) {
    const fixed = content.replace(/\{\/\* LANGUAGE TOGGLE \*\/\}[\r\n\s]+/, replacement + '\r\n                            ');
    fs.writeFileSync('c:/Users/outof/News ALERTVICE/news-site/src/app/components/Navbar.tsx', fixed);
    console.log("Success");
} else {
    // Try even simpler
    const simpleSearch = '{/* LANGUAGE TOGGLE */}';
    if (content.includes(simpleSearch)) {
        const fixed = content.replace(simpleSearch, replacement);
        fs.writeFileSync('c:/Users/outof/News ALERTVICE/news-site/src/app/components/Navbar.tsx', fixed);
        console.log("Simple Success");
    } else {
        console.error("Pattern again not found");
    }
}
