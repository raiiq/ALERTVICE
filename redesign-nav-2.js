const fs = require('fs');
const path = 'c:/Users/outof/News ALERTVICE/news-site/src/app/components/Navbar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Global radius override in component
content = content.replace(/rounded-full/g, 'rounded-none');
content = content.replace(/rounded-xl/g, 'rounded-none');
content = content.replace(/rounded-2xl/g, 'rounded-none');
content = content.replace(/rounded-3xl/g, 'rounded-none');
content = content.replace(/rounded-lg/g, 'rounded-none');
content = content.replace(/rounded-md/g, 'rounded-none');

// Language toggle redesign
const searchLang = /\{(\/\* LANGUAGE TOGGLE \*\/)\}[\r\n\s]+<div className="lang-toggle".*?<\/div>/s;
const replaceLang = `{/* LANGUAGE TOGGLE */}
                            <div className="flex border border-white/10" dir="ltr">
                                <button onClick={() => toggleLang('en')} className={\`px-3 py-1 text-[10px] font-bold transition-all \${lang === 'en' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}\`}>EN</button>
                                <button onClick={() => toggleLang('ar')} className={\`px-3 py-1 text-[10px] font-bold transition-all \${lang === 'ar' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'}\`}>AR</button>
                            </div>`;

content = content.replace(searchLang, replaceLang);

// Navbar bar structure
content = content.replace(/<nav className="liquid-glass-nav px-4 sm:px-6 lg:px-8" dir="ltr">/g, '<nav className="w-full h-16 bg-background border-b border-primary px-4 sm:px-6 lg:px-8 flex items-center" dir="ltr">');
content = content.replace(/<div className="navbar-band">/g, '<div className="sticky top-0 z-[100] w-full">');

// Mobile Menu redesign
const searchMobile = /<motion.div[\s\r\n]+initial=\{\{ opacity: 0, y: -16, scale: 0.97 \}\}[\s\r\n]+animate=\{\{ opacity: 1, y: 0, scale: 1 \}\}[\s\r\n]+exit=\{\{ opacity: 0, y: -12, scale: 0.97 \}\}[\s\r\n]+transition=\{\{ duration: 0.25, ease: \[0.16, 1, 0.3, 1\] \}\}[\s\r\n]+className="lg:hidden fixed top-\[80px\] left-4 right-4 z-\[90\] rounded-none overflow-hidden"[\s\r\n]+dir="ltr"[\s\r\n]+style=\{\{[\s\r\n]+background: 'linear-gradient\(135deg, rgba\(10,20,45,0.96\) 0%, rgba\(2,8,24,0.98\) 100%\)',[\s\r\n]+border: '1px solid rgba\(56,189,248,0.2\)',[\s\r\n]+boxShadow: '0 8px 40px rgba\(0,0,0,0.8\), 0 0 60px rgba\(56,189,248,0.07\)',[\s\r\n]+backdropFilter: 'blur\(28px\)'[\s\r\n]+\}\}/s;

// Just target based on common props if regex is hard
content = content.replace(/backdropFilter: 'blur\(28px\)'/g, "backdropFilter: 'none'");
content = content.replace(/background: 'linear-gradient\(.*?\)'/g, "background: 'var(--background)'");
content = content.replace(/border: '1px solid rgba\(.*?\)'/g, "border: '1px solid var(--primary)'");

fs.writeFileSync(path, content);
console.log("Success Redesign");
