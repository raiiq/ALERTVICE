"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MediaDisplay, parseMedia, deduplicateTitle } from "../../components/MediaDisplay";

interface NewsPost {
    id: string; // e.g., "alertvice/123"
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

export default function ArticlePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [post, setPost] = useState<NewsPost | null>(null);
    const [feedPosts, setFeedPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lang, setLang] = useState("en");
    const [mounted, setMounted] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const storedLang = localStorage.getItem("newsLang") || "en";
        setLang(storedLang);
        fetchData(storedLang);
        checkAdmin();
        setMounted(true);
    }, [id]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData(lang, true);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [id, lang]);

    const fetchData = async (currentLang: string, isRefresh = false) => {
        if (!id) return;

        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            // Fetch individual post and sidebar feeds concurrently
            const [postRes, feedRes] = await Promise.all([
                fetch(`/api/news/${id}?lang=${currentLang}&t=${Date.now()}`),
                fetch(`/api/news?lang=${currentLang}&t=${Date.now()}`)
            ]);

            if (!postRes.ok) throw new Error("Article not found or offline");

            const postData = await postRes.json();
            setPost(postData.post);

            if (feedRes.ok) {
                const feedData = await feedRes.json();

                // Comprehensive Deduplication
                const rawPosts: NewsPost[] = feedData.posts || [];
                const idMap = new Map();
                const titleMap = new Map();
                const mediaMap = new Map();
                const dateMap = new Map();
                const uniquePosts: NewsPost[] = [];

                for (const p of rawPosts) {
                    if (idMap.has(p.id)) continue;

                    let titleKey = "";
                    if (p.aiTitle) {
                        titleKey = p.aiTitle.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/gi, '');
                        if (titleKey.length > 5 && titleMap.has(titleKey)) continue;
                    }

                    let mediaKey = "";
                    if (p.videoUrl) mediaKey = p.videoUrl;
                    else if (p.imageUrl) mediaKey = p.imageUrl;

                    if (mediaKey && mediaMap.has(mediaKey)) continue;

                    if (p.date && dateMap.has(p.date)) continue;

                    idMap.set(p.id, true);
                    if (titleKey.length > 5) titleMap.set(titleKey, true);
                    if (mediaKey) mediaMap.set(mediaKey, true);
                    if (p.date) dateMap.set(p.date, true);
                    uniquePosts.push(p);
                }

                setFeedPosts(uniquePosts);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (isRefresh) {
                setIsRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    const toggleLang = (newLang: string) => {
        if (newLang === lang) return;
        setLang(newLang);
        localStorage.setItem("newsLang", newLang);
        fetchData(newLang);
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return `${formattedDate} ${time}`;
    };

    const getPostId = (idString: string) => idString.split('/').pop() || "";
    const numericalId = post?.id.split("/").pop() || id;

    const livePosts = feedPosts.slice(0, 4);
    const latestPosts = feedPosts.slice(4, 9);

    const checkAdmin = async () => {
        try {
            const res = await fetch('/api/admin/news?limit=1');
            if (res.ok) setIsAdmin(true);
        } catch (e) { /* ignore */ }
    };

    const handleDeletePost = async (e: React.MouseEvent, dbId: string, redirect = false) => {
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
                if (redirect) router.push('/');
                else {
                    const sid = data.suppressed;
                    const filterFn = (p: any) => p.dbId !== dbId && (!sid || !p.id.includes(sid));
                    setFeedPosts(prev => prev.filter(filterFn));
                }
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
                fetchData(lang);
            }
        } catch (err) {
            alert("Transmission failed");
        }
    };

    const isAr = lang === 'ar';
    const alignClass = isAr ? 'text-right' : 'text-left';

    return (
        <div className="min-h-screen bg-surfaceackground text-foreground tracking-wide flex flex-col" dir={isAr ? "rtl" : "ltr"}>

            {/* Header */}
            <header className="w-full bg-surface border-b border-border z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] shrink-0 sticky top-0 h-[64px]">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 h-full">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-primary rounded-none animate-pulse shadow-[0_0_10px_var(--primary)]"></div>
                        <Link href="/" className="text-xl sm:text-2xl font-black tracking-tighter text-foreground uppercase drop-shadow-[0_0_8px_var(--primary)] hover:text-primary transition-all duration-300">
                            ALERTVICE
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/" className={`hidden sm:flex text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-primary transition-all items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isAr ? "M14 5l7 7m0 0l-7 7m7-7H3" : "M10 19l-7-7m0 0l7-7m-7 7h18"}></path></svg>
                            {isAr ? 'الرئيسية' : 'Home'}
                        </Link>

                        <div className="flex items-center bg-surfaceackground border border-border-color/50 p-1 rounded-none relative group/lang shadow-lg ml-auto sm:ml-0">
                            {/* Sliding Background */}
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] ${isAr ? (lang === 'ar' ? 'translate-x-0' : 'translate-x-full') : (lang === 'ar' ? 'translate-x-full' : 'translate-x-0')}`}></div>

                            <button
                                onClick={() => toggleLang('en')}
                                className={`relative z-10 px-3 py-1 flex items-center gap-2 transition-colors duration-500 ${!isAr ? 'text-foreground' : 'text-text-muted hover:text-foreground'}`}
                            >
                                <svg className={`w-3 h-3 transition-transform duration-500 ${!isAr ? 'scale-110' : 'opacity-40 group-hover/lang:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span className="text-[9px] font-black tracking-widest uppercase">EN</span>
                            </button>

                            <button
                                onClick={() => toggleLang('ar')}
                                className={`relative z-10 px-3 py-1 flex items-center gap-2 transition-colors duration-500 ${isAr ? 'text-foreground' : 'text-text-muted hover:text-foreground'}`}
                            >
                                <span className="text-[9px] font-black tracking-widest uppercase">AR</span>
                                <svg className={`w-3 h-3 transition-transform duration-500 ${isAr ? 'scale-110' : 'opacity-40 group-hover/lang:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </button>
                        </div>

                        <button
                            onClick={() => fetchData(lang, true)}
                            className={`p-2 rounded-none bg-surfaceackground border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-all ${isRefreshing ? 'animate-spin text-primary' : ''}`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow w-full flex flex-col">
                {loading ? (
                    <div className="flex flex-col items-center justify-center text-primary gap-4 w-full h-full">
                        <div className="w-12 h-12 border-4 border-surface border-t-primary rounded-none animate-spin shadow-[0_0_15px_var(--primary)]"></div>
                        <span className="font-bold uppercase tracking-widest text-sm drop-shadow-[0_0_8px_var(--primary)] animate-pulse">Decrypting Source...</span>
                    </div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center p-8">
                        <div className="border border-red-500/50 bg-red-950/20 p-8 max-w-2xl mx-auto rounded-none shadow-[0_0_20px_rgba(239,68,68,0.2)] text-center">
                            <h2 className="text-2xl font-black text-red-500 mb-4 tracking-wider">NETWORK ERROR</h2>
                            <p className="text-text-muted text-sm mb-8 leading-relaxed max-w-md mx-auto">{error}</p>
                            <Link href="/" className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 font-bold uppercase tracking-widest text-xs rounded transition-all">
                                Initialize Reconnection
                            </Link>
                        </div>
                    </div>
                ) : post ? (
                    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] overflow-hidden">

                        {/* LEFT SIDEBAR - Live Now (Independent Scroll) */}
                        <div className="hidden lg:block w-[300px] shrink-0 h-full overflow-y-auto custom-scrollbar border-r border-border p-6 bg-surfaceackground/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-border">
                                <span className="w-2 h-2 bg-red-500 rounded-none shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse"></span>
                                <h3 className="font-bold text-foreground uppercase tracking-widest text-sm">{isAr ? 'مباشر الآن' : 'Live Now'}</h3>
                            </div>
                            <div className="flex flex-col gap-6">
                                {livePosts.map(p => (
                                    <div key={`live-${p.id}`} className="relative group">
                                        {isAdmin && (
                                            <div className="absolute top-2 right-2 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPost(p); setIsEditModalOpen(true); }} className="p-1 px-1.5 bg-surfacelue-500/80 backdrop-blur-md rounded text-[9px] text-foreground hover:bg-surfacelue-400">EDIT</button>
                                                <button onClick={(e) => handleDeletePost(e, p.dbId)} className="p-1 px-1.5 bg-red-500/80 backdrop-blur-md rounded text-[9px] text-foreground hover:bg-red-400">DEL</button>
                                            </div>
                                        )}
                                        <Link href={`/news/${getPostId(p.id)}`} className="group relative flex flex-col gap-3 p-3 rounded-none bg-surface/10 border border-border/30 hover:border-primary/40 hover:bg-surface/30 transition-all duration-300">
                                            <div className="absolute top-0 left-0 w-1 h-0 bg-primary group-hover:h-full transition-all duration-500 rounded-l-xl"></div>

                                            {(parseMedia(p.imageUrl).length > 0 || p.hasVideo) ? (
                                                <div className="w-full aspect-video rounded-none overflow-hidden relative border border-border/50 group-hover:border-primary/30 transition-all duration-500">
                                                    {p.hasVideo && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-surfaceackground/20 z-10">
                                                            <div className="bg-primary/80 rounded-none w-6 h-6 flex items-center justify-center shadow-[0_0_8px_var(--primary)]">
                                                                <svg className="w-3 h-3 text-foreground translate-x-[0.5px]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {parseMedia(p.imageUrl).length > 0 ? (
                                                        <img 
                                                            src={parseMedia(p.imageUrl)[0]} 
                                                            alt="Live" 
                                                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                                            onError={(e) => {
                                                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E";
                                                                e.currentTarget.className = "w-1/3 h-1/3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-20 filter grayscale";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-surface/20 flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-foreground/5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between border-b border-border/20 pb-1.5">
                                                    <span className="text-[10px] font-black text-red-500 font-mono">
                                                        {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </span>
                                                    <span className="text-[7px] font-black text-primary/40 uppercase tracking-widest">SIGNAL_RCV</span>
                                                </div>
                                                <h4 className={`text-[12.5px] font-bold text-text-muted/80 group-hover:text-foreground transition-colors leading-[1.5] line-clamp-2 ${alignClass}`}>{p.aiTitle}</h4>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[8px] font-bold text-text-muted/30 flex items-center gap-1 uppercase">
                                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5-2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                                                        {p.views}
                                                    </span>
                                                    {p.aiTag && <span className="text-[7px] font-black text-primary/30 uppercase px-1.5 py-0.5 rounded bg-primary/5 border border-primary/10">{p.aiTag}</span>}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CENTER COLUMN - Main Article (Independent Scroll on desktop) */}
                        <div className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto custom-scrollbar bg-surfaceackground/20 p-4 sm:p-8 lg:p-12 relative">
                            {/* Ambient background glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] pointer-events-none rounded-none"></div>

                            <article className="max-w-4xl mx-auto">
                                {/* Eyebrow & Headline */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-primary font-bold tracking-widest uppercase text-xs flex items-center gap-2 drop-shadow-[0_0_5px_var(--primary)] ${alignClass}`}>
                                            <span className="w-2 h-2 rounded-none bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]"></span>
                                            {isAr ? 'تقرير عاجل' : 'Live Report'}
                                            {post.aiTag && (
                                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] ml-2 font-black">{post.aiTag}</span>
                                            )}
                                        </span>
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingPost(post); setIsEditModalOpen(true); }} className="px-4 py-1.5 bg-surfacelue-600 rounded-none text-foreground font-black text-[10px] uppercase hover:bg-surfacelue-500 transition-all">EDIT INTEL</button>
                                                <button onClick={(e) => handleDeletePost(e, post.dbId, true)} className="px-4 py-1.5 bg-red-600 rounded-none text-foreground font-black text-[10px] uppercase hover:bg-red-500 transition-all">DELETE</button>
                                            </div>
                                        )}
                                    </div>
                                    <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black text-foreground leading-[1.2] mb-8 tracking-tight ${alignClass}`}>
                                        {post.aiTitle || "BREAKING NEWS ALERT"}
                                    </h1>

                                    {/* Byline & Date */}
                                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-y border-border/80 py-4 mb-8 bg-surface/50 px-4 rounded-none ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <div className="text-sm font-bold text-text-muted uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-8 h-8 rounded border border-primary/30 bg-surface-hover flex items-center justify-center shadow-[0_0_10px_var(--glow-color)]">
                                                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
                                            </div>
                                            <span>{isAr ? 'بواسطة ' : 'By '}<span className="text-foreground">Alertvice Global Desk</span></span>
                                        </div>
                                        <div className="flex items-center gap-6 mt-4 sm:mt-0">
                                            <time className="text-xs text-text-muted/60 font-bold tracking-widest uppercase">
                                                {formatDate(post.date)}
                                            </time>
                                            <span className="flex items-center gap-1.5 text-xs text-text-muted/60 font-black uppercase">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5-2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                                                {post.views} Views
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Media Display */}
                                <div className="mb-10 w-full relative group">
                                    <MediaDisplay
                                        images={parseMedia(post.imageUrl)}
                                        videos={parseMedia(post.videoUrl)}
                                        hasVideo={post.hasVideo}
                                        isAr={isAr}
                                    />
                                    {post.hasVideo && parseMedia(post.videoUrl).length === 0 && (
                                        <div className={`absolute top-4 ${isAr ? 'right-4' : 'left-4'} bg-surfaceackground/50 backdrop-blur-md text-foreground text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest z-10 flex items-center gap-2 rounded border border-border-color shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                                            <div className="w-2 h-2 bg-red-500 rounded-none shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse"></div>
                                            {isAr ? 'بث مباشر' : 'LIVE FEED'}
                                        </div>
                                    )}
                                </div>

                                {/* Article Text */}
                                <div
                                    className={`prose-editor text-[1.15rem] sm:text-[1.35rem] leading-[2.1] text-foreground/90 space-y-8 [&_a]:text-primary [&_a]:border-b [&_a]:border-primary/30 [&_a:hover]:border-primary [&_a:hover]:text-primary-hover [&_b]:font-black [&_strong]:font-black [&_strong]:text-foreground [&_i]:text-text-muted whitespace-pre-wrap word-break tracking-wide ${alignClass}`}
                                    dangerouslySetInnerHTML={{ __html: post.textHtml || (isAr ? "<i>لا توجد بيانات إضافية.</i>" : "<i>No additional data received in this transmission.</i>") }}
                                />

                                {/* Read More / End */}
                                <div className={`mt-16 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pb-20 ${isAr ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-2 h-2 bg-primary rounded-none shadow-[0_0_8px_var(--primary)]"></div>
                                        <h4 className="font-bold text-foreground uppercase tracking-widest text-sm">{isAr ? 'نهاية التقرير' : 'End of Report'}</h4>
                                    </div>
                                    <a href={`https://t.me/alertvice/${numericalId}`} target="_blank" rel="noopener noreferrer" className={`px-6 py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-muted hover:text-foreground font-bold uppercase text-[11px] tracking-widest transition-colors rounded-none shadow-sm flex items-center gap-3 hover:shadow-[0_0_15px_var(--glow-color)] hover:border-primary/50 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        {isAr ? 'تحقق من المصدر' : 'Verify Source'}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isAr ? "M14 5l7 7m0 0l-7 7m7-7H3" : "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"}></path></svg>
                                    </a>
                                </div>
                            </article>
                        </div>

                        {/* RIGHT SIDEBAR - Latest News (Stack below on mobile) */}
                        <div className="w-full lg:w-[320px] shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar border-t lg:border-t-0 lg:border-l border-border p-6 sm:p-8 bg-surfaceackground/40 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/80">
                                <h3 className={`font-bold text-foreground uppercase tracking-widest text-sm flex items-center gap-2 ${isAr ? 'flex-row-reverse ml-auto' : ''}`}>
                                    <span className="w-2 h-2 bg-primary rounded-none shadow-[0_0_8px_var(--primary)]"></span>
                                    {isAr ? 'أحدث الأخبار' : 'Latest News'}
                                </h3>
                            </div>

                            <div className="flex flex-col gap-6">
                                {latestPosts.map((p) => (
                                    <div key={`latest-${p.id}`} className="relative group">
                                        {isAdmin && (
                                            <div className="absolute top-1 right-1 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPost(p); setIsEditModalOpen(true); }} className="p-1 px-1.5 bg-surfacelue-500/80 backdrop-blur-md rounded text-[8px] text-foreground">EDIT</button>
                                                <button onClick={(e) => handleDeletePost(e, p.dbId)} className="p-1 px-1.5 bg-red-500/80 backdrop-blur-md rounded text-[8px] text-foreground">DEL</button>
                                            </div>
                                        )}
                                        <Link href={`/news/${getPostId(p.id)}`} className={`group flex gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-20 h-14 bg-surface rounded-none overflow-hidden shrink-0 border border-border/50 group-hover:border-primary/40 transition-all duration-500 relative">
                                                {p.hasVideo && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-surfaceackground/20 z-10 transition-all group-hover:bg-surfaceackground/10">
                                                        <div className="bg-primary/90 rounded-none w-5 h-5 flex items-center justify-center shadow-[0_0_5px_var(--primary)] text-foreground">
                                                            <svg className={`w-3 h-3 ${!isAr && 'translate-x-[0.5px]'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                        </div>
                                                    </div>
                                                )}
                                                <img 
                                                    src={parseMedia(p.imageUrl)[0] || ''} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 opacity-60 group-hover:opacity-100" 
                                                    alt="thumb"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E";
                                                        e.currentTarget.className = "w-1/2 h-1/2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-20 filter grayscale";
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <h4 className={`text-[12px] font-bold text-text-muted group-hover:text-foreground transition-colors leading-snug line-clamp-2 ${alignClass}`}>{p.aiTitle}</h4>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">{new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="text-[8px] font-bold text-text-muted/20 flex items-center gap-1">
                                                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5-2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                                                        {p.views}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                ) : null}
            </main>

            {/* Formal Footer (Full Width) */}
            <footer className="w-full bg-surface border-t border-border py-16 shrink-0 relative z-50">
                <div className="w-full px-6 flex flex-col lg:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col items-center lg:items-start gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-none shadow-[0_0_10px_var(--primary)]"></div>
                            <span className="text-foreground font-black tracking-[0.2em] uppercase text-base sm:text-lg">Alertvice Intel</span>
                        </div>
                        <p className="text-[9px] text-text-muted/40 uppercase tracking-[0.2em] font-bold">
                            {isAr ? "خدمة الأخبار العالمية الاستخباراتية" : "Global Intel Service"}
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 sm:gap-10 font-bold uppercase tracking-[0.15em] text-[9px] sm:text-[10px]">
                        <Link href="/" className="text-text-muted hover:text-foreground transition-all">{isAr ? "الرئيسية" : "News"}</Link>
                        <Link href="/about" className="text-text-muted hover:text-foreground transition-all">{isAr ? "عن الشركة" : "About"}</Link>
                        <Link href="/terms" className="text-text-muted hover:text-foreground transition-all">{isAr ? "الشروط" : "Terms"}</Link>
                        <a href="https://t.me/alertvice" className="text-primary font-black">{isAr ? "تيليجرام" : "Telegram"}</a>
                    </div>

                    <div className="flex flex-col items-center lg:items-end gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/20">
                        <span>&copy; {mounted ? new Date().getFullYear() : "2026"} Alertvice</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-none bg-green-500/20"></span>
                            <span>Encrypted</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ADMIN EDIT MODAL */}
            {isEditModalOpen && editingPost && (
                <div className="fixed inset-0 bg-surfaceackground/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-4" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-[#0a0c11] border border-border-color w-full max-w-xl p-8 rounded-none shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-widest">REVISE INTEL</h2>
                        <form onSubmit={handleUpdatePost} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest block mb-1.5">HEADLINE</label>
                                <input value={editingPost.aiTitle || ''} onChange={e => setEditingPost({...editingPost, aiTitle: e.target.value})} className="w-full bg-foreground/5 border border-border-color rounded-none p-3.5 text-foreground font-bold outline-none focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest block mb-1.5">SUMMARY BRIEF</label>
                                <textarea value={editingPost.aiSummary || ''} onChange={e => setEditingPost({...editingPost, aiSummary: e.target.value})} className="w-full bg-foreground/5 border border-border-color rounded-none p-3.5 text-foreground/80 min-h-[100px] outline-none focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest block mb-1.5">SECTOR TAG</label>
                                <select value={editingPost.aiTag || 'world'} onChange={e => setEditingPost({...editingPost, aiTag: e.target.value})} className="w-full bg-foreground/5 border border-border-color rounded-none p-3.5 text-foreground font-bold outline-none cursor-pointer">
                                    <option value="world" className="bg-[#0a0c11]">WORLD</option>
                                    <option value="politics" className="bg-[#0a0c11]">POLITICS</option>
                                    <option value="market" className="bg-[#0a0c11]">MARKET</option>
                                    <option value="tech" className="bg-[#0a0c11]">TECH</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-black py-4 rounded-none hover:bg-foreground transition-all uppercase tracking-widest text-xs">COMMIT DATA</button>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 text-foreground/40 font-bold hover:text-foreground transition-all uppercase tracking-widest text-[10px]">DISCARD</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
