"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { deduplicateTitle } from "../components/MediaDisplay";

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

const IRAQ_CITIES = [
    { name: "Baghdad", ar: "بغداد", lat: 33.31, lng: 44.36 },
    { name: "Mosul", ar: "الموصل", lat: 36.34, lng: 43.15 },
    { name: "Basra", ar: "البصرة", lat: 30.50, lng: 47.78 },
    { name: "Erbil", ar: "أربيل", lat: 36.19, lng: 44.01 },
    { name: "Sulaymaniyah", ar: "السليمانية", lat: 35.56, lng: 45.44 },
    { name: "Kirkuk", ar: "كركوك", lat: 35.47, lng: 44.39 },
    { name: "Najaf", ar: "النجف", lat: 32.03, lng: 44.35 },
    { name: "Karbala", ar: "كربلاء", lat: 32.62, lng: 44.02 },
    { name: "Nasiriyah", ar: "الناصرية", lat: 31.06, lng: 46.26 },
    { name: "Amara", ar: "العمارة", lat: 31.85, lng: 47.14 },
    { name: "Samawah", ar: "السماوة", lat: 31.33, lng: 45.28 },
    { name: "Kut", ar: "الكوت", lat: 32.50, lng: 45.82 },
    { name: "Hillah", ar: "الحلة", lat: 32.48, lng: 44.42 },
    { name: "Baqubah", ar: "بعقوبة", lat: 33.74, lng: 44.65 },
    { name: "Ramadi", ar: "الرمادي", lat: 33.43, lng: 43.30 },
    { name: "Fallujah", ar: "الفلوجة", lat: 33.35, lng: 43.78 },
    { name: "Duhok", ar: "دهوك", lat: 36.87, lng: 42.99 },
    { name: "Tikrit", ar: "تكريت", lat: 34.60, lng: 43.68 },
];

