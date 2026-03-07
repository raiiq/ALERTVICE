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

const BOUNDS = {
    minLng: 38.0,
    maxLng: 49.5,
    minLat: 28.5,
    maxLat: 38.5
};

export default function LiveMonitorPage() {
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
        <div className="fixed inset-0 bg-[#050506] text-white overflow-hidden flex font-sans">
            {/* LEFT: SATELLITE COMMAND MAP (STATIC BACKGROUND) */}
            <main className="flex-1 relative overflow-hidden bg-black selection:bg-primary/30">

                {/* TACTICAL OVERLAY */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-8 left-8 flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-xl hover:border-primary/50 hover:bg-primary/5 transition-all pointer-events-auto shadow-2xl">
                                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </Link>
                            <div className="flex flex-col">
                                <h1 className="text-xs font-black uppercase tracking-[0.4em] text-white/90">Signal Monitor <span className="text-primary/70">V3.0</span></h1>
                                <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase mt-0.5">Tactical Command Sector - Iraq</span>
                            </div>
                        </div>
                    </div>

                    {/* Map Statistics */}
                    <div className="absolute top-8 right-8 flex flex-col items-end gap-2 font-mono text-[9px] text-white/40 tracking-widest uppercase">
                        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg border border-white/5 backdrop-blur-md">
                            <span className="text-primary animate-pulse">●</span>
                            <span>Scanning: {signals.length} Active Packets</span>
                        </div>
                    </div>

                    {/* Bottom Coordinates Strip */}
                    <div className="absolute bottom-6 left-8 flex items-center gap-8 text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">
                        <span>33.3152° N, 44.3661° E</span>
                        <span className="w-px h-3 bg-white/10"></span>
                        <span>Ref: Alertvice-Hub-2</span>
                        <span className="w-px h-3 bg-white/10"></span>
                        <span>Time: {new Date().toLocaleTimeString('en-GB')} UTC</span>
                    </div>
                </div>

                {/* MAP CONTENT - FIXED / Non-scrollable */}
                <div className="absolute inset-0 flex items-center justify-center p-12 lg:p-24">
                    <div className="relative aspect-[1000/800] w-full max-h-full">

                        {/* SATELLITE IMAGE STYLE BACKGROUND */}
                        <div
                            className="absolute inset-0 rounded-[2rem] overflow-hidden border border-white/[0.03] shadow-[0_0_100px_rgba(0,0,0,1)]"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.05) 0%, transparent 100%), url("https://www.google.com/maps/vt/pb=!1m4!1m3!1i10!2i630!3i420!2m3!1e0!2sm!3i12345678!3m8!2sen!3siq!5e1105!12m4!1e68!2m2!1sset!2ssatellite!4e0!5m1!1e4")',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'brightness(0.5) contrast(1.2) saturate(0.8) hue-rotate(-10deg)',
                            }}
                        >
                            {/* Land Grain Overlay */}
                            <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>
                            {/* Darkening Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60"></div>
                        </div>

                        {/* SVG Overlay Layers */}
                        <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none" viewBox="0 0 1000 800">
                            {/* Iraq Border Path (Tactical Line) */}
                            <path
                                d="M130,300 L200,180 L350,140 L480,120 L580,180 L700,200 L850,280 L920,350 L950,550 L880,720 L650,780 L450,750 L320,780 L200,720 L150,550 Z"
                                stroke="rgba(56,189,248,0.2)"
                                strokeWidth="2"
                                fill="none"
                                className="animate-pulse"
                            />

                            {/* Grid Dots */}
                            {[...Array(20)].map((_, i) => [...Array(16)].map((_, j) => (
                                <circle key={`dot-${i}-${j}`} cx={i * 50} cy={j * 50} r="0.5" fill="rgba(255,255,255,0.05)" />
                            )))}

                            {/* City Markers with Interactive Logic */}
                            {IRAQ_CITIES.map(city => {
                                const { x, y } = getXY(city.lat, city.lng);
                                const activeSignals = signalsWithLocations.filter(s => s.location?.name === city.name);
                                const hasActivity = activeSignals.length > 0;

                                return (
                                    <g key={city.name} className="pointer-events-auto cursor-help group/city">
                                        {/* Glow Behind */}
                                        {hasActivity && (
                                            <circle cx={x} cy={y} r={16} fill="rgba(56,189,248,0.15)" className="animate-pulse animate-duration-[2s]" />
                                        )}
                                        {/* Center Point */}
                                        <circle cx={x} cy={y} r={2.5} fill={hasActivity ? "#38bdf8" : "rgba(255,255,255,0.2)"} className="transition-all duration-300 group-hover/city:r-4 flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.8)]" />

                                        {/* Label Label */}
                                        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                            <rect x={x + 10} y={y - 25} width="140" height="50" rx="8" fill="rgba(10,13,18,0.9)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                            <text x={x + 22} y={y - 3} fill="white" fontSize="10" className="font-sans font-black tracking-widest uppercase">{city.name}</text>
                                            <text x={x + 22} y={y + 10} fill={hasActivity ? "#38bdf8" : "#999"} fontSize="8" className="font-mono">{hasActivity ? `SIG: ${activeSignals.length} CAPTURED` : "STANDBY"}</text>
                                        </g>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Scanline Effect Layer */}
                <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
            </main>

            {/* RIGHT: SCROLLABLE INTEL FEED */}
            <aside className="w-[420px] bg-[#0a0a0c]/90 backdrop-blur-3xl border-l border-white/[0.04] flex flex-col relative z-40 selection:bg-primary/20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">

                {/* Sidebar Header */}
                <div className="p-8 pb-6 border-b border-white/[0.03] bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-[10px] font-black text-white/90 uppercase tracking-[0.3em]">Sector Analysis</h2>
                            <span className="text-[8px] font-mono text-primary/60 tracking-widest uppercase">Streaming Real-Time Intel</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center animate-spin-slow">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-xl text-[9px] font-black text-primary uppercase tracking-widest transition-all">All Signal</button>
                        <button className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-[9px] font-black text-white/30 uppercase tracking-widest hover:text-white/60 hover:bg-white/[0.05] transition-all">Prioritized</button>
                    </div>
                </div>

                {/* Scrollable Feed Area */}
                <div className="flex-1 overflow-y-auto scrollbar-none p-6 pt-4 flex flex-col gap-5">
                    <AnimatePresence mode="popLayout">
                        {signalsWithLocations.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.05 }}
                            >
                                <Link href={`/news/${getPostId(post.id)}`} className="block group">
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.03] group-hover:bg-white/[0.04] group-hover:border-primary/20 transition-all duration-300 relative overflow-hidden">

                                        {/* Location Chip */}
                                        {post.location && (
                                            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 rounded border border-primary/20">
                                                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                                                <span className="text-[8px] font-black text-primary/80 uppercase tracking-wider">{post.location.name}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mb-3 text-white/30">
                                            <span className="text-[9px] font-mono font-bold tracking-widest">{new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                            <span className="text-[8px] font-mono uppercase tracking-[0.2em]">ID-{getPostId(post.id).slice(-4)}</span>
                                        </div>

                                        <h3 className={`text-[13px] font-bold text-white/80 leading-relaxed group-hover:text-white transition-colors line-clamp-2 ${isAr ? 'text-right' : ''}`}>
                                            {deduplicateTitle(post.aiTitle || "")}
                                        </h3>

                                        {(post.aiSummary || post.plainText) && (
                                            <div className={`mt-3 pt-3 border-t border-white/[0.02] ${isAr ? 'text-right' : ''}`}>
                                                <p className="text-[10px] text-white/40 leading-relaxed line-clamp-3 italic font-light group-hover:text-white/50 transition-colors">
                                                    {post.aiSummary || post.plainText}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em] group-hover:text-primary/40 transition-colors">Tactical View →</div>
                                            <div className="flex -space-x-1.5">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="w-1.5 h-1.5 rounded-full border border-black bg-white/5"></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-white/[0.03] bg-black/20">
                    <div className="flex items-center justify-between px-3 text-[8px] font-mono text-white/20 uppercase tracking-widest">
                        <span>Data Stream: Active</span>
                        <span className="animate-pulse">Live Sync</span>
                    </div>
                </div>
            </aside>

            <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .animate-duration-[2s] {
          animation-duration: 2s;
        }
      `}</style>
        </div>
    );
}
