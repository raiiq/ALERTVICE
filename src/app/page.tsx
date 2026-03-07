"use client";

import { useEffect, useState } from "react";
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground tracking-wide flex flex-col font-cairo" dir={isAr ? "rtl" : "ltr"}>
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
                    onClick={() => { setActiveCategory(cat); setOffset(0); fetchArticles(false, lang, true); }}
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

              {/* LANGUAGE TOGGLE — dir=ltr pinned: EN always left, AR always right. Pill slides via CSS class */}
              <div className="hidden sm:block lang-toggle" dir="ltr">
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

              {/* MOBILE MENU */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-full border border-white/[0.06]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              </button>
            </div>
          </div>
        </nav>
      </div>

      <div className="hidden lg:block w-full glass border-b border-primary/20 sticky top-[72px] z-[90] h-[40px] overflow-hidden">
        <div className="flex items-center h-full">
          <div className="flex items-center gap-3 shrink-0 bg-surface px-6 h-full border-r border-white/5 shadow-xl z-20">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-primary font-black text-[11px] tracking-widest uppercase">{isAr ? 'عاجل' : 'SIGNAL FLASH'}</span>
          </div>
          <div className="relative flex-1 overflow-hidden px-8">
            <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} flex items-center gap-24`}>
              {[...signals, ...signals].map((p, idx) => (
                <Link key={`ticker-${idx}`} href={`/news/${getPostId(p.id)}`} className="text-[11px] font-bold text-white/90 hover:text-primary transition-all uppercase whitespace-nowrap">
                  {deduplicateTitle(p.aiTitle)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow w-full flex flex-col lg:flex-row">
        {/* LEFT SIDEBAR */}
        <div className="hidden lg:flex w-[320px] shrink-0 border-r border-white/5 flex-col sticky top-[104px] h-[calc(100vh-104px)] overflow-y-auto">
          <div className="p-5 border-b border-white/5 bg-surface/30 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              <h3 className="font-black text-white uppercase tracking-widest text-[11px]">{isAr ? 'راصد الإشارات' : 'Signal Monitor'}</h3>
            </div>
          </div>
          <motion.div variants={containerVars} initial="hidden" animate="show" className="p-4 flex flex-col gap-2">
            {monitorPosts.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 opacity-40">
                <div className="w-8 h-8 border border-primary/30 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{isAr ? 'جارٍ المسح...' : 'Scanning...'}</span>
              </div>
            )}
            {monitorPosts.map(p => (
              <motion.div key={p.id} variants={itemVars}>
                <Link href={`/news/${getPostId(p.id)}`} className="group block p-3 rounded-xl bg-surface/10 border border-white/5 hover:border-primary/20 hover:bg-surface/20 transition-all relative overflow-hidden">
                  <div className={`absolute top-0 ${isAr ? 'right-0' : 'left-0'} w-0.5 h-full bg-primary/0 group-hover:bg-primary/40 transition-colors`}></div>
                  <div className={`flex justify-between items-center mb-1.5 ${isAr ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[9px] font-black text-primary font-mono">{new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[9px] text-text-muted/30 uppercase font-mono">#{getPostId(p.id)}</span>
                  </div>
                  <h4 className={`text-[12px] font-bold text-white/80 group-hover:text-white transition-colors leading-snug ${alignClass} line-clamp-2`}>{deduplicateTitle(p.aiTitle)}</h4>
                  {p.aiSummary && (
                    <p className={`text-[10px] text-text-muted/50 mt-1 leading-relaxed line-clamp-2 ${alignClass}`}>{p.aiSummary}</p>
                  )}
                </Link>
              </motion.div>
            ))}
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
