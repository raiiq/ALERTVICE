"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [theme, setTheme] = useState('dark');
    const pathname = usePathname();
    const router = useRouter();
    const isAr = lang === 'ar';
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

    const toggleLang = (newLang: string) => {
        if (newLang === lang) return;
        setLang(newLang);
        localStorage.setItem("newsLang", newLang);
    };

    const categories = [
        { id: 'world', en: 'WORLD', ar: 'عالمي' },
        { id: 'market', en: 'MARKET', ar: 'سوق' },
        { id: 'live', en: 'RADAR', ar: 'رادار' },
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

    return (
        <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-[200] lg:pl-[400px] lg:fixed lg:top-0 lg:bottom-auto lg:left-0 lg:right-0 flex justify-center lg:justify-start pointer-events-none px-3 sm:px-4 lg:px-0">
            <nav 
                className="liquid-nav w-full max-w-[600px] lg:max-w-none h-[60px] sm:h-[64px] lg:h-16 bg-background/80 lg:bg-background/95 backdrop-blur-3xl border border-primary/20 lg:border-0 lg:border-b lg:border-white/10 px-3 sm:px-6 lg:px-8 flex items-center shadow-[0_12px_40px_rgba(0,0,0,0.6)] lg:shadow-none overflow-x-auto no-scrollbar pointer-events-auto transition-all select-none"
                dir="ltr"
                ref={scrollContainerRef}
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div className="flex items-center justify-between w-full lg:w-full min-w-max lg:min-w-0 gap-3 sm:gap-4 h-full">
                    
                    {/* LOGO SECTION */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0">
                        <div className="relative w-2 h-2 shrink-0">
                            <span className="absolute inset-0 rounded-none bg-primary animate-ping opacity-40"></span>
                            <span className="relative block w-2 h-2 bg-primary rounded-none shadow-[0_0_10px_var(--primary)]"></span>
                        </div>
                        <h1 className="text-xs sm:text-base font-black tracking-widest text-foreground group-hover:text-primary transition-colors">ALERTVICE</h1>
                    </Link>

                    {/* SEARCH FORM */}
                    <form
                        onSubmit={handleSearch ? handleSearch : (e) => { e.preventDefault(); router.push('/?q=' + searchQuery); }}
                        className="flex flex-1 min-w-[100px] sm:min-w-[140px] max-w-[180px] lg:max-w-xs relative shrink-0"
                    >
                        <input
                            type="text"
                            placeholder={isAr ? 'ابحث...' : 'Search...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                            className={`w-full bg-foreground/[0.05] border border-white/10 rounded-lg py-1.5 ps-3 pe-8 text-[10px] sm:text-[11px] font-bold text-foreground outline-none focus:border-primary/40 transition-all ${isAr ? 'text-right' : 'text-left'}`}
                        />
                        <button type="submit" className={`absolute ${isAr ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    </form>

                    {/* CATEGORIES SECTION */}
                    <div className="flex items-center gap-1 shrink-0 lg:mr-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`px-2 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 rounded-none shrink-0 ${((pathname === '/' && activeCategory === cat.id) || (pathname === '/' + cat.id)) 
                                    ? 'text-primary bg-primary/5' 
                                    : 'text-foreground/40 hover:text-foreground/90'}`}
                            >
                                {isAr ? cat.ar : cat.en}
                            </button>
                        ))}
                    </div>

                    <div className="block w-px h-4 bg-foreground/10 mx-1 shrink-0"></div>

                    {/* ACTIONS SECTION */}
                    <div className="flex items-center gap-2 shrink-0 pr-1">
                        {/* THEME */}
                        <button
                            onClick={toggleTheme}
                            className={`w-8 h-8 flex items-center justify-center rounded-none transition-all duration-300 ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white hover:bg-primary'}`}
                        >
                            {theme === 'dark' ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707-.707M6.343 6.343l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            )}
                        </button>

                        {/* LANG */}
                        <div className="flex bg-foreground/5 p-0.5 rounded-none" dir="ltr">
                            <button onClick={() => toggleLang('en')} className={`px-2 py-1 text-[9px] font-black transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-foreground/30 hover:text-foreground'}`}>EN</button>
                            <button onClick={() => toggleLang('ar')} className={`px-2 py-1 text-[9px] font-black transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-foreground/30 hover:text-foreground'}`}>AR</button>
                        </div>

                        {/* ADMIN */}
                        {isAdmin ? (
                            <button 
                                onClick={() => router.push('/admin/dashboard')}
                                className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground border-0 hover:opacity-80 transition-all shrink-0"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                            </button>
                        ) : (
                            <button 
                                onClick={() => router.push('/admin/login')}
                                className="px-3 h-8 flex items-center justify-center border border-white/10 text-[9px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground hover:border-primary/50 transition-all shrink-0"
                            >
                                {isAr ? 'مدير' : 'ADM'}
                            </button>
                        )}

                        {onRefresh && (
                            <button 
                                onClick={onRefresh} 
                                className={`w-8 h-8 flex items-center justify-center text-foreground/30 hover:text-primary transition-all shrink-0 ${refreshing ? 'animate-spin text-primary' : ''}`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
}
