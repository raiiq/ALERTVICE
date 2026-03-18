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
    const [isAdmin, setIsAdmin] = useState(false);
    const [theme, setTheme] = useState('dark');
    const pathname = usePathname();
    const router = useRouter();
    const isAr = lang === 'ar';

    const closeMenu = () => setIsMenuOpen(false);

    useEffect(() => {
        checkAdmin();
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const checkAdmin = async () => {
        try {
            const res = await fetch('/api/admin/check');
            if (res.ok) setIsAdmin(true);
        } catch (e) { /* ignore */ }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            setIsAdmin(false);
            router.push('/');
            router.refresh();
        } catch (e) { /* ignore */ }
    };

    const toggleLang = (newLang: string) => {
        if (newLang === lang) return;
        setLang(newLang);
        localStorage.setItem("newsLang", newLang);
    };

    const categories = [
        { id: 'world', en: 'WORLD', ar: 'عالمي' },
        { id: 'politics', en: 'POLITICS', ar: 'سياسة' },
        { id: 'market', en: 'MARKET', ar: 'سوق' },
        { id: 'live', en: 'ALERT RADAR', ar: 'رادار التحذير' },
        ...(isAdmin ? [{ id: 'sql', en: 'SQL CONSOLE', ar: 'وحدة SQL' }] : [])
    ];

    const handleCategoryClick = (catId: string) => {
        if (catId === 'admin') {
            router.push(isAdmin ? '/admin/dashboard' : '/admin/login');
        } else if (catId === 'sql') {
            router.push('/admin/sql');
        } else if (catId === 'market') {
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
            <div className="sticky top-0 z-[100] w-full">
                <nav className="w-full h-16 bg-background/40 backdrop-blur-md border-b border-primary px-4 sm:px-6 lg:px-8 flex items-center" dir="ltr">
                    <div className="relative z-10 w-full flex items-center justify-between gap-4 h-full">

                        {/* LOGO */}
                        <Link href="/" className="flex items-center gap-2.5 shrink-0">
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

                        {/* SEARCH — Desktop only, centered */}
                        <form
                            onSubmit={handleSearch ? handleSearch : (e) => { e.preventDefault(); router.push('/?q=' + searchQuery); }}
                            className="hidden lg:flex flex-1 max-w-sm relative group mx-6"
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
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

                            {/* CATEGORY LINKS — desktop */}
                            <div className="hidden lg:flex items-center gap-1 mr-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategoryClick(cat.id)}
                                        className={`px-2 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-colors duration-200 ${((pathname === '/' && activeCategory === cat.id) || (pathname === '/' + cat.id))
                                            ? 'text-primary'
                                            : cat.id === 'admin' 
                                                ? 'text-foreground/50 hover:text-foreground/90' 
                                                : 'text-foreground/50 hover:text-foreground/90'
                                            }`}
                                    >
                                        {isAr ? cat.ar : cat.en}
                                    </button>
                                ))}
                            </div>

                            {/* DIVIDER */}
                            <div className="hidden lg:block w-px h-5 bg-foreground/10 mx-1"></div>

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
                            <div className="flex border border-border-color" dir="ltr">
                                <button onClick={() => toggleLang('en')} className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-foreground/40 hover:text-foreground/90'}`}>EN</button>
                                <button onClick={() => toggleLang('ar')} className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-foreground/40 hover:text-foreground/90'}`}>AR</button>
                            </div>

                            {/* ACCOUNT / ADMIN BUTTON */}
                            <div className="flex items-center gap-1.5 ml-2">
                                {isAdmin ? (
                                    <div className="flex items-center bg-foreground/5 border border-border-color rounded-none p-1 pr-3 gap-2 hover:bg-foreground/10 transition-all">
                                        <button 
                                            onClick={() => router.push('/admin/dashboard')}
                                            className="w-7 h-7 bg-primary flex items-center justify-center text-primary-foreground border border-primary/30"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                                        </button>
                                        <span className="text-[9px] font-black text-foreground/50 uppercase tracking-widest hidden sm:block">{isAr ? 'الحساب' : 'ACCOUNT'}</span>
                                        <button 
                                            onClick={handleLogout}
                                            title="Logout"
                                            className="text-[8px] font-black text-red-500/50 hover:text-red-500 uppercase transition-colors"
                                        >
                                            {isAr ? 'خروج' : 'OUT'}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => router.push('/admin/login')}
                                        className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-foreground/40 hover:text-foreground/90 transition-colors uppercase"
                                    >
                                        {isAr ? 'مدير' : 'ADMIN'}
                                    </button>
                                )}
                            </div>

                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    title="Refresh"
                                    className={`w-8 h-8 flex items-center justify-center rounded-none text-foreground/30 hover:text-primary border border-white/[0.06] hover:border-primary/25 hover:bg-primary/5 transition-all duration-300 ${refreshing ? 'animate-spin !text-primary !border-primary/40' : ''}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                </button>
                            )}

                            {/* MOBILE MENU TOGGLE */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-all rounded-none border border-white/[0.08] hover:border-white/20"
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
                            className="lg:hidden fixed inset-0 z-[85] bg-background/40 backdrop-blur-md/60 backdrop-blur-sm"
                            onClick={closeMenu}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -16, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.97 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="lg:hidden fixed top-[80px] left-4 right-4 z-[90] rounded-none overflow-hidden"
                            dir="ltr"
                            style={{
                                background: 'var(--background)',
                                border: '1px solid var(--primary)',
                                boxShadow: 'none',
                                backdropFilter: 'none'
                            }}
                        >
                            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-none" />

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
                                        className={`w-full bg-foreground/[0.05] border border-border-color focus:border-primary/40 rounded-none py-3 pl-5 pr-12 text-sm font-bold text-foreground outline-none transition-all placeholder:text-foreground/20 ${isAr ? 'text-right' : 'text-left'}`}
                                    />
                                    <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-primary transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </button>
                                </form>

                                <div>
                                    <p className="text-[9px] font-black tracking-[0.25em] text-foreground/20 uppercase mb-3">CATEGORIES</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[{ id: 'all', en: 'All', ar: 'الكل' }, ...categories].map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => { handleCategoryClick(cat.id); closeMenu(); }}
                                                className={`px-4 py-2 text-[12px] font-bold tracking-wider uppercase transition-colors ${((pathname === '/' && activeCategory === cat.id) || (pathname === '/' + cat.id))
                                                    ? 'text-primary border-l-2 border-primary'
                                                    : 'text-foreground/50 hover:text-foreground/90 border-l-2 border-transparent'
                                                    }`}
                                            >
                                                {isAr ? cat.ar : cat.en}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-2 pt-5 border-t border-border-color/50 px-5 pb-5">
                                    {isAdmin ? (
                                        <div className="flex flex-col gap-3">
                                            <button 
                                                onClick={() => { router.push('/admin/dashboard'); closeMenu(); }}
                                                className="w-full bg-primary/10 border border-primary/20 text-primary font-black py-4 rounded-none flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                                                {isAr ? 'لوحة التحكم' : 'DASHBOARD'}
                                            </button>
                                            <button 
                                                onClick={() => { handleLogout(); closeMenu(); }}
                                                className="w-full bg-red-500/5 border border-red-500/10 text-red-500/60 font-black py-3 rounded-none flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                                            >
                                                {isAr ? 'تسجيل الخروج' : 'TERMINATE SESSION'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => { router.push('/admin/login'); closeMenu(); }}
                                            className="w-full bg-foreground/5 border border-border-color text-foreground/40 font-black py-4 rounded-none flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                        >
                                            {isAr ? 'دخول المسؤول' : 'ADMIN ACCESS'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
