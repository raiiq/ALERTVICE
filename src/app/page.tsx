"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MediaDisplay, parseMedia, deduplicateTitle } from "./components/MediaDisplay";
import { motion, AnimatePresence } from "framer-motion";

interface NewsPost {
  id: string;
  textHtml: string;
  plainText: string;
  imageUrl: string | null;
  hasVideo: boolean;
  videoUrl: string | null;
  date: string;
  views: string;
  aiTitle: string | null;
  aiSummary?: string | null;
  aiTag?: string | null;
}

export default function Home() {
  // SEPARATE STORAGE FOR BETTER PERFORMANCE
  const [articles, setArticles] = useState<NewsPost[]>([]);
  const [signals, setSignals] = useState<NewsPost[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState("en");
  const [activeCategory, setActiveCategory] = useState("all");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loadingFading, setLoadingFading] = useState(false);
  const [loadingGone, setLoadingGone] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
  };

  // CENTRAL DEDUPLICATE ENGINE
  const getUniquePosts = (prev: NewsPost[], incoming: NewsPost[]) => {
    // Priority: incoming > prev
    const combined = [...incoming, ...prev];
    const idMap = new Map();
    const result: NewsPost[] = [];

    for (const p of combined) {
      if (p.id && !idMap.has(p.id)) {
        idMap.set(p.id, true);
        result.push(p);
      }
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // 1. SIGNAL MONITOR FETCH (Fast & Targeted)
  const fetchSignals = async (currentLang = lang, reset = false) => {
    try {
      const res = await fetch(`/api/news?lang=${currentLang}&limit=20&type=signal&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const incoming = data.posts || [];
        setSignals(prev => getUniquePosts(reset ? [] : prev, incoming).slice(0, 40));
      }
    } catch (e) { console.error("Signal fetch failed", e); }
  };

  // 2. MAIN FEED FETCH (Articles - always filters for posts WITH media)
  const fetchArticles = async (isRefresh = false, currentLang = lang, reset = false, q = searchQuery) => {
    if (isRefresh) setRefreshing(true);
    else if (!reset) setLoadingMore(true);
    else setLoading(true);
    setError("");

    const currentOffset = (reset || isRefresh) ? 0 : offset;

    try {
      // Always use type=article to ensure only media posts appear in the main feed
      const res = await fetch(`/api/news?lang=${currentLang}&offset=${currentOffset}&limit=12&type=article&q=${encodeURIComponent(q)}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Connection unstable");
      const data = await res.json();
      const fetched = data.posts || [];

      if (reset || isRefresh) {
        setArticles(prev => getUniquePosts(reset ? [] : prev, fetched));
        setOffset(fetched.length);
      } else {
        setArticles(prev => getUniquePosts(prev, fetched));
        setOffset(prev => prev + fetched.length);
      }
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("newsLang") || "en";
    setLang(stored);
    fetchArticles(false, stored, true);
    fetchSignals(stored);
    setMounted(true);
  }, []);

  // Dismiss loading screen once data is fetched
  useEffect(() => {
    if (!loading && mounted && !loadingFading) {
      setLoadingFading(true);
      const t = setTimeout(() => setLoadingGone(true), 650);
      return () => clearTimeout(t);
    }
  }, [loading, mounted]);

  useEffect(() => {
    if (!mounted || searchQuery) return;
    const interval = setInterval(() => {
      fetchSignals(lang);
      // Auto-refresh main feed if it's empty to catch initial sync
      if (articles.length === 0 && !loading) {
        fetchArticles(false, lang, true);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [lang, mounted, searchQuery, articles.length, loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchArticles(false, lang, true, searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setOffset(0);
    fetchArticles(false, lang, true, "");
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) fetchArticles(false, lang, false);
  };

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && articles.length > 0) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadingMore, hasMore, articles.length]);

  const toggleLang = (newLang: string) => {
    if (newLang === lang) return;
    setLang(newLang);
    localStorage.setItem("newsLang", newLang);
    setOffset(0);
    fetchArticles(false, newLang, true);
    fetchSignals(newLang, true);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const closeMenu = () => setIsMenuOpen(false);
  const getPostId = (idString: string) => idString.split('/').pop() || "";
  const isAr = lang === 'ar';
  const alignClass = isAr ? 'text-right' : 'text-left';
  const monitorPosts = signals.slice(0, 25);
  const filteredPosts = articles.filter(p => {
    if (activeCategory === "all" || activeCategory === "world") return true;
    return p.aiTag === activeCategory;
  });

  const heroPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const secondaryPosts = filteredPosts.length > 1 ? filteredPosts.slice(1, 5) : [];
  const feedPosts = filteredPosts.length > 5 ? filteredPosts.slice(5) : [];
  const sidebarPosts = articles.slice(0, 15);

  if (!mounted) return (
    <div className="loading-screen">
      <div className="loading-radar">
        <div className="loading-radar-ring" />
        <div className="loading-radar-ring" />
        <div className="loading-radar-ring" />
        <div className="loading-radar-sweep" />
        <div className="loading-radar-ping" />
        <div className="loading-radar-core" />
      </div>
      <div className="loading-title font-inter" data-text="ALERTVICE">ALERTVICE</div>
      <div className="loading-subtitle font-inter">Global Intelligence Network</div>
      <div className="loading-dots"><span /><span /><span /></div>
      <div className="loading-status">Initializing feed...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground tracking-wide flex flex-col font-cairo" dir={isAr ? "rtl" : "ltr"}>
      {/* LOADING SCREEN OVERLAY */}
      {!loadingGone && (
        <div className={`loading-screen${loadingFading ? ' fade-out' : ''}`}>
          <div className="loading-radar">
            <div className="loading-radar-ring" />
            <div className="loading-radar-ring" />
            <div className="loading-radar-ring" />
            <div className="loading-radar-sweep" />
            <div className="loading-radar-ping" />
            <div className="loading-radar-core" />
          </div>
          <div className="loading-title font-inter" data-text="ALERTVICE">ALERTVICE</div>
          <div className="loading-subtitle font-inter">Global Intelligence Network</div>
          <div className="loading-dots"><span /><span /><span /></div>
          <div className="loading-status">{lang === 'ar' ? 'جارٍ تحميل البيانات...' : 'Acquiring intelligence feed...'}</div>
        </div>
      )}
      {/* ===== FLOATING PILL NAVBAR ===== */}
      <div className="navbar-band">
        <nav className="liquid-glass-nav px-4 sm:px-6 lg:px-8" dir="ltr">
          <div className="relative z-10 w-full flex items-center justify-between gap-4 h-full">

            {/* LOGO */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2.5 shrink-0">
              <div className="relative w-2.5 h-2.5 shrink-0">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50"></span>
                <span className="relative block w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]"></span>
              </div>
              <h1
                className="text-base sm:text-lg font-black tracking-[0.15em] text-white cursor-pointer uppercase hover:text-primary transition-colors duration-300"
                style={{ textShadow: '0 0 20px rgba(56,189,248,0.5)' }}
                onClick={() => { setActiveCategory("all"); clearSearch(); window.scrollTo(0, 0); }}
              >
                ALERTVICE
              </h1>
            </motion.div>

            {/* SEARCH — Desktop only, centered */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-sm relative group mx-6">
              <div className="absolute inset-0 rounded-full bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"></div>
              <input
                type="text"
                placeholder={isAr ? 'ابحث...' : 'Search signals...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                {['world', 'politics', 'market'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      if (cat === 'market') {
                        window.location.href = '/market';
                        return;
                      }
                      setActiveCategory(cat); setOffset(0); fetchArticles(false, lang, true);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-200 ${activeCategory === cat
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-white/30 hover:text-white/70 border border-transparent hover:border-white/10'
                      }`}
                  >
                    {isAr ? (cat === 'world' ? 'عالمي' : cat === 'politics' ? 'سياسة' : 'سوق') : cat.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* DIVIDER */}
              <div className="hidden lg:block w-px h-5 bg-white/10 mx-1"></div>

              {/* LANGUAGE TOGGLE — always EN left, AR right, fixed width. Shown on all sizes now */}
              <div className="lang-toggle" dir="ltr">
                <div className={`lang-toggle-pill ${lang === 'ar' ? 'is-ar' : ''}`}></div>
                <button onClick={() => toggleLang('en')} className={`lang-toggle-btn ${lang === 'en' ? 'text-white' : 'text-white/30'}`}>EN</button>
                <button onClick={() => toggleLang('ar')} className={`lang-toggle-btn ${lang === 'ar' ? 'text-white' : 'text-white/30'}`}>AR</button>
              </div>

              {/* REFRESH */}
              <button
                onClick={() => { fetchArticles(true, lang, true); fetchSignals(lang); }}
                title="Refresh"
                className={`w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-primary border border-white/[0.06] hover:border-primary/25 hover:bg-primary/5 transition-all duration-300 ${refreshing ? 'animate-spin !text-primary !border-primary/40' : ''}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>

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

      {/* ===== MOBILE SLIDE-DOWN MENU ===== */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm"
              onClick={closeMenu}
            />
            {/* Panel — floats below the navbar band */}
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
              {/* Top shimmer line */}
              <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />

              <div className="p-5 flex flex-col gap-5">

                {/* SEARCH */}
                <form onSubmit={(e) => { handleSearch(e); closeMenu(); }} className="relative">
                  <input
                    type="text"
                    placeholder={isAr ? 'ابحث في الأخبار...' : 'Search intelligence...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-white/[0.05] border border-white/10 focus:border-primary/40 rounded-2xl py-3 pl-5 pr-12 text-sm font-bold text-white outline-none transition-all placeholder:text-white/20 ${isAr ? 'text-right' : 'text-left'}`}
                  />
                  <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </form>

                {/* CATEGORIES */}
                <div>
                  <p className="text-[9px] font-black tracking-[0.25em] text-white/20 uppercase mb-3">CATEGORIES</p>
                  <div className="flex flex-wrap gap-2">
                    {[{ key: 'all', en: 'All', ar: 'الكل' }, { key: 'world', en: 'World', ar: 'عالمي' }, { key: 'politics', en: 'Politics', ar: 'سياسة' }, { key: 'market', en: 'Market', ar: 'سوق' }].map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          if (cat.key === 'market') {
                            window.location.href = '/market';
                            return;
                          }
                          setActiveCategory(cat.key); setOffset(0); fetchArticles(false, lang, true); closeMenu();
                        }}
                        className={`px-4 py-2 rounded-full text-[11px] font-black tracking-wider uppercase transition-all ${activeCategory === cat.key
                          ? 'bg-primary text-black shadow-[0_0_16px_rgba(56,189,248,0.4)]'
                          : 'bg-white/[0.04] text-white/40 border border-white/10 hover:text-white/80 hover:border-white/20'
                          }`}
                      >
                        {isAr ? cat.ar : cat.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LIVE SIGNALS STRIP */}
                {signals.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-[9px] font-black tracking-[0.25em] text-white/20 uppercase">{isAr ? 'إشارات حية' : 'LIVE SIGNALS'}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-hidden">
                      {signals.slice(0, 5).map(p => (
                        <Link
                          key={p.id}
                          href={`/news/${getPostId(p.id)}`}
                          onClick={closeMenu}
                          className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/20 hover:bg-white/[0.06] transition-all group"
                        >
                          <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                          <span className="text-[11px] font-bold text-white/60 group-hover:text-white/90 transition-colors line-clamp-1">
                            {deduplicateTitle(p.aiTitle)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOTTOM ROW: Refresh + Telegram */}
                <div className="flex gap-3 pt-1 border-t border-white/5">
                  <button
                    onClick={() => { fetchArticles(true, lang, true); fetchSignals(lang); closeMenu(); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${refreshing
                      ? 'border-primary/40 text-primary bg-primary/10'
                      : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                      }`}
                  >
                    <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {isAr ? 'تحديث' : 'Refresh'}
                  </button>
                  <a
                    href="https://t.me/alertvice"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.456c-.15.664-.54.826-1.092.514l-3-2.21-1.447 1.393c-.16.16-.295.295-.605.295l.216-3.053 5.56-5.023c.242-.213-.052-.332-.374-.12l-6.871 4.326-2.962-.924c-.644-.2-.657-.644.134-.953l11.564-4.459c.537-.195 1.007.13.885.758z" /></svg>
                    Telegram
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== LIQUID GLASS SIGNAL FLASH TICKER ===== */}
      <div className="hidden lg:flex ticker-wrapper">
        <div className="liquid-glass-ticker">
          <div className={`ticker-badge ${isAr ? 'border-l border-r-0' : ''}`}>
            <div className="ticker-badge-dot"></div>
            <span className="text-primary font-black text-[10px] tracking-[0.2em] uppercase font-inter">{isAr ? 'عاجل' : 'RADAR FLASH'}</span>
          </div>
          <div className="ticker-content relative overflow-hidden flex-1 h-full flex items-center">
            <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} flex items-center gap-32`}>
              {[...signals, ...signals].map((p, idx) => (
                <Link key={`ticker-${idx}`} href={`/news/${getPostId(p.id)}`} className="text-[10px] font-bold text-white/80 hover:text-primary transition-all uppercase whitespace-nowrap tracking-wider">
                  {deduplicateTitle(p.aiTitle)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow w-full flex flex-col lg:flex-row px-4 lg:px-12 gap-12 mt-12 mb-12 max-w-[1800px] mx-auto">
        {/* LEFT SIDEBAR (SIGNAL MONITOR) */}
        <div className="hidden lg:flex w-[380px] shrink-0 sidebar-container flex-col sticky top-[140px] h-[calc(100vh-200px)] overflow-hidden rounded-[2rem] border border-white/5 bg-[#0a0a0b]/40 backdrop-blur-3xl transition-all duration-700">
          <div className="px-8 py-8 border-b border-white/[0.03] bg-white/[0.01] backdrop-blur-md sticky top-0 z-20">
            <div className={`flex items-center justify-between ${isAr ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-4 h-4 bg-red-500/20 rounded-full animate-ping"></span>
                  <span className="relative block w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                </div>
                <h3 className="font-black text-white uppercase tracking-[0.3em] text-[12px] font-inter">{isAr ? 'رادار التنبيه' : 'ALERT RADAR'}</h3>
              </div>
              <Link href="/live" className="text-[10px] font-black text-primary border border-primary/20 bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/20 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(56,189,248,0.15)] font-inter">
                {isAr ? 'فتح راصد الكرة الأرضية' : 'OPEN 3D RADAR MONITOR'}
              </Link>
            </div>
          </div>

          <motion.div variants={containerVars} initial="hidden" animate="show" className="sidebar-monitor flex-1 overflow-y-auto scrollbar-none">
            {monitorPosts.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-24 opacity-20">
                <div className="w-12 h-12 border border-primary/20 rounded-full flex items-center justify-center animate-spin-slow">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">{isAr ? 'جارٍ المسح...' : 'SCANNING...'}</span>
              </div>
            )}

            <div className="flex flex-col gap-6 p-10">
              {monitorPosts.map(p => {
                const rawTitle = p.aiTitle || "";
                const rawSummary = p.aiSummary || "";

                const title = deduplicateTitle(rawTitle) || "";
                let summary = deduplicateTitle(rawSummary) || "";

                // HYGIENE: Word-based overlap check
                const getWords = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, " ").split(/\s+/).filter(w => w.length > 3);
                const titleWords = getWords(title);
                const summaryWords = getWords(summary);

                const overlapCount = summaryWords.filter(w => titleWords.includes(w)).length;
                const isSignificantOverlap = overlapCount > (summaryWords.length * 0.4) || summaryWords.length < 5;

                if (isSignificantOverlap) summary = "";

                const showSummary = summary.length > 20 && summary.toLowerCase() !== title.toLowerCase();

                return (
                  <motion.div key={p.id} variants={itemVars}>
                    <Link href={`/news/${getPostId(p.id)}`} className="liquid-sidebar-card group">
                      <div className={`flex justify-between items-center mb-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                          <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                          <span className="text-[9px] font-bold text-primary/60 font-mono tracking-widest uppercase">
                            {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-white/5 font-mono tracking-[0.2em] uppercase">ID-{getPostId(p.id).slice(-4)}</span>
                      </div>

                      <h4 className={`text-[13px] font-bold text-white/80 group-hover:text-primary transition-colors leading-relaxed ${alignClass} line-clamp-3`}>
                        {title}
                      </h4>

                      {showSummary && (
                        <div className={`mt-4 pt-4 border-t border-white/[0.02] ${alignClass}`}>
                          <p className="text-[10px] text-white/30 leading-relaxed line-clamp-2 group-hover:text-white/50 transition-colors italic font-light">
                            {summary}
                          </p>
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* FEED */}
        <div className="flex-1 p-4 sm:p-8 lg:p-12 min-h-screen">
          <motion.div variants={containerVars} initial="hidden" animate="show" className="flex flex-col gap-16">
            {!loading && articles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
                <div className="w-16 h-16 border border-primary/20 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">{isAr ? 'لا توجد بيانات حالياً' : 'No Intelligence Found'}</h3>
                  <p className="text-sm text-text-muted max-w-xs">{isAr ? 'نحن نقوم بمسح القنوات الآن، يرجى الانتظار...' : 'Scanning active sectors. New signals will appear here shortly.'}</p>
                </div>
                <button onClick={() => fetchArticles(true, lang, true)} className="text-[10px] font-black text-primary border border-primary/20 px-6 py-3 rounded-full hover:bg-primary/10 transition-all uppercase tracking-widest">
                  FORCED RE-SCAN
                </button>
              </div>
            )}

            {heroPost && (
              <motion.article variants={itemVars} className="group overflow-hidden rounded-[2.5rem] bg-surface/10 border border-white/5 hover:border-primary/20 transition-all duration-700 shadow-3xl">
                <Link href={`/news/${getPostId(heroPost.id)}`} className={`flex flex-col lg:flex-row ${isAr ? 'lg:flex-row-reverse' : ''}`}>
                  {heroPost.imageUrl || heroPost.videoUrl ? (
                    <div className="w-full lg:w-[50%] aspect-video lg:aspect-auto overflow-hidden bg-black shrink-0 relative">
                      <MediaDisplay images={parseMedia(heroPost.imageUrl)} videos={parseMedia(heroPost.videoUrl)} hasVideo={heroPost.hasVideo} isAr={isAr} aspect="h-full" singleMode={true} />
                      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-40"></div>
                    </div>
                  ) : null}
                  <div className={`p-8 lg:p-12 flex flex-col justify-center gap-8 ${(!heroPost.imageUrl && !heroPost.videoUrl) ? 'w-full' : 'lg:w-[50%]'}`}>
                    <div className="flex flex-col gap-4">
                      <h2 className={`text-4xl lg:text-5xl font-black text-white leading-tight group-hover:text-primary transition-colors ${alignClass}`}>{deduplicateTitle(heroPost.aiTitle)}</h2>
                      <div className={`flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-text-muted/40 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <span>{formatDate(heroPost.date)}</span>
                        <span>{heroPost.views} VIEWS</span>
                        {heroPost.aiTag && <span className="text-primary">{heroPost.aiTag}</span>}
                      </div>
                    </div>
                    <p className={`text-[1.1rem] reading-text leading-relaxed opacity-80 ${alignClass} line-clamp-3`}>{heroPost.aiSummary}</p>
                    <div className={`flex items-center gap-4 text-white font-black text-[12px] uppercase bg-primary px-8 py-4 rounded-full w-max shadow-2xl hover:bg-white hover:text-black transition-all ${isAr ? 'flex-row-reverse' : ''}`}>
                      <span>{isAr ? 'اقرأ المزيد' : 'Read Full Intelligence'}</span>
                      <svg className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  </div>
                </Link>
              </motion.article>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {secondaryPosts.map(p => (
                <motion.article key={p.id} variants={itemVars} className="group flex flex-col gap-4">
                  <Link href={`/news/${getPostId(p.id)}`} className="flex flex-col gap-4">
                    {p.imageUrl || p.videoUrl ? (
                      <div className="aspect-video rounded-3xl overflow-hidden border border-white/5 group-hover:border-primary/30 transition-all">
                        <MediaDisplay images={parseMedia(p.imageUrl)} videos={parseMedia(p.videoUrl)} hasVideo={p.hasVideo} isAr={isAr} aspect="aspect-video" singleMode={true} />
                      </div>
                    ) : null}
                    <h3 className={`text-lg font-bold text-white group-hover:text-primary transition-colors leading-snug ${alignClass}`}>{deduplicateTitle(p.aiTitle)}</h3>
                    <div className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest">{formatDate(p.date)}</div>
                  </Link>
                </motion.article>
              ))}
            </div>

            <div className="flex flex-col gap-12 mt-8">
              <div className="h-px bg-white/5 w-full"></div>
              {feedPosts.map(p => (
                <motion.article key={p.id} variants={itemVars} className="group">
                  <Link href={`/news/${getPostId(p.id)}`} className={`flex flex-col md:flex-row gap-8 ${isAr ? 'md:flex-row-reverse' : ''}`}>
                    {p.imageUrl || p.videoUrl ? (
                      <div className="w-full md:w-[300px] shrink-0 rounded-2xl overflow-hidden border border-white/5">
                        <MediaDisplay images={parseMedia(p.imageUrl)} videos={parseMedia(p.videoUrl)} hasVideo={p.hasVideo} isAr={isAr} aspect="aspect-video" singleMode={true} />
                      </div>
                    ) : null}
                    <div className={`flex flex-col gap-3 justify-center ${(!p.imageUrl && !p.videoUrl) ? 'w-full' : ''}`}>
                      <h4 className={`text-2xl font-bold text-white group-hover:text-primary transition-colors ${alignClass}`}>{deduplicateTitle(p.aiTitle)}</h4>
                      <p className={`reading-text opacity-70 line-clamp-2 ${alignClass}`}>{p.aiSummary}</p>
                      <div className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest">{formatDate(p.date)}</div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            {/* PAGINATION / LOAD MORE */}
            <div className="flex flex-col items-center gap-8 py-12 mt-8 border-t border-white/5">
              {/* Observer Target for Infinite Scroll */}
              <div ref={observerTarget} className="h-4 w-full" />

              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full max-w-md py-6 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black uppercase tracking-[0.3em] transition-all duration-300 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-center gap-4">
                    {loadingMore ? (
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>{isAr ? 'تحميل المزيد من البيانات' : 'Query More Intelligence'}</span>
                        <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                      </>
                    )}
                  </div>
                </button>
              ) : (
                articles.length > 0 && (
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">END OF AVAILABLE INTELLIGENCE TRANSMISSION</span>
                    <div className="w-px h-12 bg-gradient-to-b from-white to-transparent mt-4"></div>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="w-full glass border-t border-white/5 py-12 mt-auto">
        <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-xl font-black text-white tracking-widest">ALERTVICE</span>
            <span className="text-[10px] text-text-muted uppercase tracking-[0.3em]">Global Intelligence Network</span>
          </div>
          <div className="flex gap-8 text-[11px] font-black text-text-muted">
            <Link href="/" className="hover:text-primary">NEWS</Link>
            <Link href="/about" className="hover:text-primary">PROTOCOLS</Link>
            <a href="https://t.me/alertvice" className="hover:text-primary">ENCRYPTED TELEGRAM</a>
          </div>
          <div className="text-[10px] text-white/20 font-mono">&copy; 2026 ALERTVICE CORE</div>
        </div>
      </footer>
    </div>
  );
}
