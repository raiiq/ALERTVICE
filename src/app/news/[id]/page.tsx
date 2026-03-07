"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MediaDisplay, parseMedia, deduplicateTitle } from "../../components/MediaDisplay";
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
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const storedLang = localStorage.getItem("newsLang") || "en";
        setLang(storedLang);
        fetchData(storedLang);
        setMounted(true);
    }, [id]);

    const fetchData = async (currentLang: string, isRefresh = false) => {
        if (!id) return;
        if (isRefresh) setIsRefreshing(true);
        else setLoading(true);
        setError("");

        try {
            const [postRes, feedRes] = await Promise.all([
                fetch(`/api/news/${id}?lang=${currentLang}&t=${Date.now()}`),
                fetch(`/api/news?lang=${currentLang}&limit=10&t=${Date.now()}`)
            ]);

            if (!postRes.ok) throw new Error("Article not found or offline");
            const postData = await postRes.json();
            setPost(postData.post);

            if (feedRes.ok) {
                const feedData = await feedRes.json();
                setFeedPosts(feedData.posts || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsRefreshing(false);
            setLoading(false);
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
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const getPostId = (idString: string) => idString.split('/').pop() || "";
    const isAr = lang === 'ar';
    const alignClass = isAr ? 'text-right' : 'text-left';

    const containerVars = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVars = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground tracking-wide flex flex-col font-cairo" dir={isAr ? "rtl" : "ltr"}>
            <header className="w-full glass border-b border-white/5 z-50 shadow-2xl shrink-0 sticky top-0 h-[64px]">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 h-full">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]"></div>
                        <Link href="/" className="text-xl sm:text-2xl font-black tracking-tighter text-white uppercase hover:text-primary transition-all duration-300">
                            ALERTVICE
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/" className={`hidden sm:flex text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-primary transition-all items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isAr ? "M14 5l7 7m0 0l-7 7m7-7H3" : "M10 19l-7-7m0 0l7-7m-7 7h18"}></path></svg>
                            {isAr ? 'الرئيسية' : 'Home'}
                        </Link>

                        <div className="hidden sm:flex items-center bg-black/40 border border-white/5 p-1 rounded-full relative shadow-lg">
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${lang === 'ar' ? (isAr ? 'translate-x-0' : 'translate-x-full') : (isAr ? 'translate-x-full' : 'translate-x-0')}`}></div>
                            <button onClick={() => toggleLang('en')} className={`relative z-10 px-4 py-1.5 text-[10px] font-black tracking-widest ${lang === 'en' ? 'text-white' : 'text-text-muted'}`}>EN</button>
                            <button onClick={() => toggleLang('ar')} className={`relative z-10 px-4 py-1.5 text-[10px] font-black tracking-widest ${lang === 'ar' ? 'text-white' : 'text-text-muted'}`}>AR</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow w-full flex flex-col">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center grow text-primary gap-4">
                            <div className="w-12 h-12 border-4 border-surface border-t-primary rounded-full animate-spin shadow-[0_0_15px_var(--primary)]"></div>
                            <span className="font-bold uppercase tracking-widest text-sm animate-pulse">Establishing Secure Connection...</span>
                        </motion.div>
                    ) : post ? (
                        <motion.div key="content" variants={containerVars} initial="hidden" animate="show" className="flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] overflow-hidden">

                            {/* SIDEBAR */}
                            <div className="hidden lg:block w-[320px] shrink-0 h-full overflow-y-auto custom-scrollbar border-r border-white/5 p-6 bg-surface/10 backdrop-blur-sm">
                                <h3 className={`font-black text-white uppercase tracking-widest text-xs mb-8 border-b border-white/5 pb-2 ${isAr ? 'text-right' : ''}`}>Intelligence Stream</h3>
                                <div className="flex flex-col gap-6">
                                    {feedPosts.slice(0, 5).map(p => (
                                        <Link href={`/news/${getPostId(p.id)}`} key={p.id} className="group flex flex-col gap-3 p-3 rounded-2xl bg-surface/20 border border-white/5 hover:border-primary/40 transition-all duration-500">
                                            <div className="aspect-video rounded-xl overflow-hidden border border-white/5">
                                                <img src={parseMedia(p.imageUrl)[0] || "/placeholder-news.jpg"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="Intel" />
                                            </div>
                                            <h4 className={`text-[12px] font-bold text-text-muted group-hover:text-white transition-colors leading-relaxed line-clamp-2 ${alignClass}`}>{p.aiTitle}</h4>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* ARTICLE AREA */}
                            <div className="flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar p-6 sm:p-12 lg:p-20 relative">
                                <article className="max-w-4xl mx-auto flex flex-col gap-12">
                                    <motion.div variants={itemVars} className="flex flex-col gap-6">
                                        <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                                            <span className="bg-primary/20 text-primary px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest">Official Drop / {getPostId(post.id)}</span>
                                            <time className="text-[10px] text-text-muted/40 font-black tracking-widest uppercase">{formatDate(post.date)}</time>
                                        </div>
                                        <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter ${alignClass}`}>
                                            {post.aiTitle}
                                        </h1>
                                        <div className={`flex items-center gap-4 text-xs font-bold text-text-muted opacity-60 ${isAr ? 'flex-row-reverse' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                                <span>{post.views} INTERCEPTIONS</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVars} className="w-full rounded-[2.5rem] overflow-hidden border border-white/5 shadow-3xl">
                                        <MediaDisplay images={parseMedia(post.imageUrl)} videos={parseMedia(post.videoUrl)} hasVideo={post.hasVideo} isAr={isAr} />
                                    </motion.div>

                                    <motion.div
                                        variants={itemVars}
                                        className={`reading-text text-xl lg:text-2xl text-foreground/90 space-y-10 prose-editor ${alignClass}`}
                                        dangerouslySetInnerHTML={{ __html: post.textHtml }}
                                    />

                                    <motion.div variants={itemVars} className="mt-12 py-12 border-t border-white/5 flex flex-col gap-8">
                                        <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-2xl">
                                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-black text-sm uppercase tracking-widest">Verified Intelligence</span>
                                                <span className="text-[10px] text-text-muted uppercase tracking-widest">This source has been validated by Alertvice Net</span>
                                            </div>
                                        </div>
                                        <a href={`https://t.me/alertvice/${getPostId(post.id)}`} target="_blank" className="bg-white/5 hover:bg-white/10 border border-white/5 px-8 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.3em] transition-all text-center">
                                            VIEW ENCRYPTED SOURCE ON TELEGRAM
                                        </a>
                                    </motion.div>
                                </article>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </main>

            <footer className="w-full glass border-t border-white/5 py-12 shrink-0">
                <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-xl font-black text-white tracking-widest">ALERTVICE</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-[0.3em]">Institutional Grade Feeds</span>
                    </div>
                    <div className="text-[10px] text-white/20 font-mono italic">END OF TRANSMISSION</div>
                </div>
            </footer>
        </div>
    );
}
