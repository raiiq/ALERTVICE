"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MediaDisplay, parseMedia, deduplicateTitle } from "./components/MediaDisplay";

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

  // CENTRAL DEDUPLICATE ENGINE
  const getUniquePosts = (prev: NewsPost[], incoming: NewsPost[]) => {
    const idMap = new Map(prev.map(p => [p.id, true]));
    const unique = [...prev];
    for (const p of incoming) {
      if (!idMap.has(p.id)) {
        idMap.set(p.id, true);
        unique.push(p);
      }
    }
    return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // 1. SIGNAL MONITOR FETCH (Fast & Targeted)
  const fetchSignals = async (currentLang = lang) => {
    try {
      const res = await fetch(`/api/news?lang=${currentLang}&limit=15&type=signal&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setSignals(prev => getUniquePosts(data.posts, prev).slice(0, 30));
      }
    } catch (e) { console.error("Signal fetch failed", e); }
  };

  // 2. MAIN FEED FETCH (Articles)
  const fetchArticles = async (isRefresh = false, currentLang = lang, reset = false, q = searchQuery) => {
    if (isRefresh) setRefreshing(true);
    else if (!reset) setLoadingMore(true);
    else setLoading(true);
    setError("");

    const currentOffset = (reset || isRefresh) ? 0 : offset;

    try {
      // Fetch articles specifically if not searching
      const typeParam = q ? "" : "&type=article";
      const res = await fetch(`/api/news?lang=${currentLang}&offset=${currentOffset}&limit=12${typeParam}&q=${encodeURIComponent(q)}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Connection unstable");
      const data = await res.json();
      const fetched = data.posts || [];

      if (reset || isRefresh) {
        setArticles(prev => getUniquePosts(isRefresh ? fetched : [], isRefresh ? prev : fetched));
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

    // Initial load
    fetchArticles(false, stored, true);
    fetchSignals(stored);

    setMounted(true);
  }, []);

  // INDEPENDENT SIGNAL REFRESH (Every 8 seconds)
  useEffect(() => {
    if (!mounted || searchQuery) return;
    const interval = setInterval(() => fetchSignals(lang), 8000);
    return () => clearInterval(interval);
  }, [lang, mounted, searchQuery]);

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

  const toggleLang = (newLang: string) => {
    if (newLang === lang) return;
    setLang(newLang);
    localStorage.setItem("newsLang", newLang);
    setOffset(0);
    fetchArticles(false, newLang, true);
    fetchSignals(newLang);
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

  return (
    <div className="min-h-screen bg-background text-foreground tracking-wide flex flex-col font-cairo" dir={isAr ? "rtl" : "ltr"}>
      {/* Glowy Dark Header */}
      <header className="w-full bg-surface border-b border-border z-[100] shadow-[0_4px_20px_rgba(0,0,0,0.5)] shrink-0 sticky top-0 h-[64px]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 h-full">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]"></div>
            <h1
              className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-white cursor-pointer uppercase drop-shadow-[0_0_8px_var(--primary)] hover:text-primary transition-all duration-300"
              onClick={() => { setActiveCategory("all"); clearSearch(); window.scrollTo(0, 0); }}
            >
              ALERTVICE
            </h1>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl relative group mx-4 lg:mx-8">
            <input
              type="text"
              placeholder={isAr ? 'ابحث عن الأخبار...' : 'Search intelligence...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-background border border-border focus:border-primary/50 rounded-full py-2 px-10 text-xs font-bold tracking-widest text-white outline-none transition-all placeholder:text-text-muted/50 ${alignClass}`}
            />
            <button type="submit" className={`absolute ${isAr ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
          </form>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Nav Links - Desktop */}
            <div className="hidden lg:flex gap-6 font-bold text-[10px] uppercase tracking-widest">
              <button onClick={() => { setActiveCategory("world"); setOffset(0); fetchArticles(false, lang, true); }} className={`transition-all ${activeCategory === "world" ? 'text-white drop-shadow-[0_0_8px_var(--primary)]' : 'text-text-muted hover:text-primary'}`}>{isAr ? 'عالمي' : 'World'}</button>
              <button onClick={() => { setActiveCategory("politics"); setOffset(0); fetchArticles(false, lang, true); }} className={`transition-all ${activeCategory === "politics" ? 'text-white drop-shadow-[0_0_8px_var(--primary)]' : 'text-text-muted hover:text-primary'}`}>{isAr ? 'سياسة' : 'Politics'}</button>
              <button onClick={() => { setActiveCategory("market"); setOffset(0); fetchArticles(false, lang, true); }} className={`transition-all ${activeCategory === "market" ? 'text-white drop-shadow-[0_0_8px_var(--primary)]' : 'text-text-muted hover:text-primary'}`}>{isAr ? 'الأسواق' : 'Markets'}</button>
            </div>

            {/* Premium Language Selector - Visible on all screens */}
            <div className="hidden sm:flex items-center bg-[#020617] border border-white/5 p-1 rounded-full relative group/lang shadow-lg">
              {/* Sliding Background */}
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] ${isAr ? (lang === 'ar' ? 'translate-x-0' : 'translate-x-full') : (lang === 'ar' ? 'translate-x-full' : 'translate-x-0')}`}></div>

              <button
                onClick={() => toggleLang('en')}
                className={`relative z-10 px-3 lg:px-4 py-1.5 flex items-center gap-2 transition-colors duration-500 ${!isAr ? 'text-white' : 'text-text-muted hover:text-white'}`}
              >
                <svg className={`hidden lg:block w-3 h-3 transition-transform duration-500 ${!isAr ? 'scale-110' : 'opacity-40 group-hover/lang:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-[10px] font-black tracking-widest uppercase">EN</span>
              </button>

              <button
                onClick={() => toggleLang('ar')}
                className={`relative z-10 px-3 lg:px-4 py-1.5 flex items-center gap-2 transition-colors duration-500 ${isAr ? 'text-white' : 'text-text-muted hover:text-white'}`}
              >
                <span className="text-[10px] font-black tracking-widest uppercase">AR</span>
                <svg className={`hidden lg:block w-3 h-3 transition-transform duration-500 ${isAr ? 'scale-110' : 'opacity-40 group-hover/lang:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => { fetchArticles(true, lang, true); fetchSignals(lang); }}
              className={`p-2 rounded-full bg-background border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-all ${refreshing ? 'animate-spin text-primary' : ''}`}
              title={isAr ? 'تحديث' : 'Refresh Feed'}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-primary transition-colors"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div className={`fixed inset-0 z-[200] lg:hidden transition-all duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={closeMenu}></div>
          <div className={`absolute top-0 bottom-0 w-[85%] max-w-[320px] bg-surface border-x border-border p-6 flex flex-col gap-8 shadow-2xl transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : (isAr ? '-translate-x-full' : 'translate-x-full')} ${isAr ? 'left-0' : 'right-0'}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white italic">NAVIGATION</h2>
              <button onClick={closeMenu} className="p-2 text-text-muted hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={(e) => { handleSearch(e); closeMenu(); }} className="relative group mt-2 lg:hidden">
              <input
                type="text"
                placeholder={isAr ? 'ابحث عن الأخبار...' : 'Search intelligence...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-background border border-border focus:border-primary/50 rounded-lg py-3 px-10 text-xs font-bold tracking-widest text-white outline-none transition-all placeholder:text-text-muted/50 ${alignClass}`}
              />
              <button type="submit" className={`absolute ${isAr ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => { clearSearch(); closeMenu(); }}
                  className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </form>

            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black text-primary tracking-widest uppercase">Categories</h3>
              <div className="flex flex-col gap-2">
                {['all', 'world', 'politics', 'market'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setOffset(0); fetchArticles(false, lang, true); closeMenu(); }}
                    className={`text-left px-4 py-3 rounded-lg border transition-all ${activeCategory === cat ? 'bg-primary/20 border-primary text-white' : 'bg-background/50 border-border text-text-muted hover:border-primary/30'} ${isAr ? 'text-right' : ''}`}
                  >
                    <span className="font-bold uppercase text-xs tracking-widest">
                      {cat === 'all' ? (isAr ? 'الكل' : 'All Intelligence') : cat.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Signal Monitor */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-primary tracking-widest uppercase">{isAr ? 'راصد الإشارات' : 'Signal Monitor'}</h3>
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              </div>
              <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto custom-scrollbar border border-border/50 rounded-lg p-2 bg-background/50">
                {monitorPosts.slice(0, 15).map((post) => (
                  <Link key={`mob-mon-${post.id}`} href={`/news/${getPostId(post.id)}`} onClick={closeMenu} className={`p-2 border-b border-border/10 last:border-0 ${alignClass}`}>
                    <h4 className="text-[10px] font-bold text-text-muted hover:text-white line-clamp-1">{deduplicateTitle(post.aiTitle)}</h4>
                    <span className="text-[7px] text-text-muted/40">{new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black text-primary tracking-widest uppercase">Language</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => toggleLang('en')} className={`py-3 rounded-lg border font-black text-xs ${lang === 'en' ? 'bg-primary border-primary text-white' : 'bg-background/50 border-border text-text-muted underline'}`}>ENGLISH</button>
                <button onClick={() => toggleLang('ar')} className={`py-3 rounded-lg border font-black text-xs ${lang === 'ar' ? 'bg-primary border-primary text-white' : 'bg-background/50 border-border text-text-muted underline'}`}>العربية</button>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              <a href="https://t.me/alertvice" className="flex items-center justify-center gap-3 bg-[#0a1628] border border-primary/30 text-primary py-4 rounded-lg font-black text-xs tracking-widest">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2-0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.85-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                JOINT TELEGRAM
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Signal Bar (Ticker) */}
      <div className="hidden lg:block w-full bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_rgba(0,0,0,0.4),inset_0_-1px_0_rgba(var(--primary-rgb),0.1)] overflow-hidden relative shrink-0 sticky top-[64px] z-[90] h-[40px]">
        <div className="w-full flex items-center h-full">
          {/* Status Badge */}
          <div className="flex items-center gap-3 shrink-0 bg-surface z-20 px-5 sm:px-6 h-full border-r border-primary/20 shadow-[10px_0_20px_rgba(0,0,0,0.6)]">
            <div className="relative flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute"></span>
              <span className="w-2 h-2 rounded-full bg-red-600 relative z-10"></span>
            </div>
            <span className="text-primary flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 font-black text-[9px] sm:text-[11px] tracking-[0.2em] leading-none sm:leading-normal">
              <span className="opacity-50 text-[7px] sm:text-[11px]">{isAr ? 'إشارة' : 'SIGNAL'}</span>
              <span className="drop-shadow-[0_0_8px_var(--primary)]">{isAr ? 'عاجل' : 'FLASH'}</span>
            </span>
          </div>

          {/* Marquee Content */}
          <div className="relative flex-1 overflow-hidden px-8">
            {/* Subtle Gradient Overlays for better depth */}
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#050810]/90 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#050810]/90 to-transparent z-10 pointer-events-none"></div>

            <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} flex items-center gap-24 py-2`}>
              {/* Using Signals for the ticker as they are rapid updates */}
              {(signals.length > 0 ? [...signals.slice(0, 10), ...signals.slice(0, 10)] : []).map((p, idx) => (
                <Link key={`ticker-${p.id}-${idx}`} href={`/news/${getPostId(p.id)}`} className="hover:text-primary transition-all duration-300 flex items-center gap-5 shrink-0 group">
                  <div className="flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-3 bg-primary/40 rounded-full"></div>
                    <div className="w-1 h-1.5 bg-primary/40 rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-white/90 group-hover:text-primary transition-all uppercase whitespace-nowrap">
                      {deduplicateTitle(p.aiTitle)}
                    </span>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">
                      <span className="text-[7px] font-bold text-primary/60 tracking-[0.2em]">{isAr ? 'اضغط للقراءة' : 'ENCRYPTED FEED'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow w-full flex flex-col">
        {error && (
          <div className="mx-4 mt-4 border border-red-500/50 bg-red-950/20 p-4 text-red-400 font-bold text-sm rounded flex items-center gap-3 shrink-0">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            ERR: {error}
          </div>
        )}

        {loading && articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center grow text-primary gap-4">
            <div className="w-12 h-12 border-4 border-surface border-t-primary rounded-full animate-spin shadow-[0_0_15px_var(--primary)]"></div>
            <span className="font-bold uppercase tracking-widest text-sm animate-pulse drop-shadow-[0_0_8px_var(--primary)]">{isAr ? 'جار مزامنة البيانات العالمية...' : 'Syncing Global Feeds...'}</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-grow">

            {/* LEFT SIDEBAR - Signal Monitor (Text Only) */}
            <div className="hidden lg:flex w-[300px] shrink-0 border-r border-border flex-col bg-background/50 sticky top-[104px] h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar">
              <div className="p-5 border-b border-border bg-surface/30 shrink-0 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse"></span>
                    <h3 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">{isAr ? 'راصد الإشارات' : 'Signal Monitor'}</h3>
                  </div>
                  <span className="text-[8px] font-bold text-primary/60 uppercase tracking-widest leading-none bg-primary/10 px-2 py-0.5 rounded border border-primary/20">LIVE</span>
                </div>
                <p className="text-[8px] font-bold text-text-muted/40 uppercase tracking-[0.15em]">{isAr ? 'تحديثات استخباراتية فورية' : 'Real-time intelligence stream'}</p>
              </div>

              <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {monitorPosts.map(p => (
                  <Link
                    href={`/news/${getPostId(p.id)}`}
                    key={`monitor-${p.id}`}
                    className="group relative flex flex-col gap-2.5 p-3 rounded-xl bg-surface/20 border border-border/50 hover:border-primary/40 hover:bg-surface/40 transition-all duration-300"
                  >
                    <div className="absolute top-0 left-0 w-1 h-0 bg-primary group-hover:h-full transition-all duration-500 rounded-l-xl"></div>

                    <div className="flex items-center justify-between border-b border-border/30 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-black text-red-500 font-mono tracking-tighter">
                          {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                        <span className="text-[7px] font-black text-text-muted/30 uppercase tracking-[0.1em] border-l border-border/30 pl-1.5 ml-0.5">INTEL_RCV</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-text-muted/40 font-mono bg-background/50 px-1.5 py-0.5 rounded-md border border-border/30">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5-2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                        {p.views}
                      </div>
                    </div>

                    <div className="relative">
                      <h4 className={`text-[12.5px] font-bold text-text-muted/80 group-hover:text-white transition-colors leading-[1.6] tracking-wide ${alignClass}`}>
                        {deduplicateTitle(p.aiTitle)}
                      </h4>
                      {/* Subtle scanner line effect on hover */}
                      <div className="absolute -inset-2 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded blur-md pointer-events-none"></div>
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[7px] font-black text-primary/40 uppercase tracking-[0.2em]">Priority: HIGH</span>
                      <svg className="w-3 h-3 text-text-muted/20 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={isAr ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CENTER COLUMN - Main Feed - Mobile Padding Fix */}
            <div className="flex-1 flex flex-col bg-background/30 lg:border-r lg:border-border p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-12">
                {heroPost && (
                  <article className="group relative">
                    <Link href={`/news/${getPostId(heroPost.id)}`} className={`flex flex-col lg:flex-row relative focus:outline-none bg-surface/10 border border-white/5 rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-700 shadow-2xl ${isAr ? 'lg:flex-row-reverse' : ''}`}>
                      {/* Premium Header Accent */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30"></div>

                      {/* Media container - Fixed side layout */}
                      <div className="relative w-full lg:w-[45%] aspect-video lg:aspect-auto overflow-hidden shrink-0 bg-black">
                        <MediaDisplay
                          images={parseMedia(heroPost.imageUrl)}
                          videos={parseMedia(heroPost.videoUrl)}
                          hasVideo={heroPost.hasVideo}
                          isAr={isAr}
                          aspect="h-full"
                          singleMode={true}
                        />
                        {/* Overlay Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-${isAr ? 'left' : 'right'} from-background via-transparent to-transparent opacity-60 z-10`}></div>

                        {/* Floating Top News Tag */}
                        <div className={`absolute top-6 ${isAr ? 'right-6' : 'left-6'} flex items-center gap-3 z-20`}>
                          <span className={`bg-[#020617]/80 backdrop-blur-md border border-primary/30 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${isAr ? 'flex-row-reverse' : ''}`}>
                            <span className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full shadow-[0_0_8px_var(--primary)]"></span>
                            {isAr ? 'أهم الأخبار' : 'Institutional High Priority'}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 sm:p-8 lg:p-12 flex flex-col justify-center gap-5 sm:gap-8 flex-1">
                        <div className="flex flex-col gap-4">
                          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight group-hover:text-primary transition-colors duration-500 ${alignClass}`}>
                            {deduplicateTitle(heroPost.aiTitle) || (isAr ? 'القصة تتطور' : 'BREAKING STORY DEVELOPS')}
                          </h2>

                          <div className={`flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40 ${isAr ? 'flex-row-reverse' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full"></span>
                              <time>{formatDate(heroPost.date)}</time>
                            </div>
                            <div className={`flex items-center gap-2 border-${isAr ? 'r' : 'l'} border-white/10 ${isAr ? 'px-6 font-medium' : 'pl-6'} h-3`}>
                              <svg className="w-3.5 h-3.5 text-primary/60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5-2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                              {heroPost.views}
                            </div>
                            {heroPost.aiTag && (
                              <span className={`text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded ${isAr ? 'mr-auto' : 'ml-auto'}`}>{heroPost.aiTag}</span>
                            )}
                          </div>
                        </div>

                        {/* Summary and Read More Side-by-Side with improved XL layout */}
                        <div className={`flex flex-col xl:flex-row items-start xl:items-center gap-8 justify-between ${isAr ? 'xl:flex-row-reverse' : ''}`}>
                          <p className={`flex-1 text-[1rem] text-text-muted/80 leading-[2.0] font-light tracking-wide ${alignClass} line-clamp-4`}>
                            {heroPost.aiSummary || ""}
                          </p>

                          <div className={`shrink-0 flex items-center gap-4 bg-primary px-8 py-4 rounded-full text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] ${isAr ? 'flex-row-reverse' : ''}`}>
                            <span>{isAr ? 'اقرأ المزيد' : 'Read Intelligence'}</span>
                            <svg className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                )}

                {/* MOBILE ONLY - Individual Signal Monitor Section */}
                <div className="lg:hidden flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse absolute inset-0 blur-sm"></span>
                        <span className="w-2.5 h-2.5 bg-red-600 rounded-full relative z-10"></span>
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">{isAr ? 'راصد الإشارات' : 'Signal Monitor'}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest animate-pulse">{isAr ? 'مباشر' : 'LIVE'}</span>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x no-scrollbar">
                    {monitorPosts.slice(0, 10).map((p) => (
                      <Link
                        key={`mob-section-${p.id}`}
                        href={`/news/${getPostId(p.id)}`}
                        className={`min-w-[280px] p-5 rounded-[1.5rem] bg-surface/30 border border-white/5 flex flex-col gap-3 snap-start relative group active:scale-[0.98] transition-all`}
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                          <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>
                        </div>
                        <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] font-black text-primary/60 font-mono tracking-tighter">
                            {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                          <div className="h-px flex-grow bg-white/5"></div>
                        </div>
                        <h4 className={`text-[13px] font-bold text-white group-hover:text-primary transition-colors leading-relaxed line-clamp-2 ${alignClass}`}>
                          {deduplicateTitle(p.aiTitle)}
                        </h4>
                        <div className={`flex items-center justify-between mt-auto pt-2 border-t border-white/5 ${isAr ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[8px] font-black text-text-muted/30 uppercase tracking-[0.2em]">PRTY_HIGH</span>
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-primary">
                            <span>{isAr ? 'تفاصيل' : 'TRACK'}</span>
                            <svg className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {secondaryPosts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                    {secondaryPosts.map((post) => (
                      <article key={post.id} className="group flex flex-col h-full relative z-0">
                        <Link href={`/news/${getPostId(post.id)}`} className="flex flex-col h-full gap-3 relative focus:outline-none">
                          <MediaDisplay
                            images={parseMedia(post.imageUrl)}
                            videos={parseMedia(post.videoUrl)}
                            hasVideo={post.hasVideo}
                            isAr={isAr}
                            aspect="aspect-video"
                            singleMode={true}
                          />
                          <div className={`mt-2 ${alignClass}`}>
                            <h4 className={`text-[1.15rem] font-bold text-white group-hover:text-primary transition-colors leading-[1.4] tracking-tight`}>{post.aiTitle}</h4>
                          </div>
                          <div className={`flex items-center justify-between text-[10px] text-text-muted/50 font-black uppercase tracking-tighter mt-auto pt-2`}>
                            <time>{formatDate(post.date)}</time>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5-2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                              {post.views}
                            </span>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-12 mt-4">
                  <div className="flex items-center gap-4 border-b border-border pb-2">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest min-w-max">{isAr ? 'المزيد من الأخبار' : 'Recent Updates'}</h3>
                    <div className={`flex-grow h-px ${isAr ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-border to-transparent`}></div>
                  </div>
                  <div className="flex flex-col gap-10">
                    {feedPosts.map((post) => (
                      <article key={post.id} className="group">
                        <Link href={`/news/${getPostId(post.id)}`} className={`flex flex-col md:flex-row gap-6 items-start focus:outline-none ${isAr ? 'md:flex-row-reverse' : ''}`}>
                          <div className="w-full md:w-[240px] shrink-0">
                            <MediaDisplay
                              images={parseMedia(post.imageUrl)}
                              videos={parseMedia(post.videoUrl)}
                              hasVideo={post.hasVideo}
                              isAr={isAr}
                              aspect="aspect-video"
                              singleMode={true}
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-3">
                            <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                              {post.aiTag && (
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">{post.aiTag}</span>
                              )}
                              <time className="text-[9px] text-text-muted/60 font-black uppercase tracking-widest">{formatDate(post.date)}</time>
                              <span className="flex items-center gap-1 text-[9px] text-text-muted/60 font-black">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5-2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                                {post.views}
                              </span>
                            </div>
                            <h4 className={`text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors leading-[1.3] tracking-tight ${alignClass}`}>{post.aiTitle}</h4>
                            <p className={`text-text-muted/70 text-[0.95rem] md:text-[1.05rem] leading-[1.9] line-clamp-3 font-light tracking-wide ${alignClass}`}>{post.aiSummary}</p>
                            <div className={`flex items-center gap-4 mt-2 text-[10px] font-black uppercase tracking-widest text-primary ${isAr ? 'flex-row-reverse' : ''}`}>
                              <span>{isAr ? 'اقرأ المزيد' : 'Read Full Story'}</span>
                              <svg className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                  {hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="w-full py-6 mt-8 border border-border bg-surface hover:bg-surface-hover hover:border-primary/50 transition-all group flex flex-col items-center gap-3 rounded-lg relative overflow-hidden shrink-0"
                    >
                      <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                      {loadingMore ? (
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="text-sm font-black uppercase tracking-[0.2em] text-white group-hover:text-primary transition-colors relative z-10">
                            {isAr ? 'تحميل المزيد من الأخبار' : 'Load More Intel'}
                          </span>
                          <svg className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors animate-bounce relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR - Trending - Stack below feed on mobile */}
            <div className="w-full lg:w-[320px] shrink-0 bg-background/40 border-t lg:border-t-0 lg:border-l border-border lg:sticky top-[104px] lg:h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar">
              <div className="p-6 flex flex-col gap-10">
                <div className="flex flex-col gap-6">
                  <h3 className={`font-black text-white uppercase tracking-widest text-[11px] flex items-center gap-2 mb-4 border-b border-white/10 pb-2 ${isAr ? 'flex-row-reverse ml-auto' : ''}`}>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    {isAr ? 'الإصدارات الموثقة' : 'Verified Drops'}
                  </h3>
                  <div className="flex flex-col gap-6">
                    {sidebarPosts.map(p => (
                      <Link key={`trending-${p.id}`} href={`/news/${getPostId(p.id)}`} className={`group flex gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <div className="w-16 h-12 bg-surface rounded overflow-hidden shrink-0 border border-border group-hover:border-primary/50 transition-colors">
                          <img src={parseMedia(p.imageUrl)[0] || "/placeholder-news.jpg"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="thumb" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <h5 className={`text-[11px] font-bold text-text-muted group-hover:text-primary transition-colors leading-tight line-clamp-2 ${alignClass}`}>{deduplicateTitle(p.aiTitle)}</h5>
                          <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase">
                            <span>{p.views} views</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Formal Footer (Full Width) */}
      <footer className="w-full bg-surface border-t border-border pt-16 pb-24 lg:pb-16 shrink-0 relative z-50">
        <div className="w-full px-6 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center lg:items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]"></div>
              <span className="text-white font-black tracking-[0.2em] uppercase text-base sm:text-lg">Alertvice Intel</span>
            </div>
            <p className="text-[9px] text-text-muted/40 uppercase tracking-[0.2em] font-bold">
              {isAr ? "خدمة الأخبار العالمية الاستخباراتية" : "Global Intel Service"}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 font-bold uppercase tracking-[0.15em] text-[9px] sm:text-[10px]">
            <Link href="/" className="text-text-muted hover:text-white transition-all">{isAr ? "الرئيسية" : "News"}</Link>
            <Link href="/about" className="text-text-muted hover:text-white transition-all">{isAr ? "عن الشركة" : "About"}</Link>
            <Link href="/terms" className="text-text-muted hover:text-white transition-all">{isAr ? "الشروط" : "Terms"}</Link>
            <a href="https://t.me/alertvice" className="text-primary font-black">{isAr ? "تيليجرام" : "Telegram"}</a>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/20">
            <span>&copy; {mounted ? new Date().getFullYear() : "2026"} Alertvice</span>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-green-500/20"></span>
              <span>Encrypted</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Signal Bar (Sticky Footer) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] h-[40px] bg-background/90 backdrop-blur-lg border-t border-primary/30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] flex items-center overflow-hidden">
        <div className="flex items-center h-full w-full">
          <div className="bg-surface h-full px-4 flex items-center gap-2 border-r border-primary/20 shrink-0 z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            <span className="text-primary font-black text-[9px] tracking-widest uppercase">{isAr ? 'إشارات' : 'SIGNALS'}</span>
          </div>
          <div className="flex-1 relative overflow-hidden h-full flex items-center">
            <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} flex items-center gap-12 whitespace-nowrap`}>
              {(monitorPosts.length > 0 ? [...monitorPosts, ...monitorPosts] : []).map((p, idx) => (
                <Link key={`mob-sig-${p.id}-${idx}`} href={`/news/${getPostId(p.id)}`} className="text-[10px] font-bold text-white/70 hover:text-primary transition-colors flex items-center gap-3 group">
                  <span className="text-primary/30 font-black text-[8px]">{new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  <span>{deduplicateTitle(p.aiTitle)}</span>
                  <span className="text-white/10 mx-2">/</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
