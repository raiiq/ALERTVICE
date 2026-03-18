"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MediaDisplay, parseMedia, deduplicateTitle } from "../../components/MediaDisplay";
import { useLanguage } from "../../context/LanguageContext";

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
    const { lang, toggleLang, isAr } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [post, setPost] = useState<NewsPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchData(lang);
        checkAdmin();
        setMounted(true);
    }, [id, lang]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchData(lang, true);
        }, 5000);
        return () => clearInterval(intervalId);
    }, [id, lang]);

    const fetchData = async (currentLang: string, isRefresh = false) => {
        if (!id) return;
        if (isRefresh) setIsRefreshing(true);
        else setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/news/${id}?lang=${currentLang}&t=${Date.now()}`);
            if (!res.ok) throw new Error("Article not found or offline");
            const data = await res.json();
            setPost(data.post);
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (isRefresh) setIsRefreshing(false);
            else setLoading(false);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    };

    const numericalId = post?.id.split("/").pop() || id;

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
            if (res.ok && redirect) router.push('/');
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

    const alignClass = isAr ? 'text-right' : 'text-left';

    return (
        <div className="min-h-screen bg-background text-foreground tracking-wide flex flex-col pt-16 lg:pt-32" dir={isAr ? "rtl" : "ltr"}>
            <main className="flex-grow w-full flex flex-col">
                {loading ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-primary gap-4 py-20">
                        <div className="w-12 h-12 border-4 border-white/5 border-t-primary rounded-none animate-spin shadow-[0_0_15px_var(--primary)]"></div>
                        <span className="font-bold uppercase tracking-widest text-sm drop-shadow-[0_0_8px_var(--primary)] animate-pulse">Decrypting Source...</span>
                    </div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center p-8">
                        <div className="border border-red-500/50 bg-red-950/20 p-8 max-w-2xl mx-auto rounded-none shadow-[0_0_20px_rgba(239,68,68,0.2)] text-center">
                            <h2 className="text-2xl font-black text-red-500 mb-4 tracking-wider">NETWORK ERROR</h2>
                            <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-md mx-auto">{error}</p>
                            <Link href="/" className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 font-bold uppercase tracking-widest text-xs rounded transition-all">
                                Initialize Reconnection
                            </Link>
                        </div>
                    </div>
                ) : post ? (
                    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-8 py-12">
                        <div className="relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] pointer-events-none rounded-none"></div>
                            <article className="max-w-4xl mx-auto relative z-10">
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
                                                <button onClick={() => { setEditingPost(post); setIsEditModalOpen(true); }} className="px-4 py-1.5 bg-blue-600 rounded-none text-foreground font-black text-[10px] uppercase hover:bg-blue-500 transition-all">EDIT INTEL</button>
                                                <button onClick={(e) => handleDeletePost(e, post.dbId, true)} className="px-4 py-1.5 bg-red-600 rounded-none text-foreground font-black text-[10px] uppercase hover:bg-red-500 transition-all">DELETE</button>
                                            </div>
                                        )}
                                    </div>
                                    <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black text-foreground leading-[1.2] mb-8 tracking-tight ${alignClass}`}>
                                        {post.aiTitle || "BREAKING NEWS ALERT"}
                                    </h1>
                                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-y border-white/10 py-4 mb-8 bg-white/5 px-4 rounded-none ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-8 h-8 rounded border border-primary/30 bg-white/5 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
                                            </div>
                                            <span>{isAr ? 'بواسطة ' : 'By '}<span className="text-foreground">Alertvice Global Desk</span></span>
                                        </div>
                                        <div className="flex items-center gap-6 mt-4 sm:mt-0">
                                            <time className="text-xs text-muted-foreground/60 font-bold tracking-widest uppercase">{formatDate(post.date)}</time>
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60 font-black uppercase">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5-2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                                                {post.views} Views
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-10 w-full relative group">
                                    <MediaDisplay images={parseMedia(post.imageUrl)} videos={parseMedia(post.videoUrl)} hasVideo={post.hasVideo} isAr={isAr} />
                                    {post.hasVideo && parseMedia(post.videoUrl).length === 0 && (
                                        <div className={`absolute top-4 ${isAr ? 'right-4' : 'left-4'} bg-background/50 backdrop-blur-md text-foreground text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest z-10 flex items-center gap-2 rounded border border-white/10 shadow-2xl`}>
                                            <div className="w-2 h-2 bg-red-500 rounded-none shadow-lg animate-pulse"></div>
                                            {isAr ? 'بث مباشر' : 'LIVE FEED'}
                                        </div>
                                    )}
                                </div>
                                <div
                                    className={`prose-editor text-[1.15rem] sm:text-[1.35rem] leading-[2.1] text-foreground/90 space-y-8 [&_a]:text-primary [&_a]:border-b [&_a]:border-primary/30 [&_a:hover]:border-primary [&_a:hover]:text-primary-hover [&_b]:font-black [&_strong]:font-black [&_strong]:text-foreground [&_i]:text-muted-foreground whitespace-pre-wrap word-break tracking-wide ${alignClass}`}
                                    dangerouslySetInnerHTML={{ __html: post.textHtml || (isAr ? "<i>لا توجد بيانات إضافية.</i>" : "<i>No additional data received in this transmission.</i>") }}
                                />
                                <div className={`mt-16 border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pb-20 ${isAr ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-2 h-2 bg-primary rounded-none shadow-[0_0_8px_var(--primary)]"></div>
                                        <h4 className="font-bold text-foreground uppercase tracking-widest text-sm">{isAr ? 'نهاية التقرير' : 'End of Report'}</h4>
                                    </div>
                                    <a href={`https://t.me/alertvice/${numericalId}`} target="_blank" rel="noopener noreferrer" className={`px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground font-bold uppercase text-[11px] tracking-widest transition-colors rounded-none shadow-sm flex items-center gap-3 hover:shadow-[0_0_15px_var(--primary)] hover:border-primary/50 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        {isAr ? 'تحقق من المصدر' : 'Verify Source'}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isAr ? "M14 5l7 7m0 0l-7 7m7-7H3" : "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"}></path></svg>
                                    </a>
                                </div>
                            </article>
                        </div>
                    </div>
                ) : null}
            </main>

            <footer className="w-full bg-white/5 border-t border-white/10 py-16 shrink-0 relative z-50">
                <div className="w-full px-6 flex flex-col lg:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col items-center lg:items-start gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-none shadow-[0_0_10px_var(--primary)]"></div>
                            <span className="text-foreground font-black tracking-[0.2em] uppercase text-base sm:text-lg">Alertvice Intel</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-bold">
                            {isAr ? "خدمة الأخبار العالمية الاستخباراتية" : "Global Intel Service"}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-10 font-bold uppercase tracking-[0.15em] text-[9px] sm:text-[10px]">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-all">{isAr ? "الرئيسية" : "News"}</Link>
                        <Link href="/about" className="text-muted-foreground hover:text-foreground transition-all">{isAr ? "عن الشركة" : "About"}</Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-all">{isAr ? "الشروط" : "Terms"}</Link>
                        <a href="https://t.me/alertvice" className="text-primary font-black">{isAr ? "تيليجرام" : "Telegram"}</a>
                    </div>
                    <div className="flex flex-col items-center lg:items-end gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">
                        <span>&copy; {mounted ? new Date().getFullYear() : "2026"} Alertvice</span>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-none bg-green-500/20"></span>
                            <span>Encrypted</span>
                        </div>
                    </div>
                </div>
            </footer>

            {isEditModalOpen && editingPost && (
                <div className="fixed inset-0 bg-background/95 backdrop-blur-3xl z-[1000] flex items-center justify-center p-4" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-[#0a0c11] border border-white/10 w-full max-w-xl p-8 rounded-none shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-widest">REVISE INTEL</h2>
                        <form onSubmit={handleUpdatePost} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1.5">HEADLINE</label>
                                <input value={editingPost.aiTitle || ''} onChange={e => setEditingPost({...editingPost, aiTitle: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-none p-3.5 text-foreground font-bold outline-none focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1.5">SUMMARY BRIEF</label>
                                <textarea value={editingPost.aiSummary || ''} onChange={e => setEditingPost({...editingPost, aiSummary: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-none p-3.5 text-foreground/80 min-h-[100px] outline-none focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1.5">SECTOR TAG</label>
                                <select value={editingPost.aiTag || 'world'} onChange={e => setEditingPost({...editingPost, aiTag: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-none p-3.5 text-foreground font-bold outline-none cursor-pointer">
                                    <option value="world" className="bg-[#0a0c11]">WORLD</option>
                                    <option value="politics" className="bg-[#0a0c11]">POLITICS</option>
                                    <option value="market" className="bg-[#0a0c11]">MARKET</option>
                                    <option value="tech" className="bg-[#0a0c11]">TECH</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-black py-4 rounded-none hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs">COMMIT DATA</button>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 text-white/40 font-bold hover:text-white transition-all uppercase tracking-widest text-[10px]">DISCARD</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