export default function SignalMonitorPage() {
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState("en");

    useEffect(() => {
        if (typeof window === "undefined") return;

        const stored = localStorage.getItem("newsLang") || "en";
        setLang(stored);

        const fetchSignals = async () => {
            try {
                const res = await fetch(`/api/news?lang=${stored}&limit=40&type=signal&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setSignals(data.posts || []);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 10000);
        return () => clearInterval(interval);
    }, []);

    const isAr = lang === "ar";

    // Detect location in post
    const getPostLocation = (post: NewsPost) => {
        const text = ((post.aiTitle || "") + " " + (post.aiSummary || "") + " " + post.plainText).toLowerCase();
        return IRAQ_CITIES.find(city =>
            text.includes(city.name.toLowerCase()) || text.includes(city.ar)
        );
    };

    const signalsWithLocations = useMemo(() => {
        return signals.map(s => ({
            ...s,
            location: getPostLocation(s)
        }));
    }, [signals]);

    // Coordinate conversion to SVG space (ViewBox 0 0 1000 800)
    const getXY = (lat: number, lng: number) => {
        const minLng = 38.5, maxLng = 49.5;
        const minLat = 29.0, maxLat = 37.5;
        const x = ((lng - minLng) / (maxLng - minLng)) * 1000;
        const y = (1 - (lat - minLat) / (maxLat - minLat)) * 800;
        return { x, y };
    };

    const getPostId = (idString: string) => idString.split('/').pop() || "";

    return (
        <div className="min-h-screen bg-[#050506] text-white overflow-hidden flex flex-col font-sans">
            {/* HEADER BAR */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0c]/80 backdrop-blur-3xl z-50">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-primary hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                            <span className="absolute w-3 h-3 bg-red-500/30 rounded-full animate-ping"></span>
                            <span className="relative block w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                        </div>
                        <h1 className="text-sm font-black uppercase tracking-[0.4em]">Signal Monitor System <span className="text-white/20 font-light ml-2">V2.0</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-8 font-mono text-[10px] text-white/30 tracking-[0.2em] uppercase">
                    <div className="flex items-center gap-2">
                        <span className="text-primary/40">Status:</span>
                        <span className="text-green-500/60 animate-pulse">Deep-Net Active</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <div>Signals Processed: {signals.length}</div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: INTERACTIVE MAP */}
                <div className="flex-1 relative bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,transparent_70%)] monitor-grid overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center p-20 pointer-events-none">
                        <svg className="w-full h-full opacity-40 select-none" viewBox="0 0 1000 800">
                            {/* IRAQ BORDER (Simplified Path) */}
                            <path
                                d="M480,120 L580,180 L700,200 L850,280 L920,350 L950,550 L880,720 L650,780 L450,750 L320,780 L200,720 L150,550 L120,350 L200,180 L350,140 Z"
                                fill="none"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="2"
                            />
                        </svg>
                    </div>

                    {/* CITY MARKERS */}
                    {IRAQ_CITIES.map(city => {
                        const { x, y } = getXY(city.lat, city.lng);
                        const activeSignals = signalsWithLocations.filter(s => s.location?.name === city.name).slice(0, 3);
                        const hasActivity = activeSignals.length > 0;

                        return (
                            <div
                                key={city.name}
                                style={{ left: `${x / 10}%`, top: `${y / 8}%` }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                            >
                                <div className="relative group cursor-crosshair">
                                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${hasActivity ? 'bg-primary shadow-[0_0_15px_rgba(56,189,248,0.8)]' : 'bg-white/10'}`}></div>
                                    {hasActivity && (
                                        <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping scale-75"></div>
                                    )}

                                    {/* Tooltip Content */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
                                        <div className="bg-[#0f1115]/95 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl">
                                            <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-2 flex items-center justify-between gap-4">
                                                <span>{city.name}</span>
                                                <span className="font-mono text-primary/60">{activeSignals.length} Active</span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {activeSignals.map(s => (
                                                    <div key={s.id} className="text-[11px] font-bold text-white/80 max-w-[200px] truncate leading-tight">
                                                        {deduplicateTitle(s.aiTitle || "")}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT: DETAILED FEED */}
                <div className="w-[450px] border-l border-white/5 bg-[#0a0a0c]/60 backdrop-blur-2xl flex flex-col relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="p-8 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/80">Active Intel Feed</h2>
                            <span className="text-[9px] font-mono text-white/20">REAL-TIME SYNC</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-md text-[9px] font-bold text-primary tracking-wider uppercase">ALL SIGNALS</div>
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold text-white/30 tracking-wider uppercase">HIGH PRIORITY</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-none p-6 flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                            {signalsWithLocations.map((post, idx) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group"
                                >
                                    <Link href={`/news/${getPostId(post.id)}`} className="block">
                                        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 relative overflow-hidden">
                                            {/* Location Badge */}
                                            {post.location && (
                                                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded border border-primary/10">
                                                    <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_rgba(56,189,248,0.5)]"></div>
                                                    <span className="text-[8px] font-black text-primary/70 uppercase tracking-wider">{post.location.name}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-[10px] font-mono text-primary font-bold tracking-widest uppercase opacity-60">
                                                    {new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[8px] font-mono text-white/10 tracking-[0.2em]">INTEL-ID: {getPostId(post.id).slice(-6).toUpperCase()}</span>
                                            </div>

                                            <h3 className={`text-[13px] font-bold text-white/90 leading-relaxed group-hover:text-primary transition-colors ${isAr ? 'text-right' : ''}`}>
                                                {deduplicateTitle(post.aiTitle || "")}
                                            </h3>

                                            {(post.aiSummary || post.plainText) && (
                                                <div className={`mt-3 pt-3 border-t border-white/[0.02] ${isAr ? 'text-right' : ''}`}>
                                                    <p className="text-[10px] text-white/40 leading-relaxed line-clamp-3 italic font-light">
                                                        {post.aiSummary || post.plainText}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/20 border border-green-500/40"></span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/5 border border-white/10"></span>
                                                </div>
                                                <div className="text-[9px] font-black text-white/10 tracking-widest uppercase group-hover:text-primary/30 transition-colors">DEEP ANALYZE →</div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* SCANNING OVERLAY EFFECT */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
                <div className="h-[2px] w-full bg-primary absolute top-0 animate-scan"></div>
            </div>

            <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
