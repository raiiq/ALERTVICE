"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavbarProps {
    lang: string;
    setLang: (lang: string) => void;
    searchQuery?: string;
    setSearchQuery?: (q: string) => void;
    handleSearch?: (e: React.FormEvent) => void;
    activeCategory?: string;
    setActiveCategory?: (cat: string) => void;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export default function Navbar({
    lang,
    setLang,
    searchQuery = "",
    setSearchQuery,
    handleSearch,
    activeCategory = "all",
    setActiveCategory,
    refreshing = false,
    onRefresh
}: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isAr = lang === 'ar';

    const closeMenu = () => setIsMenuOpen(false);

    const toggleLang = (newLang: string) => {
        if (newLang === lang) return;
        setLang(newLang);
        localStorage.setItem("newsLang", newLang);
    };

    const categories = [
        { id: 'world', en: 'WORLD', ar: 'عالمي' },
        { id: 'politics', en: 'POLITICS', ar: 'سياسة' },
        { id: 'market', en: 'MARKET', ar: 'سوق' },
        { id: 'live', en: 'ALERT RADAR', ar: 'رادار التحذير' }
    ];

    const handleCategoryClick = (catId: string) => {
        if (catId === 'market') {
            router.push('/market');
        } else if (catId === 'live') {
            router.push('/live');
        } else {
            if (pathname !== '/') {
                router.push('/?cat=' + catId);
            } else if (setActiveCategory) {
                setActiveCategory(catId);
            }
        }
    };

    return (
        <>
            <div className="navbar-band">
                <nav className="liquid-glass-nav px-4 sm:px-6 lg:px-8" dir="ltr">
                    <div className="relative z-10 w-full flex items-center justify-between gap-4 h-full">

                        {/* LOGO */}
                        <Link href="/" className="flex items-center gap-2.5 shrink-0">
                            <div className="relative w-2.5 h-2.5 shrink-0">
                                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50"></span>
                                <span className="relative block w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]"></span>
                            </div>
                            <h1
                                className="text-base sm:text-lg font-black tracking-[0.15em] text-white cursor-pointer uppercase hover:text-primary transition-colors duration-300"
                                style={{ textShadow: '0 0 20px rgba(56,189,248,0.5)' }}
                            >
                                ALERTVICE
                            </h1>
                        </Link>

                        {/* SEARCH — Desktop only, centered */}
                        <form
                            onSubmit={handleSearch ? handleSearch : (e) => { e.preventDefault(); router.push('/?q=' + searchQuery); }}
                            className="hidden lg:flex flex-1 max-w-sm relative group mx-6"
                        >
                            <div className="absolute inset-0 rounded-full bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"></div>
                            <input
                                type="text"
                                placeholder={isAr ? 'ابحث...' : 'Search signals...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                                className={`relative w-full bg-white/[0.04] border border-white/[0.08] focus:border-primary/30 rounded-full py-1.5 ps-4 pe-9 text-[11px] font-bold tracking-wider text-white outline-none transition-all placeholder:text-white/20 ${isAr ? 'text-right' : 'text-left'}`}
                            />
                            <button type="submit" className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-white/25 group-hover:text-primary/70 transition-colors`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </button>
                        </form>

                        {/* RIGHT SIDE */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

                            {/* CATEGORY LINKS — desktop */}
                            <div className="hidden lg:flex items-center gap-1 mr-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategoryClick(cat.id)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-200 ${((pathname === '/' && activeCategory === cat.id) || (pathname === '/' + cat.id))
                                            ? 'bg-primary/15 text-primary border border-primary/30'
                                            : 'text-white/30 hover:text-white/70 border border-transparent hover:border-white/10'
                                            }`}
                                    >
                                        {isAr ? cat.ar : cat.en}
                                    </button>
                                ))}
                            </div>

                            {/* DIVIDER */}
                            <div className="hidden lg:block w-px h-5 bg-white/10 mx-1"></div>

                            {/* LANGUAGE TOGGLE */}
                            <div className="lang-toggle" dir="ltr">
                                <div className={`lang-toggle-pill ${lang === 'ar' ? 'is-ar' : ''}`}></div>
                                <button onClick={() => toggleLang('en')} className={`lang-toggle-btn ${lang === 'en' ? 'text-white' : 'text-white/30'}`}>EN</button>
                                <button onClick={() => toggleLang('ar')} className={`lang-toggle-btn ${lang === 'ar' ? 'text-white' : 'text-white/30'}`}>AR</button>
                            </div>

                            {/* REFRESH (Optional) */}
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    title="Refresh"
                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-primary border border-white/[0.06] hover:border-primary/25 hover:bg-primary/5 transition-all duration-300 ${refreshing ? 'animate-spin !text-primary !border-primary/40' : ''}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                </button>
                            )}

                            {/* MOBILE MENU TOGGLE */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-all rounded-full border border-white/[0.08] hover:border-white/20"
                                aria-label="Toggle menu"
                            >
                                <svg
                                    className={`w-4 h-4 transition-all duration-300 ${isMenuOpen ? 'rotate-45 scale-90' : ''}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    {isMenuOpen
                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    }
                                </svg>
                            </button>
                        </div>
                    </div>
                </nav>
            </div>

            {/* MOBILE SLIDE-DOWN MENU */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm"
                            onClick={closeMenu}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -16, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.97 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="lg:hidden fixed top-[80px] left-4 right-4 z-[90] rounded-3xl overflow-hidden"
                            dir="ltr"
                            style={{
                                background: 'linear-gradient(135deg, rgba(10,20,45,0.96) 0%, rgba(2,8,24,0.98) 100%)',
                                border: '1px solid rgba(56,189,248,0.2)',
                                boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 60px rgba(56,189,248,0.07)',
                                backdropFilter: 'blur(28px)'
                            }}
                        >
                            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />

                            <div className="p-5 flex flex-col gap-5">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (handleSearch) handleSearch(e);
                                        else router.push('/?q=' + searchQuery);
                                        closeMenu();
                                    }}
                                    className="relative"
                                >
                                    <input
                                        type="text"
                                        placeholder={isAr ? 'ابحث في الأخبار...' : 'Search intelligence...'}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                                        className={`w-full bg-white/[0.05] border border-white/10 focus:border-primary/40 rounded-2xl py-3 pl-5 pr-12 text-sm font-bold text-white outline-none transition-all placeholder:text-white/20 ${isAr ? 'text-right' : 'text-left'}`}
                                    />
                                    <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </button>
                                </form>

                                <div>
                                    <p className="text-[9px] font-black tracking-[0.25em] text-white/20 uppercase mb-3">CATEGORIES</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[{ id: 'all', en: 'All', ar: 'الكل' }, ...categories].map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => { handleCategoryClick(cat.id); closeMenu(); }}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${((pathname === '/' && activeCategory === cat.id) || (pathname === '/' + cat.id))
                                                    ? 'bg-primary text-black'
                                                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                                    }`}
                                            >
                                                {isAr ? cat.ar : cat.en}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
