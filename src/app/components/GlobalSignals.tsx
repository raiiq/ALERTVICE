"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";

interface NewsPost {
    id: string;
    plainText: string;
    date: string;
    aiTitle: string | null;
    aiSummary?: string | null;
    isUrgent?: boolean;
}

export default function GlobalSignals() {
    const { lang, isAr } = useLanguage();
    const pathname = usePathname();
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [urgentSignals, setUrgentSignals] = useState<NewsPost[]>([]);

    useEffect(() => {
        const fetchAllSignals = async () => {
            try {
                // Fetch regular signals for ticker
                const resSignals = await fetch(`/api/news?lang=${lang}&limit=10&type=signal&t=${Date.now()}`);
                if (resSignals.ok) {
                    const data = await resSignals.json();
                    setSignals(data.posts || []);
                }

                // Fetch urgent signals for dispatch bar
                const resUrgent = await fetch(`/api/news?lang=${lang}&limit=5&urgent=true&t=${Date.now()}`);
                if (resUrgent.ok) {
                    const data = await resUrgent.json();
                    setUrgentSignals(data.posts || []);
                }
            } catch (e) {
                console.error("Failed to fetch global signals:", e);
            }
        };

        fetchAllSignals();
        const interval = setInterval(fetchAllSignals, 8000); // 8s refresh
        return () => clearInterval(interval);
    }, [lang]);

    const getPostId = (fullId: string) => fullId.split('/').pop();
    const deduplicateTitle = (title: string | null) => title?.replace(/^(ALERT|URGENT|BREAKING):\s*/i, '') || '';

    return (
        <div className={`ticker-wrapper border-b border-white/5 mb-0 relative z-[100] sticky top-0 lg:top-16 ${pathname === '/' ? 'lg:ml-[400px] lg:w-[calc(100%-400px)]' : 'lg:ml-0 lg:w-full'}`}>
            {/* 1. INTELLIGENCE TICKER (RADAR FLASH) */}
            <div className="intelligence-ticker">
                <div className="ticker-badge">
                    <div className="ticker-badge-dot mr-3"></div>
                    <span className="text-primary-foreground font-black text-[13px] tracking-[0.15em] uppercase">{isAr ? 'رادار' : 'RADAR FLASH'}</span>
                </div>
                <div className="ticker-content relative overflow-hidden flex-1 h-full flex items-center">
                    <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} flex items-center gap-32`}>
                        {signals.length > 0 ? (
                            [...signals, ...signals, ...signals, ...signals].map((p, idx) => (
                                <Link key={`ticker-${idx}`} href={`/news/${getPostId(p.id)}`} className="text-[10px] font-bold text-foreground/80 hover:text-primary transition-all uppercase whitespace-nowrap tracking-wider">
                                    <span className="flex items-center gap-4">
                                        <span className="font-black text-primary border-b border-primary/20">{deduplicateTitle(p.aiTitle)}</span>
                                        <span className="opacity-60">{p.aiSummary}</span>
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest px-10">
                                {isAr ? 'جارٍ مسح الترددات...' : 'SCANNING FREQUENCIES...'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. URGENT DISPATCH BAR */}
            {urgentSignals.length > 0 && (
                <div className="urgent-dispatch-bar" dir={isAr ? 'rtl' : 'ltr'}>
                    <div className="urgent-dispatch-label">
                        <span>{isAr ? 'عاجل' : 'URGENT'}</span>
                    </div>
                    <div className="urgent-dispatch-content relative overflow-hidden flex-1 h-full flex items-center">
                        <div className={`${isAr ? 'animate-urgent-marquee-rtl' : 'animate-urgent-marquee'} flex items-center gap-64`}>
                            {[...urgentSignals, ...urgentSignals].map((post, idx) => (
                                <Link key={`urgent-${idx}`} href={`/news/${getPostId(post.id)}`} className="text-[14px] font-bold text-white hover:underline transition-all whitespace-nowrap tracking-wider flex items-center gap-4">
                                    <span className="opacity-60 text-[10px] whitespace-nowrap">{new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                    <span>{post.aiTitle || post.plainText?.slice(0, 100)}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
