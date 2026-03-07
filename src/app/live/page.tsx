"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
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

export default function InteractiveMonitorPage() {
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [lang, setLang] = useState("en");
    const [zoom, setZoom] = useState(1);
    const mapX = useMotionValue(0);
    const mapY = useMotionValue(0);

    // Smooth spring physics for auto-navigation
    const sprX = useSpring(mapX, { stiffness: 100, damping: 20 });
    const sprY = useSpring(mapY, { stiffness: 100, damping: 20 });
    const sprZoom = useSpring(zoom, { stiffness: 100, damping: 20 });

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

    const focusCity = (cityName: string) => {
        const city = IRAQ_CITIES.find(c => c.name === cityName);
        if (city) {
            const { x, y } = getXY(city.lat, city.lng);
            // Center on the city (viewbox is 1000x800, so we want city at 500x400)
            // This logic depends on the zoom and container size
            setZoom(3);
            mapX.set(500 - x);
            mapY.set(400 - y);
        }
    };

    const getPostId = (idString: string) => idString.split('/').pop() || "";

    return (
        <div className="fixed inset-0 bg-[#050506] text-white overflow-hidden flex font-sans">

            {/* LEFT: INTERACTIVE SATELLITE MAP */}
            <main className="flex-1 relative overflow-hidden bg-black cursor-grab active:cursor-grabbing">

                {/* TOP OVERLAY UI */}
                <div className="absolute top-8 left-8 z-50 pointer-events-none">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-xl hover:border-primary/50 hover:bg-primary/5 transition-all pointer-events-auto">
                            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xs font-black uppercase tracking-[0.4em] text-white/90">Signal Monitor <span className="text-primary/70">Tactical</span></h1>
                            <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase">Live Geo-Sector Intelligence</span>
                        </div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-2 pointer-events-auto">
                    <button onClick={() => setZoom(prev => Math.min(prev + 0.5, 6))} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-primary hover:bg-white/5 transition-all">+</button>
                    <button onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-primary hover:bg-white/5 transition-all">-</button>
                    <button onClick={() => { setZoom(1); mapX.set(0); mapY.set(0); }} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/5 transition-all">⟲</button>
                </div>

                {/* THE MAP CANVAS */}
                <motion.div
                    drag
                    dragMomentum={false}
                    style={{ x: sprX, y: sprY, scale: sprZoom }}
                    className="absolute inset-0 flex items-center justify-center origin-center"
                >
                    <div className="relative w-[1000px] h-[800px]">
                        {/* GOOGLE SATELLITE BASE MAP */}
                        <div
                            className="absolute inset-0 rounded-[4rem] border-2 border-primary/20 bg-[#0a0a0b] overflow-hidden shadow-[0_0_100px_rgba(56,189,248,0.1)]"
                            style={{
                                backgroundImage: `url('https://mt1.google.com/vt/lyrs=s&x=631&y=421&z=10'), url('https://mt1.google.com/vt/lyrs=s&x=630&y=421&z=10'), url('https://mt1.google.com/vt/lyrs=s&x=631&y=420&z=10'), url('https://mt1.google.com/vt/lyrs=s&x=630&y=420&z=10')`,
                                backgroundSize: '50% 50%',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: '0% 0%, 100% 0%, 0% 100%, 100% 100%',
                                filter: 'brightness(0.6) contrast(1.2) saturate(0.8)',
                            }}
                        >
                            {/* Tactical Borders / Scan Grid */}
                            <div className="absolute inset-0 opacity-[0.1] monitor-grid"></div>
                        </div>

                        {/* SVG OVERLAY (Borders & Markers) */}
                        <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none" viewBox="0 0 1000 800">
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* IRAQ BORDER - Precise Tactical Path */}
                            <path
                                d="M130,300 L200,180 L350,140 L480,120 L580,180 L700,200 L850,280 L920,350 L950,550 L880,720 L650,780 L450,750 L320,780 L200,720 L150,550 Z"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                fill="rgba(56,189,248,0.05)"
                                strokeDasharray="10,5"
                                className="animate-pulse"
                                filter="url(#glow)"
                            />

                            {/* City Pulsing Indicators */}
                            {IRAQ_CITIES.map(city => {
                                const { x, y } = getXY(city.lat, city.lng);
                                const packets = signalsWithLocations.filter(s => s.location?.name === city.name);
                                const hasActivity = packets.length > 0;

                                return (
                                    <g key={city.name} className="pointer-events-auto cursor-help group/city">
                                        {hasActivity && (
                                            <circle cx={x} cy={y} r={12} fill="none" stroke="#38bdf8" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px` }} />
                                        )}
                                        <circle cx={x} cy={y} r={4} fill={hasActivity ? "#38bdf8" : "rgba(255,255,255,0.4)"} className="transition-all duration-300 group-hover/city:r-6 shadow-2xl" />

                                        <g className="opacity-0 group-hover/city:opacity-100 transition-opacity duration-300">
                                            <rect x={x + 12} y={y - 20} width="120" height="40" rx="4" fill="rgba(0,0,0,0.8)" stroke="#38bdf8" strokeWidth="0.5" />
                                            <text x={x + 20} y={y} fill="white" fontSize="10" fontWeight="bold" className="uppercase tracking-widest">{city.name}</text>
                                            {hasActivity && <text x={x + 20} y={y + 10} fill="#38bdf8" fontSize="7" className="font-mono">SIG: {packets.length} ACTIVE</text>}
                                        </g>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </motion.div>

                {/* CRT Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
            </main>

            {/* RIGHT: INDEPENDENTLY SCROLLABLE INTEL FEED */}
            <aside className="w-[420px] bg-[#0a0a0c]/90 backdrop-blur-3xl border-l border-white/[0.04] flex flex-col z-[200] shadow-[-20px_0_50px_rgba(0,0,0,0.7)]">
                <div className="p-8 pb-6 border-b border-white/[0.03]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                            <h2 className="text-[11px] font-black text-white/90 uppercase tracking-widest">Active Intelligence</h2>
                            <span className="text-[8px] font-mono text-primary animate-pulse uppercase mt-1">Status: Deep-Sync Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none p-6 flex flex-col gap-4">
                    {signalsWithLocations.map((post, idx) => (
                        <motion.div key={post.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                            <button
                                onClick={() => post.location && focusCity(post.location.name)}
                                className="w-full text-left group"
                            >
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300 relative">
                                    {post.location && (
                                        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">
                                            <div className="w-1 h-1 bg-primary rounded-full"></div>
                                            <span className="text-[8px] font-black text-primary uppercase">{post.location.name}</span>
                                        </div>
                                    )}
                                    <div className="text-[9px] font-mono text-white/30 mb-2">{new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <h3 className={`text-[13px] font-bold text-white/80 leading-relaxed group-hover:text-white transition-colors ${isAr ? 'text-right' : ''}`}>
                                        {deduplicateTitle(post.aiTitle || "")}
                                    </h3>
                                    <div className="mt-4 text-[8px] font-black text-white/10 tracking-[0.3em] uppercase group-hover:text-primary transition-colors flex items-center gap-2">
                                        {post.location ? '⌖ CENTERING VECTOR' : 'VIEW SIG DATA →'}
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </aside>

            <style jsx>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .monitor-grid {
          background-image: linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
        </div>
    );
}
