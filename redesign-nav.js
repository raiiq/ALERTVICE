const fs = require('fs');
const path = 'c:/Users/outof/News ALERTVICE/news-site/src/app/components/Navbar.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Navbar shape (remove pill style classes from globals.css later, but here handle the component)
// 2. Remove all rounded-full, rounded-xl, rounded-2xl, rounded-3xl
content = content.replace(/rounded-full/g, 'rounded-none');
content = content.replace(/rounded-xl/g, 'rounded-none');
content = content.replace(/rounded-2xl/g, 'rounded-none');
content = content.replace(/rounded-3xl/g, 'rounded-none');

// 3. Update logo (span with bg-primary)
content = content.replace(/<span className="absolute inset-0 rounded-none bg-primary animate-ping opacity-50"><\/span>/g, '<span className="absolute inset-0 bg-primary animate-ping opacity-50"></span>');

// 4. Update language toggle
const langToggleTarget = /<div className="lang-toggle" dir="ltr">[\s\r\n]+<div className={`lang-toggle-pill \$\{lang === 'ar' \? 'is-ar' : ''\}`}> content.replace(/<div className="lang-toggle" dir="ltr">[\s\r\n]+<div className={`lang-toggle-pill \$\{lang === 'ar' \? 'is-ar' : ''\}`}?.*?<\/div>[\s\r\n]+<button onClick=\{\(\) => toggleLang\('en'\)\} className=\{`lang-toggle-btn \$\{lang === 'en' \? 'text-white' : 'text-white\/30'\}`}>EN<\/button>[\s\r\n]+<button onClick=\{\(\) => toggleLang\('ar'\)\} className=\{`lang-toggle-btn \$\{lang === 'ar' \? 'text-white' : 'text-white\/30'\}`}>AR<\/button>[\s\r\n]+<\/div>/s, 
`<div className="flex border border-white/10" dir="ltr">
    <button onClick={() => toggleLang('en')} className={\`px-3 py-1 text-[10px] font-bold transition-all \${lang === 'en' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}\`}>EN</button>
    <button onClick={() => toggleLang('ar')} className={\`px-3 py-1 text-[10px] font-bold transition-all \${lang === 'ar' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}\`}>AR</button>
</div>`);

// 5. Update Navbar structure if it's a floating pill
content = content.replace(/<nav className="liquid-glass-nav px-4 sm:px-6 lg:px-8" dir="ltr">/g, '<nav className="w-full h-16 bg-background border-b border-primary px-4 sm:px-6 lg:px-8 flex items-center" dir="ltr">');
content = content.replace(/<div className="navbar-band">/g, '<div className="sticky top-0 z-[100] w-full bg-background">');
content = content.replace(/<\/nav>[\s\r\n]+<\/div>/g, '</nav></div>');

fs.writeFileSync(path, content);
console.log("Success");
