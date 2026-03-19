"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";

interface NewsPost {
    id: string;
    plainText: string;
    date: string;
    aiTitle: string | null;
    aiTag?: string | null;
    location?: { name: string; lat: number; lng: number } | null;
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    Conflict: { bg: "#7f1d1d", text: "#fca5a5" },
    Political: { bg: "#3b0764", text: "#c4b5fd" },
    Military: { bg: "#1e3a5f", text: "#7dd3fc" },
    Security: { bg: "#1a2e1a", text: "#86efac" },
    default: { bg: "#1c1c22", text: "#9ca3af" },
};

function getTimeAgo(dateStr: string, isAr: boolean): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isAr ? "الآن" : "JUST NOW";
    if (mins < 60) return isAr ? `${mins} دقيقة` : `${mins}M AGO`;
    const hours = Math.floor(mins / 60);
    return isAr ? `${hours} ساعة` : `${hours}H AGO`;
}

export default function SignalsPage() {
    const { lang, toggleLang, isAr } = useLanguage();
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const res = await fetch(`/api/news?lang=${lang}&limit=50&type=signal&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setSignals(data.posts || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 30000);
        return () => clearInterval(interval);
    }, [lang]);


    return (
        <div className="min-h-screen text-foreground flex flex-col pb-24 pt-16 lg:pt-32 relative z-10" dir={isAr ? "rtl" : "ltr"}>
            {/* Global Navbar and Signals are in layout.tsx */}
            
            {/* TACTICAL HEADER */}
            <header className="pt-20 px-6 pb-4 border-b border-white/10 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-[0.2em] text-primary uppercase">{isAr ? 'رادار الإشارات' : 'RADAR SIGNALS'}</h1>
                        <p className="text-[10px] font-bold text-foreground/40 tracking-widest uppercase mt-1">{isAr ? 'اعتراضات الاستخبارات الحية' : 'Live Intelligence Intercepts'}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-3 py-1 animate-pulse">
                        <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#38bdf8]"></div>
                        <span className="text-[10px] font-black text-primary tracking-widest uppercase">{isAr ? 'جارٍ المسح' : 'SCANNING'}</span>
                    </div>
                </div>
            </header>

            {/* SIGNAL LIST */}
            <main className="flex-1 overflow-y-auto px-4 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                        <div className="w-12 h-12 border-2 border-dashed border-primary rounded-none animate-spin"></div>
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase">{isAr ? 'جاري الاعتراض...' : 'Intercepting Feed...'}</span>
                    </div>
                ) : signals.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {signals.map((post, idx) => {
                            const tagStyle = TAG_COLORS[post.aiTag ?? "default"] ?? TAG_COLORS.default;
                            return (
                                <div 
                                    key={post.id}
                                    className="group relative bg-surface border border-white/5 p-5 transition-all active:scale-[0.98] border-l-4 border-l-primary/30 hover:border-l-primary"
                                    onClick={() => router.push(`/?post=${post.id.split('/').pop()}`)}
                                >
                                    {/* Scanline overlay */}
                                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-0 opacity-20"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span 
                                                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                                    style={{ background: tagStyle.bg, color: tagStyle.text, border: `1px solid ${tagStyle.text}33` }}
                                                >
                                                    {post.aiTag || (isAr ? "عام" : "SIGNAL")}
                                                </span>
                                                <span className="text-[9px] font-mono text-primary/40 font-bold uppercase tracking-widest">
                                                    ID-{Math.min(idx + 101, 999)}
                                                </span>
                                            </div>
                                            <span className="text-[9px] text-foreground/30 font-mono italic">
                                                {getTimeAgo(post.date, isAr)}
                                            </span>
                                        </div>

                                        <h2 className={`text-sm font-bold leading-relaxed mb-3 ${isAr ? 'text-right' : 'text-left'}`}>
                                            {post.aiTitle || post.plainText?.slice(0, 100)}
                                        </h2>

                                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-2 opacity-60">
                                                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                                                    ACTIVATE INTEL
                                                </span>
                                            </div>
                                            <div className="w-1.5 h-1.5 bg-primary animate-ping"></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center opacity-30 text-[10px] font-black tracking-widest uppercase">
                        NO ACTIVE SIGNALS DETECTED
                    </div>
                )}
            </main>

            <style jsx global>{`
                @font-face {
                    font-family: 'ReutersHeadline';
                    src: local('Libre Franklin'), local('Helvetica Neue'), Arial, sans-serif;
                }
                body {
                    -webkit-tap-highlight-color: transparent;
                }
            `}</style>
        </div>
    );
}
