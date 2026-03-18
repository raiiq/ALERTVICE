"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MediaDisplay, parseMedia, deduplicateTitle } from "./components/MediaDisplay";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";

interface NewsPost {
  id: string;
  dbId: string;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const langRef = useRef("en");

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
      const res = await fetch(`/api/news?lang=${currentLang}&limit=50&type=signal&t=${Date.now()}`);
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

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/admin/news?limit=1');
      if (res.ok) setIsAdmin(true);
    } catch (e) { /* ignore */ }
  };

  const handleDeletePost = async (e: React.MouseEvent, dbId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to PERMANENTLY delete this record?")) return;
    
    try {
      const res = await fetch('/api/admin/news', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dbId }),
      });
      const data = await res.json();
      if (res.ok) {
        const sid = data.suppressed;
        // Filter by either the specific dbId or the suppressed telegram_id
        const filterFn = (p: any) => p.dbId !== dbId && (!sid || !p.id.includes(sid));
        
        setArticles(prev => prev.filter(filterFn));
        setSignals(prev => prev.filter(filterFn));
      }
    } catch (err) {
      alert("Purge sequence failed");
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      const res = await fetch('/api/admin/news', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPost.dbId,
          updates: {
            title: editingPost.aiTitle,
            summary: editingPost.aiSummary,
            tag: editingPost.aiTag,
          }
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingPost(null);
        fetchArticles(true, lang, true);
        fetchSignals(lang, true);
      }
    } catch (err) {
      alert("Transmission failed");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("newsLang") || "en";
    setLang(stored);
    langRef.current = stored;
    fetchArticles(false, stored, true);
    fetchSignals(stored);
    checkAdmin();
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
      fetchSignals(langRef.current);
      // Auto-refresh main feed if it's empty to catch initial sync
      if (articles.length === 0 && !loading) {
        fetchArticles(false, langRef.current, true);
      }
    }, 4000);
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
    if (!hasMore || loading || loadingMore || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && articles.length > 0) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadingMore, hasMore, articles.length, loading, error]);

  const toggleLang = async (newLang: string) => {
    if (newLang === langRef.current) return;
    setIsTranslating(true);
    setLang(newLang);
    langRef.current = newLang;
    localStorage.setItem("newsLang", newLang);
    setOffset(0);
    
    // Explicitly update all sectors immediately
    await Promise.all([
      fetchArticles(false, newLang, true),
      fetchSignals(newLang, true)
    ]);
    
    setTimeout(() => setIsTranslating(false), 600);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const closeMenu = () => setIsMenuOpen(false);
  const getPostId = (idString: string) => idString.split('/').pop() || "";
  const isAr = lang === 'ar';
  const alignClass = isAr ? 'text-right' : 'text-left';

  // URGENT SIGNAL FILTERING (TELEGRAM SIGNALS ONLY)
  const urgentSignals = signals.filter(s => {
    const combined = ((s.plainText || "") + " " + (s.aiTitle || "") + " " + (s.aiSummary || "")).toLowerCase();
    return combined.includes("عاجل") || combined.includes("urgent") || combined.includes("breaking") || combined.includes("alert");
  }).slice(0, 1);
  const monitorPosts = signals.slice(0, 50);
  const filteredPosts = articles.filter(p => {
    if (activeCategory === "all" || activeCategory === "world") return true;
    return p.aiTag === activeCategory;
  });

  const heroPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const secondaryPosts = filteredPosts.length > 1 ? filteredPosts.slice(1, 5) : [];
  const feedPosts = filteredPosts.length > 5 ? filteredPosts.slice(5) : [];
  const sidebarPosts = articles.slice(0, 15);

  if (!mounted || (loading && articles.length === 0)) return (
    <div className={`loading-screen${loadingFading ? ' fading' : ''}`}>
      <div className="loading-radar">
        <div className="loading-radar-ring" />
        <div className="loading-radar-ring" />
        <div className="loading-radar-ring" />
        <div className="loading-radar-sweep" />
        <div className="loading-radar-ping" />
        <div className="loading-radar-core" />
      </div>
      <div className="loading-title" data-text="ALERTVICE">ALERTVICE</div>
      <div className="loading-subtitle">Global Intelligence Network</div>
      <div className="loading-dots"><span /><span /><span /></div>
      <div className="loading-status">Initializing feed...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground tracking-wide flex flex-col" dir={isAr ? "rtl" : "ltr"}>
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

      {/* TACTICAL TRANSLATION LOADER */}
      <AnimatePresence>
        {isTranslating && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/60 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border border-primary/20 rounded-none animate-spin-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-none animate-pulse"></div>
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">
                  {lang === 'ar' ? 'جارٍ الترجمة الفورية...' : 'INSTANT TRANSLATION IN PROGRESS...'}
                </span>
                <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-[0.3em] mt-4 border-t border-white/5 pt-4">ALERTVICE TERMINAL MESH v2.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ===== REUSABLE NAVBAR ===== */}
      <Navbar
        lang={lang}
        setLang={toggleLang}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        refreshing={refreshing}
        onRefresh={() => { fetchArticles(true, lang, true); fetchSignals(lang); }}
      />

      {/* FULL WIDTH TICKERS AT TOP */}
      <div className="ticker-wrapper border-b border-white/5 mb-0 relative z-[100] sticky top-0 lg:top-16 lg:pl-[400px]">
        <div className="intelligence-ticker">
          <div className="ticker-badge">
            <div className="ticker-badge-dot mr-3"></div>
            <span className="text-primary-foreground font-black text-[13px] tracking-[0.15em] uppercase">{isAr ? 'رادار' : 'RADAR FLASH'}</span>
          </div>
          <div className="ticker-content relative overflow-hidden flex-1 h-full flex items-center">
            <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} flex items-center gap-32`}>
              {signals && [...signals, ...signals].map((p, idx) => (
                <Link key={`ticker-${idx}`} href={`/news/${getPostId(p.id)}`} className="text-[10px] font-bold text-foreground/80 hover:text-primary transition-all uppercase whitespace-nowrap tracking-wider">
                  <span className="flex items-center gap-4">
                    <span className="font-black text-primary border-b border-primary/20">{deduplicateTitle(p.aiTitle)}</span>
                    <span className="opacity-60">{p.aiSummary}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {urgentSignals.length > 0 && (
          <div className="urgent-dispatch-bar" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="urgent-dispatch-label">
              <span className="animate-pulse">{isAr ? 'عاجل' : 'URGENT'}</span>
            </div>
            <div className="urgent-dispatch-content relative overflow-hidden flex-1 h-full flex items-center">
              <div className={`${isAr ? 'animate-urgent-marquee-rtl' : 'animate-urgent-marquee'} flex items-center gap-64`}>
                {[1, 2].map((_, idx) => (
                  <Link key={`urgent-${idx}`} href={`/news/${getPostId(urgentSignals[0].id)}`} className="text-[14px] font-bold text-white hover:underline transition-all whitespace-nowrap tracking-wider flex items-center gap-4">
                    <span className="opacity-60 text-[10px] whitespace-nowrap">{new Date(urgentSignals[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                    <span className="flex items-center gap-4">
                      {urgentSignals[0].plainText}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add top padding on desktop to clear the fixed navbar */}
      <main className="flex-grow w-full flex flex-col lg:flex-row mx-auto relative z-10 pt-0 lg:pt-16">

        {/* FEED SECTION - OFFSET ON DESKTOP ONLY */}
        <div className="flex-1 px-4 sm:px-6 lg:px-16 py-6 lg:py-12 lg:pl-[400px] w-full max-w-screen-2xl mx-auto flex flex-col gap-8 lg:gap-12">
          <motion.div variants={containerVars} initial="hidden" animate="show" className="flex flex-col gap-16">
            {!loading && articles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
                <div className="w-16 h-16 border border-primary/20 bg-primary/5 rounded-none flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-widest">{isAr ? 'لا توجد بيانات حالياً' : 'No Intelligence Found'}</h3>
                  <p className="text-sm text-text-muted max-w-xs">{isAr ? 'نحن نقوم بمسح القنوات الآن، يرجى الانتظار...' : 'Scanning active sectors. New signals will appear here shortly.'}</p>
                </div>
                <button onClick={() => fetchArticles(true, lang, true)} className="text-[10px] font-black text-primary border border-primary/20 px-6 py-3 rounded-none hover:bg-primary/10 transition-all uppercase tracking-widest">
                  FORCED RE-SCAN
                </button>
              </div>
            )}

            {heroPost && (
              <motion.article variants={itemVars} className="group overflow-hidden rounded-none bg-surface/10 border border-border-color hover:border-primary/20 transition-all duration-700 shadow-3xl relative">
                {isAdmin && (
                  <div className="absolute top-6 right-6 flex gap-3 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPost(heroPost); setIsEditModalOpen(true); }} className="p-3 bg-blue-600 rounded-none text-foreground hover:bg-blue-500 shadow-2xl border border-border-color flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      EDIT
                    </button>
                    <button onClick={(e) => handleDeletePost(e, heroPost.dbId)} className="p-3 bg-red-600 rounded-none text-foreground hover:bg-red-500 shadow-2xl border border-border-color flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      DELETE
                    </button>
                  </div>
                )}
                <Link href={`/news/${getPostId(heroPost.id)}`} className={`flex flex-col lg:flex-row ${isAr ? 'lg:flex-row-reverse' : ''}`}>
                  {(parseMedia(heroPost.imageUrl).length > 0 || parseMedia(heroPost.videoUrl).length > 0 || heroPost.hasVideo) ? (
                    <div className="w-full lg:w-[50%] aspect-video lg:aspect-auto overflow-hidden shrink-0 relative">
                      <MediaDisplay images={parseMedia(heroPost.imageUrl)} videos={parseMedia(heroPost.videoUrl)} hasVideo={heroPost.hasVideo} isAr={isAr} aspect="h-full" singleMode={true} />
                      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-40"></div>
                    </div>
                  ) : null}
                  <div className={`p-6 sm:p-8 lg:p-12 flex flex-col justify-center gap-6 sm:gap-8 ${!(parseMedia(heroPost.imageUrl).length > 0 || parseMedia(heroPost.videoUrl).length > 0 || heroPost.hasVideo) ? 'w-full' : 'lg:w-[50%]'}`}>
                    <div className="flex flex-col gap-4">
                      <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight group-hover:text-primary transition-colors ${alignClass}`}>{deduplicateTitle(heroPost.aiTitle)}</h2>
                      <div className={`flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-text-muted/40 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <span>{formatDate(heroPost.date)}</span>
                        <span>{heroPost.views} VIEWS</span>
                        {heroPost.aiTag && <span className="text-primary">{heroPost.aiTag}</span>}
                      </div>
                    </div>
                    <p className={`text-[1.1rem] reading-text leading-relaxed opacity-80 ${alignClass} line-clamp-3`}>{heroPost.aiSummary}</p>
                    <div className={`flex items-center gap-4 text-primary-foreground font-black text-[12px] uppercase bg-primary text-primary-foreground px-8 py-4 rounded-none w-max shadow-2xl hover:opacity-90 transition-all ${isAr ? 'flex-row-reverse' : ''}`}>
                      <span>{isAr ? 'اقرأ المزيد' : 'Read Full Intelligence'}</span>
                      <svg className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                  </div>
                </Link>
              </motion.article>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {secondaryPosts.map(p => (
                <motion.article key={p.id} variants={itemVars} className="group flex flex-col gap-4 relative">
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPost(p); setIsEditModalOpen(true); }} className="p-2 bg-blue-600 rounded-none text-foreground hover:bg-blue-500 shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={(e) => handleDeletePost(e, p.dbId)} className="p-2 bg-red-600 rounded-none text-foreground hover:bg-red-500 shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                  <Link href={`/news/${getPostId(p.id)}`} className="flex flex-col gap-4">
                    {(parseMedia(p.imageUrl).length > 0 || parseMedia(p.videoUrl).length > 0 || p.hasVideo) ? (
                      <div className="aspect-video rounded-none overflow-hidden border border-border-color group-hover:border-primary/30 transition-all">
                        <MediaDisplay images={parseMedia(p.imageUrl)} videos={parseMedia(p.videoUrl)} hasVideo={p.hasVideo} isAr={isAr} aspect="aspect-video" singleMode={true} />
                      </div>
                    ) : null}
                    <h3 className={`text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug ${alignClass}`}>{deduplicateTitle(p.aiTitle)}</h3>
                    <div className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest">{formatDate(p.date)}</div>
                  </Link>
                </motion.article>
              ))}
            </div>

            <div className="flex flex-col gap-12 mt-8">
              <div className="h-px bg-foreground/5 w-full"></div>
              {feedPosts.map(p => (
                <motion.article key={p.id} variants={itemVars} className="group relative">
                  {isAdmin && (
                    <div className="absolute top-0 right-0 flex gap-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPost(p); setIsEditModalOpen(true); }} className="p-2 bg-blue-600 rounded-none text-foreground hover:bg-blue-500 shadow-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={(e) => handleDeletePost(e, p.dbId)} className="p-2 bg-red-600 rounded-none text-foreground hover:bg-red-400 shadow-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                  <Link href={`/news/${getPostId(p.id)}`} className={`flex flex-col md:flex-row gap-8 ${isAr ? 'md:flex-row-reverse' : ''}`}>
                    {(parseMedia(p.imageUrl).length > 0 || parseMedia(p.videoUrl).length > 0 || p.hasVideo) ? (
                      <div className="w-full md:w-[300px] shrink-0 rounded-none overflow-hidden border border-border-color">
                        <MediaDisplay images={parseMedia(p.imageUrl)} videos={parseMedia(p.videoUrl)} hasVideo={p.hasVideo} isAr={isAr} aspect="aspect-video" singleMode={true} />
                      </div>
                    ) : null}
                    <div className={`flex flex-col gap-3 justify-center ${!(parseMedia(p.imageUrl).length > 0 || parseMedia(p.videoUrl).length > 0 || p.hasVideo) ? 'w-full' : ''}`}>
                      <h4 className={`text-2xl font-bold text-foreground group-hover:text-primary transition-colors ${alignClass}`}>{deduplicateTitle(p.aiTitle)}</h4>
                      <p className={`reading-text opacity-70 line-clamp-2 ${alignClass}`}>{p.aiSummary}</p>
                      <div className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest">{formatDate(p.date)}</div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            {/* PAGINATION / LOAD MORE */}
            <div className="flex flex-col items-center gap-8 py-12 mt-8 border-t border-border-color">
              {/* Observer Target for Infinite Scroll */}
              <div ref={observerTarget} className="h-4 w-full" />

              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full max-w-md py-6 rounded-none border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black uppercase tracking-[0.3em] transition-all duration-300 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-center gap-4">
                    {loadingMore ? (
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-none animate-spin"></div>
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
                    <div className="w-1.5 h-1.5 bg-foreground rounded-none"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground">END OF AVAILABLE INTELLIGENCE TRANSMISSION</span>
                    <div className="w-px h-12 bg-gradient-to-b from-white to-transparent mt-4"></div>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="w-full bg-surface/80 backdrop-blur-md border-t border-border-color py-10 mt-auto lg:pl-[400px] pb-24 lg:pb-10 mb-0">
        <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-xl font-black text-foreground tracking-widest">ALERTVICE</span>
            <span className="text-[10px] text-text-muted uppercase tracking-[0.3em]">Global Intelligence Network</span>
          </div>
          <div className="flex gap-8 text-[11px] font-black text-text-muted">
            <Link href="/" className="hover:text-primary">NEWS</Link>
            <Link href="/about" className="hover:text-primary">PROTOCOLS</Link>
            <a href="https://t.me/alertvice" className="hover:text-primary">ENCRYPTED TELEGRAM</a>
          </div>
          <div className="text-[10px] text-foreground/20 font-mono">&copy; 2026 ALERTVICE CORE</div>
        </div>
      </footer>

      {/* ADMIN EDIT MODAL */}
      <AnimatePresence>
          {isEditModalOpen && editingPost && (
              <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-background/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-8"
                  onClick={() => setIsEditModalOpen(false)}
              >
                  <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#0a0c11] border border-border-color w-full max-w-2xl p-8 rounded-none shadow-2xl overflow-hidden relative"
                      onClick={(e) => e.stopPropagation()}
                  >
                      {/* Glow effect */}
                      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-none"></div>

                      <div className="flex justify-between items-center mb-8 relative z-10">
                          <div>
                              <h2 className="text-2xl font-black tracking-tighter uppercase text-foreground">REVISE INTELLIGENCE</h2>
                              <p className="text-primary text-[9px] font-bold tracking-[0.3em] uppercase mt-1">DIRECT DB OVERRIDE</p>
                          </div>
                      </div>

                      <form onSubmit={handleUpdatePost} className="space-y-6 relative z-10">
                          <div>
                              <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest block mb-2">HEADLINE</label>
                              <input 
                                  value={editingPost.aiTitle || ''}
                                  onChange={(e) => setEditingPost({...editingPost, aiTitle: e.target.value})}
                                  className="w-full bg-foreground/5 border border-border-color rounded-none p-4 text-foreground font-bold focus:border-primary outline-none transition-all"
                              />
                          </div>
                          <div>
                              <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest block mb-2">SUMMARY BRIEF</label>
                              <textarea 
                                  value={editingPost.aiSummary || ''}
                                  onChange={(e) => setEditingPost({...editingPost, aiSummary: e.target.value})}
                                  className="w-full bg-foreground/5 border border-border-color rounded-none p-4 text-foreground/80 min-h-[120px] focus:border-primary outline-none transition-all"
                              />
                          </div>
                          <div>
                              <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest block mb-2">SECTOR TAG</label>
                              <select 
                                  value={editingPost.aiTag || 'world'}
                                  onChange={(e) => setEditingPost({...editingPost, aiTag: e.target.value})}
                                  className="w-full bg-foreground/5 border border-border-color rounded-none p-4 text-foreground font-bold outline-none cursor-pointer"
                              >
                                  <option value="world" className="bg-[#0a0c11]">WORLD</option>
                                  <option value="politics" className="bg-[#0a0c11]">POLITICS</option>
                                  <option value="market" className="bg-[#0a0c11]">MARKET</option>
                                  <option value="tech" className="bg-[#0a0c11]">TECH</option>
                              </select>
                          </div>

                          <div className="flex gap-4 pt-4">
                              <button type="submit" className="flex-1 bg-primary text-primary-foreground px-4 h-full flex items-center font-bold uppercase tracking-widest text-[11px] font-black py-4 rounded-none hover:bg-foreground transition-all uppercase tracking-widest text-xs">COMMIT CHANGES</button>
                              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 bg-foreground/5 text-foreground/40 font-bold hover:text-foreground transition-all uppercase tracking-widest text-[10px]">DISCARD</button>
                          </div>
                      </form>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* FULL HEIGHT LEFT SIDEBAR (SIGNAL MONITOR) — DESKTOP ONLY */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[400px] h-screen bg-background border-r border-white/10 intelligence-sidebar z-[500] flex-col" style={{ top: 0, height: '100vh' }}>
        <div className={`w-full px-4 sm:px-8 min-h-[64px] lg:h-16 border-b border-white/10 bg-background/95 backdrop-blur-3xl flex items-center justify-between z-[60] shrink-0 relative ${isAr ? 'text-right' : 'text-left'}`}>
          {/* Subtle scanline moving across the header */}
          <div className="sidebar-header-scan" />
          <div className={`flex items-center gap-3 sm:gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
            {/* Sonar-ring live dot */}
            <div className="sonar-dot">
              <div className="ring" />
              <div className="ring" />
              <div className="ring" />
              <div className="core" />
            </div>
            <h3 className="font-black text-foreground uppercase tracking-[0.3em] text-[11px] sm:text-[13px]">{isAr ? 'رادار التنبيه' : 'SIGNAL MONITOR'}</h3>
          </div>
          <Link href="/live" className="text-[10px] font-black text-primary border border-primary/20 bg-primary/5 px-4 py-2 rounded-none hover:bg-primary/20 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            {isAr ? 'عرض مباشر' : '3D TRACKING'}
          </Link>
        </div>

        <motion.div variants={containerVars} initial="hidden" animate="show" className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-0 transition-all">
          {monitorPosts.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-24 opacity-20">
              <div className="w-12 h-12 border border-primary/20 rounded-none flex items-center justify-center animate-spin-slow">
                <div className="w-2 h-2 bg-primary rounded-none"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">{isAr ? 'جارٍ المسح...' : 'SCANNING...'}</span>
            </div>
          )}

          <div className="flex flex-col gap-6 px-0 sm:px-8 py-2 relative z-10 mt-2">
            {monitorPosts.map((p, idx) => {
               const title = deduplicateTitle(p.aiTitle) || "";
               return (
                <motion.div key={p.id} variants={itemVars}>
                  <Link href={`/news/${getPostId(p.id)}`} className="liquid-sidebar-card group radar-signal-framework">
                    {/* Horizontal scanline sweep */}
                    <div className="animate-ingest" />
                    {/* Vertical data-stream bar with staggered delay */}
                    <div className="signal-stream" style={{ ['--stream-delay' as any]: `${(idx % 5) * 0.7}s` }} />
                    <div className={`flex justify-between items-center mb-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <div className="w-1 h-1 bg-primary rounded-none" />
                        <span className="text-[9px] font-bold text-primary/60 font-mono tracking-widest">
                          {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                      <span className="text-[8px] font-bold font-mono uppercase blip-flicker">ID-{getPostId(p.id).slice(-4)}</span>
                    </div>
                    <h4 className={`text-[12px] font-bold text-foreground/80 group-hover:text-primary transition-colors leading-relaxed ${alignClass} line-clamp-2`}>
                      {title}
                    </h4>
                  </Link>
                </motion.div>
               );
            })}
          </div>
        </motion.div>
      </aside>
    </div >
  );
}
