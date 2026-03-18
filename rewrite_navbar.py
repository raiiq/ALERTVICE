import sys

with open('src/app/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Split the code into before 'return (' and the return statement itself
main_split = c.split('    return (', 1)
if len(main_split) != 2:
    print("Could not find 'return ('")
    sys.exit(1)

before_return = main_split[0]

new_return = """    return (
        <>
            {/* SPACING FOR MOBILE BOTTOM NAV */}
            <div className="block lg:hidden h-20" />

            {/* FULL WIDTH BOTTOM NAVBAR FOR MOBILE */}
            <div className="fixed bottom-0 left-0 right-0 lg:sticky lg:top-0 lg:bottom-auto lg:left-auto lg:right-auto z-[100] w-full lg:w-full drop-shadow-[0_-4px_32px_rgba(0,0,0,0.8)] lg:drop-shadow-none">
                <nav className="w-full h-[64px] lg:h-16 bg-background/85 lg:bg-background/40 backdrop-blur-2xl border-t lg:border-t-0 lg:border-b border-primary/30 lg:border-primary border-x-0 rounded-none px-4 sm:px-6 lg:px-8 flex items-center transition-all overflow-x-auto no-scrollbar shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] lg:shadow-none" dir="ltr" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="relative z-10 min-w-max lg:w-full flex items-center justify-between gap-6 lg:gap-4 h-full">

                        {/* LOGO */}
                        <Link href="/" className="flex items-center gap-2.5 shrink-0 pl-1 lg:pl-0">
                            <div className="relative w-2.5 h-2.5 shrink-0">
                                <span className="absolute inset-0 rounded-none bg-primary animate-ping opacity-50"></span>
                                <span className="relative block w-2.5 h-2.5 bg-primary rounded-none shadow-[0_0_10px_var(--primary)]"></span>
                            </div>
                            <h1
                                className="text-base sm:text-lg font-black tracking-[0.15em] text-foreground cursor-pointer uppercase hover:text-primary transition-colors duration-300"
                                style={{ textShadow: '0 0 20px rgba(56,189,248,0.5)' }}
                            >
                                ALERTVICE
                            </h1>
                        </Link>

                        {/* SEARCH */}
                        <form
                            onSubmit={handleSearch ? handleSearch : (e) => { e.preventDefault(); router.push('/?q=' + searchQuery); }}
                            className="flex flex-1 min-w-[140px] max-w-[180px] lg:max-w-sm relative group shrink-0 mx-2 lg:mx-6"
                        >
                            <div className="absolute inset-0 rounded-none bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"></div>
                            <input
                                type="text"
                                placeholder={isAr ? 'ابحث...' : 'Search signals...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                                className={`relative w-full bg-foreground/[0.04] border border-white/[0.08] focus:border-primary/30 rounded-none py-1.5 ps-4 pe-9 text-[11px] font-bold tracking-wider text-foreground outline-none transition-all placeholder:text-foreground/20 ${isAr ? 'text-right' : 'text-left'}`}
                            />
                            <button type="submit" className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-foreground/25 group-hover:text-primary/70 transition-colors`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </button>
                        </form>

                        {/* RIGHT SIDE */}
                        <div className="flex items-center gap-2 lg:gap-2 shrink-0 pr-2 lg:pr-0">

                            {/* CATEGORY LINKS */}
                            <div className="flex items-center gap-1.5 lg:gap-2 mr-2 shrink-0">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategoryClick(cat.id)}
                                        className={`px-3 lg:px-2 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors duration-200 shrink-0 ${((pathname === '/' && activeCategory === cat.id) || (pathname === '/' + cat.id))
                                            ? 'text-primary'
                                            : 'text-foreground/50 hover:text-foreground/90'
                                            }`}
                                    >
                                        {isAr ? cat.ar : cat.en}
                                    </button>
                                ))}
                            </div>

                            {/* DIVIDER */}
                            <div className="block w-px h-5 bg-foreground/10 mx-1 shrink-0"></div>

                            {/* THEME TOGGLE */}
                            <button
                                onClick={() => {
                                    const next = theme === 'light' ? 'dark' : 'light';
                                    setTheme(next);
                                    document.documentElement.setAttribute('data-theme', next);
                                    localStorage.setItem('theme', next);
                                }}
                                className={`w-8 h-8 flex items-center justify-center rounded-none transition-all group shrink-0 ${theme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707-.707M6.343 6.343l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            {/* LANGUAGE TOGGLE */}
                            <div className="flex border border-border-color shrink-0" dir="ltr">
                                <button onClick={() => toggleLang('en')} className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-foreground/40 hover:text-foreground/90'}`}>EN</button>
                                <button onClick={() => toggleLang('ar')} className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-foreground/40 hover:text-foreground/90'}`}>AR</button>
                            </div>

                            {/* ACCOUNT / ADMIN BUTTON */}
                            <div className="flex items-center gap-1.5 lg:ml-2 shrink-0">
                                {isAdmin ? (
                                    <div className="flex items-center bg-foreground/5 border border-border-color rounded-none p-1 pr-3 gap-2 hover:bg-foreground/10 transition-all shrink-0">
                                        <button 
                                            onClick={() => router.push('/admin/dashboard')}
                                            className="w-7 h-7 bg-primary flex items-center justify-center text-primary-foreground border border-primary/30 shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                                        </button>
                                        <span className="text-[9px] font-black text-foreground/50 uppercase tracking-widest hidden sm:block">{isAr ? 'الحساب' : 'ACCOUNT'}</span>
                                        <button 
                                            onClick={handleLogout}
                                            title="Logout"
                                            className="text-[8px] font-black text-red-500/50 hover:text-red-500 uppercase transition-colors shrink-0"
                                        >
                                            {isAr ? 'خروج' : 'OUT'}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => router.push('/admin/login')}
                                        className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-foreground/40 hover:text-foreground/90 transition-colors border border-white/[0.08] hover:border-primary/40 uppercase shrink-0"
                                    >
                                        {isAr ? 'مدير' : 'ADMIN'}
                                    </button>
                                )}
                            </div>

                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    title="Refresh"
                                    className={`w-8 h-8 flex items-center justify-center rounded-none text-foreground/30 hover:text-primary border border-white/[0.06] hover:border-primary/25 hover:bg-primary/5 transition-all duration-300 shrink-0 ml-1 ${refreshing ? 'animate-spin !text-primary !border-primary/40' : ''}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                </button>
                            )}

                        </div>
                    </div>
                </nav>
            </div>
        </>
    );
}
"""

with open('src/app/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(before_return + new_return)

with open('src/app/globals.css', 'r', encoding='utf-8') as f:
    gc = f.read()

if 'padding-bottom: 74px;' not in gc:
    gc += """
/* Mobile bottom nav safe padding padding */
@media (max-width: 1024px) {
  body {
    padding-bottom: 74px;
  }
}
"""
    with open('src/app/globals.css', 'w', encoding='utf-8') as f:
        f.write(gc)
