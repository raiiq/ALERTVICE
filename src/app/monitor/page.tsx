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

// Refined Iraq Bounds
const BOUNDS = {
    minLng: 38.0,
    maxLng: 49.5,
    minLat: 29.0,
    maxLat: 38.0
};

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

    const getXY = (lat: number, lng: number) => {
        const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 1000;
        const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 800;
        return { x, y };
    };

    const getPostId = (idString: string) => idString.split('/').pop() || "";

    return (
        <div className="min-h-screen bg-[#050506] text-white overflow-hidden flex flex-col font-sans">
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
                {/* MAP CONTAINER */}
                <div className="flex-1 relative bg-[#050506] monitor-grid overflow-hidden">
                    {/* SVG Map Section */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-12">
                        <div className="relative aspect-[1000/800] w-full max-h-full">
                            <svg className="w-full h-full" viewBox="0 0 1000 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Visual Grid */}
                                <defs>
                                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(56,189,248,0.05)" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />

                                {/* IRAQ BORDER - Highly accurate coordinates mapping for SVG space */}
                                <path
                                    d="M130,300 L200,180 L350,140 L480,120 L580,180 L700,200 L850,280 L920,350 L950,550 L880,720 L650,780 L450,750 L320,780 L200,720 L150,550 Z"
                                    stroke="rgba(56,189,248,0.2)"
                                    strokeWidth="2"
                                    fill="rgba(56,189,248,0.02)"
                                />

                                {/* Markers inside SVG to guarantee alignment */}
                                {IRAQ_CITIES.map(city => {
                                    const { x, y } = getXY(city.lat, city.lng);
                                    const activeSignals = signalsWithLocations.filter(s => s.location?.name === city.name);
                                    const hasActivity = activeSignals.length > 0;

                                    return (
                                        <g key={city.name} className="pointer-events-auto cursor-help group">
                                            <circle cx={x} cy={y} r={hasActivity ? 6 : 4} fill={hasActivity ? "#38bdf8" : "rgba(255,255,255,0.15)"} />
                                            {hasActivity && (
                                                <circle cx={x} cy={y} r={12} fill="none" stroke="#38bdf8" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px` }} />
                                            )}

                                            {/* Hover Label */}
                                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                                <rect x={x + 10} y={y - 20} width="120" height="40" rx="4" fill="rgba(15,17,21,0.95)" stroke="rgba(255,255,255,0.1)" />
                                                <text x={x + 20} y={y + 5} fill="white" fontSize="12" fontWeight="900" className="uppercase font-sans tracking-widest">{city.name}</text>
                                                {hasActivity && (
                                                    <text x={x + 20} y={y + 16} fill="#38bdf8" fontSize="8" fontWeight="bold">{activeSignals.length} INTEL PACKETS</text>
                                                )}
                                            </g>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                </div>

                {/* FEED SECTION */}
                <div className="w-[450px] border-l border-white/5 bg-[#0a0a0c]/60 backdrop-blur-2xl flex flex-col relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
                    <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/80 mb-4">Tactical Intelligence Feed</h2>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-md text-[9px] font-bold text-primary uppercase">SIGNAL LIVE</div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-none p-6 flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                            {signalsWithLocations.map((post, idx) => (
                                <motion.div key={post.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                                    <Link href={`/news/${getPostId(post.id)}`} className="block group">
                                        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] group-hover:bg-white/[0.03] transition-all relative overflow-hidden">
                                            {post.location && (
                                                <div className="absolute top-4 right-4 text-[8px] font-black text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded uppercase tracking-widest">
                                                    LOCATION: {post.location.name}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-[10px] font-mono text-primary font-bold">{new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <h3 className={`text-[13px] font-bold text-white leading-relaxed group-hover:text-primary transition-colors ${isAr ? 'text-right' : ''}`}>
                                                {deduplicateTitle(post.aiTitle || "")}
                                            </h3>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* SCANLINE EFFECT */}
            <div className="fixed inset-0 pointer-events-none z-[100] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-[0.03]"></div>
            <div className="fixed inset-0 pointer-events-none z-[101] bg-gradient-to-t from-[#050506] via-transparent to-[#050506] opacity-40"></div>
        </div>
    );
}
