"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";

interface NavbarProps {
    searchQuery?: string;
    setSearchQuery?: (q: string) => void;
    handleSearch?: (e: React.FormEvent) => void;
    activeCategory?: string;
    setActiveCategory?: (cat: string) => void;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export default function Navbar({
    searchQuery = "",
    setSearchQuery,
    handleSearch,
    activeCategory = "all",
    setActiveCategory,
    refreshing = false,
    onRefresh
}: NavbarProps) {
    const { lang, setLang, toggleLang, isAr } = useLanguage();
    const [isAdmin, setIsAdmin] = useState(false);
    const [theme, setTheme] = useState('dark');
    const pathname = usePathname();
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkAdmin();
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            setTheme(savedTheme);
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

    const categories = [
        { id: 'world', en: 'WORLD', ar: 'عالمي' },
        { id: 'market', en: 'MARKET', ar: 'سوق' },
        ...(isAdmin ? [{ id: 'sql', en: 'SQL', ar: 'برمجة' }] : [])
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

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    return (
        <>
            {/* MOBILE BOTTOM NAVBAR (INSTAGRAM STYLE) */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="fixed bottom-6 left-0 right-0 z-[1000] lg:hidden px-4 flex justify-center pointer-events-none"
                dir="ltr"
            >
                <nav className="relative liquid-nav-glass w-full max-w-[360px] h-16 bg-background/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center px-2 shadow-[0_20px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
                    {/* Top edge glow line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    
                    <div className="flex w-full items-center justify-between px-2">
                        {/* 1. SEARCH */}
                        <button 
                            onClick={() => setIsMobileSearchOpen(true)}
                            className="flex flex-col items-center gap-1 flex-1 text-foreground/30 hover:text-primary transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <span 
                                className={`text-[10px] font-black uppercase ${isAr ? 'tracking-normal' : 'tracking-[0.1em]'}`}
                                style={isAr ? { fontFamily: 'var(--font-arabic)' } : {}}
                            >
                                {isAr ? 'بحث' : 'SEARCH'}
                            </span>
                        </button>

                        {/* 2. THEME */}
                        <button 
                            onClick={toggleTheme}
                            className="flex flex-col items-center gap-1 flex-1 text-foreground/30 hover:text-primary transition-all"
                        >
                            {theme === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707-.707M6.343 6.343l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            )}
                            <span 
                                className={`text-[10px] font-black uppercase ${isAr ? 'tracking-normal' : 'tracking-[0.1em]'}`}
                                style={isAr ? { fontFamily: 'var(--font-arabic)' } : {}}
                            >
                                {isAr ? 'الوضع' : 'THEME'}
                            </span>
                        </button>


                        {/* 4. WORLD (CENTER) */}
                        <button 
                            onClick={() => handleCategoryClick('world')}
                            className={`flex flex-col items-center gap-1 flex-1 transition-all ${((pathname === '/' && activeCategory === 'world') || pathname === '/') ? 'text-primary' : 'text-foreground/30'}`}
                        >
                            <div className={`p-1 rounded-none transition-all ${((pathname === '/' && activeCategory === 'world') || pathname === '/') ? 'bg-primary/10' : ''}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            </div>
                            <span 
                                className={`text-[10px] font-black uppercase ${isAr ? 'tracking-normal' : 'tracking-[0.1em]'}`}
                                style={isAr ? { fontFamily: 'var(--font-arabic)' } : {}}
                            >
                                {isAr ? 'عالمي' : 'WORLD'}
                            </span>
                        </button>

                        {/* 5. LANGUAGE */}
                        <button 
                            onClick={() => { window.location.href = pathname + '?lang=' + (lang === 'ar' ? 'en' : 'ar'); }}
                            className="flex flex-col items-center gap-1 flex-1 text-foreground/30 hover:text-primary transition-all"
                        >
                            <div className="w-5 h-5 flex items-center justify-center font-black text-[12px] border-2 border-current rounded-none">
                                {lang.toUpperCase()}
                            </div>
                            <span 
                                className={`text-[10px] font-black uppercase ${isAr ? 'tracking-normal' : 'tracking-[0.1em]'}`}
                                style={isAr ? { fontFamily: 'var(--font-arabic)' } : {}}
                            >
                                {isAr ? 'اللغة' : 'LANG'}
                            </span>
                        </button>

                        {/* 6. MARKET */}
                        <button 
                            onClick={() => handleCategoryClick('market')}
                            className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeCategory === 'market' ? 'text-primary' : 'text-foreground/30'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                            <span 
                                className={`text-[10px] font-black uppercase ${isAr ? 'tracking-normal' : 'tracking-[0.1em]'}`}
                                style={isAr ? { fontFamily: 'var(--font-arabic)' } : {}}
                            >
                                {isAr ? 'سوق' : 'MARKET'}
                            </span>
                        </button>
                    </div>
                </nav>
            </motion.div>

            {/* MOBILE SEARCH OVERLAY */}
            <AnimatePresence>
                {isMobileSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="fixed inset-0 z-[1100] bg-background/70 lg:hidden px-6 pt-24"
                    >
                        <button onClick={() => setIsMobileSearchOpen(false)} className="absolute top-8 right-8 text-foreground/40 hover:text-foreground">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <form
                            onSubmit={(e) => { e.preventDefault(); setIsMobileSearchOpen(false); handleSearch ? handleSearch(e) : router.push('/?q=' + searchQuery); }}
                            className="w-full max-w-xl mx-auto"
                        >
                            <input
                                autoFocus
                                type="text"
                                placeholder={isAr ? 'ابحث في رادار الاستخبارات...' : 'Scanning intelligence feed...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                                className={`w-full bg-foreground/5 border-b-2 border-primary/40 py-6 text-2xl font-black text-foreground outline-none focus:border-primary transition-all ${isAr ? 'text-right' : 'text-left'}`}
                            />
                            <div className="mt-8 flex flex-wrap gap-3">
                                {['IRAQ', 'ENERGY', 'MILITARY', 'CRUDE', 'ISX', 'SGP'].map(tag => (
                                    <button 
                                        key={tag} 
                                        onClick={(e) => { e.preventDefault(); setSearchQuery && setSearchQuery(tag); }}
                                        className="px-4 py-2 bg-foreground/5 border border-white/10 rounded-full text-[10px] font-black tracking-widest text-foreground/40 hover:text-primary transition-all"
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DESKTOP TOP NAVBAR */}
            <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`hidden lg:flex fixed top-0 right-0 z-[200] ${pathname === '/' ? 'left-[600px]' : 'left-0'}`}
            >
                <div className="w-full h-16 bg-background/80 backdrop-blur-3xl border-b border-white/5 flex items-center px-8 relative overflow-hidden group/nav" dir="ltr">
                    {/* Top Edge Glow Line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                    
                    <div className="flex items-center justify-between w-full h-10 gap-6">
                        {/* 1. BRANDING */}
                        <Link href="/" className="flex items-center gap-3 group shrink-0">
                            {/* Iraq Flag Widget */}
                            <div className="flex flex-col w-7 h-[18px] rounded-sm overflow-hidden border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)] shrink-0">
                                <div className="w-full h-[33.33%] bg-[#CE1126]"></div>
                                <div className="w-full h-[33.33%] bg-white flex items-center justify-center">
                                    <span style={{ color: '#007A3D', fontSize: '6px', fontWeight: 900, fontFamily: 'var(--font-arabic)', lineHeight: 1 }}>الله أكبر</span>
                                </div>
                                <div className="w-full h-[33.33%] bg-black"></div>
                            </div>
                            <h1 className="text-sm font-black tracking-[0.3em] text-foreground group-hover:text-primary transition-all duration-500">ALERTVICE</h1>
                        </Link>

                        {/* 2. TACTICAL SEARCH */}
                        <form
                            onSubmit={handleSearch ? handleSearch : (e) => { e.preventDefault(); router.push('/?q=' + searchQuery); }}
                            className="flex-1 max-w-sm relative group/search h-11"
                        >
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-20 group-focus-within/search:opacity-100 transition-opacity">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder={isAr ? 'مسح الترددات...' : 'SCANNING FREQUENCIES...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                                className={`w-full h-11 bg-white/5 border border-white/10 rounded-none ps-12 pe-4 text-[10px] font-black tracking-widest text-foreground outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all placeholder:text-foreground/20 ${isAr ? 'text-right' : 'text-left'}`}
                            />
                            {/* Input Glow */}
                            <div className="absolute inset-0 pointer-events-none border border-primary/0 group-focus-within/search:border-primary/20 transition-all"></div>
                        </form>

                        {/* 3. CONTROL TERMINAL */}
                        <div className="flex items-center gap-1 h-14 bg-white/5 p-1 border border-white/10 rounded-none shrink-0 overflow-hidden">
                            {/* CATEGORIES */}
                            <div className="flex items-center">
                                {categories.map((cat, idx) => {
                                    const isActive = (pathname === '/' && activeCategory === cat.id) || (pathname === '/' + cat.id);
                                    return (
                                        <div key={cat.id} className="flex items-center">
                                            {idx > 0 && <div className="w-[1px] h-3 bg-white/5 mx-0.5"></div>}
                                            <button
                                                onClick={() => handleCategoryClick(cat.id)}
                                                className={`h-11 px-3 text-[10px] font-black uppercase transition-all duration-300 relative group/btn ${isActive ? 'text-primary bg-white/5 shadow-[inset_0_0_10px_rgba(var(--primary-rgb),0.05)]' : 'text-foreground/40 hover:text-foreground hover:bg-white/5'}`}
                                            >
                                                <span 
                                                    className="relative z-10"
                                                    style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '11px' } : {}}
                                                >
                                                    {isAr ? cat.ar : cat.en}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

                            {/* THEME */}
                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 flex items-center justify-center transition-all duration-500 hover:bg-white/10 text-foreground/40 hover:text-primary shrink-0"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707-.707M6.343 6.343l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                )}
                            </button>

                            <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

                            {/* LANGUAGE TOGGLE */}
                            <div className="flex items-center h-10 bg-white/5 px-1.5 gap-1 shrink-0">
                                <button
                                    onClick={() => { window.location.href = pathname + '?lang=ar'; }}
                                    className={`px-3 h-8 text-[10px] font-black transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-foreground/20 hover:text-foreground'}`}
                                >
                                    AR
                                </button>
                                <button
                                    onClick={() => { window.location.href = pathname + '?lang=en'; }}
                                    className={`px-3 h-8 text-[10px] font-black transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-foreground/20 hover:text-foreground'}`}
                                >
                                    EN
                                </button>
                            </div>

                            <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

                            {/* REFRESH */}
                            {onRefresh && (
                                <button 
                                    onClick={onRefresh} 
                                    className={`w-8 h-8 flex items-center justify-center text-foreground/20 hover:text-primary transition-all shrink-0 ${refreshing ? 'animate-spin text-primary' : ''}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            )}

                            <div className="w-[1px] h-5 bg-white/10 mx-1"></div>

                            {/* ADMIN STATUS */}
                            <button 
                                onClick={() => router.push(isAdmin ? '/admin/dashboard' : '/admin/login')}
                                className={`w-9 h-9 flex items-center justify-center transition-all shrink-0 ${isAdmin ? 'text-primary' : 'text-foreground/20 hover:text-primary'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
