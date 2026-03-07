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
    { name: "Baghdad", ar: "بغداد", lat: 33.3152, lng: 44.3661 },
    { name: "Mosul", ar: "الموصل", lat: 36.3489, lng: 43.1577 },
    { name: "Basra", ar: "البصرة", lat: 30.5081, lng: 47.7833 },
    { name: "Erbil", ar: "أربيل", lat: 36.1901, lng: 44.0094 },
    { name: "Sulaymaniyah", ar: "السليمانية", lat: 35.5681, lng: 45.4214 },
    { name: "Kirkuk", ar: "كركوك", lat: 35.4687, lng: 44.3921 },
    { name: "Najaf", ar: "النجف", lat: 32.0259, lng: 44.3462 },
    { name: "Karbala", ar: "كربلاء", lat: 32.6160, lng: 44.0248 },
    { name: "Nasiriyah", ar: "الناصرية", lat: 31.0581, lng: 46.2573 },
    { name: "Amara", ar: "العمارة", lat: 31.8415, lng: 47.1453 },
    { name: "Samawah", ar: "السماوة", lat: 31.3283, lng: 45.2818 },
    { name: "Kut", ar: "الكوت", lat: 32.5132, lng: 45.8153 },
    { name: "Hillah", ar: "الحلة", lat: 32.4846, lng: 44.4209 },
    { name: "Baqubah", ar: "بعقوبة", lat: 33.7471, lng: 44.6469 },
    { name: "Ramadi", ar: "الرمادي", lat: 33.4314, lng: 43.3021 },
    { name: "Fallujah", ar: "الفلوجة", lat: 33.3499, lng: 43.7844 },
    { name: "Duhok", ar: "دهوك", lat: 36.8679, lng: 42.9436 },
    { name: "Tikrit", ar: "تكريت", lat: 34.6074, lng: 43.6782 },
];

// Precise Geographical Transformation for Iraq
const BOUNDS = {
    minLng: 38.0,
    maxLng: 49.5,
    minLat: 28.5,
    maxLat: 38.5
};

export default function AdvancedTacticalMonitor() {
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [lang, setLang] = useState("en");
    const [activeCity, setActiveCity] = useState<string | null>(null);

    // DRAG & ZOOM STATE
    const [zoom, setZoom] = useState(1);
    const mapX = useMotionValue(0);
    const mapY = useMotionValue(0);

    // Smooth animations for centering
    const sprX = useSpring(mapX, { stiffness: 80, damping: 20 });
    const sprY = useSpring(mapY, { stiffness: 80, damping: 20 });
    const sprScale = useSpring(zoom, { stiffness: 80, damping: 20 });

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem("newsLang") || "en";
        setLang(stored);

        const fetchSignals = async () => {
            try {
                const res = await fetch(`/api/news?lang=${stored}&limit=60&type=signal&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setSignals(data.posts || []);
                }
            } catch (e) { console.error(e); }
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 15000);
        return () => clearInterval(interval);
    }, []);

    const isAr = lang === "ar";

    const getXY = (lat: number, lng: number) => {
        // Map Lng (38 to 49.5) to X (0 to 1000)
        const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 1000;
        // Map Lat (28.5 to 38.5) to Y (800 to 0) - SVG Y grows downwards
        const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 800;
        return { x, y };
    };

    const signalsWithLocations = useMemo(() => {
        return signals.map(s => {
            const text = ((s.aiTitle || "") + " " + (s.aiSummary || "") + " " + s.plainText).toLowerCase();
            const location = IRAQ_CITIES.find(city =>
                text.includes(city.name.toLowerCase()) || text.includes(city.ar)
            );
            return { ...s, location };
        });
    }, [signals]);

    const handleCityClick = (cityName: string) => {
        const city = IRAQ_CITIES.find(c => c.name === cityName);
        if (!city) return;

        const { x, y } = getXY(city.lat, city.lng);

        // Zoom in and center
        // The map is 1000x800. We want the point (x,y) to be at the center of the viewport (500x400)
        // Formula: TargetOffset = Center - (TargetInMap * Zoom)
        // But since we use 'scale' on the motion.div, we actually move the (0,0) point such that x,y is centered.
        setZoom(2.5);
        mapX.set((500 - x) * 2.5);
        mapY.set((400 - y) * 2.5);
        setActiveCity(cityName);
    };

    const getPostId = (idString: string) => idString.split('/').pop() || "";

    return (
        <div className="fixed inset-0 bg-[#020203] text-white overflow-hidden flex font-sans">

            {/* 1. INTERACTIVE MAP SECTION */}
            <main className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0%,transparent_70%)]">

                {/* TOP UI: RETURN & TITLE */}
                <div className="absolute top-8 left-8 z-50 pointer-events-none">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-2xl hover:border-primary/50 hover:bg-primary/5 transition-all pointer-events-auto shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-black uppercase tracking-[0.4em] text-white/90">Iraq Sector <span className="text-primary/70">Intelligence</span></h1>
                            <span className="text-[8px] font-mono text-white/20 tracking-[0.3em] uppercase mt-1 flex items-center gap-2">
                                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                                Satellite-Link: Active - Channel 5.42
                            </span>
                        </div>
                    </div>
                </div>

                {/* STATS OVERLAY */}
                <div className="absolute top-8 right-8 z-50 flex flex-col items-end gap-2 text-[9px] font-mono pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 border border-white/5 rounded-lg text-white/40 tracking-widest flex items-center gap-3">
                        <span className="text-primary/60">ACTIVE SIGNALS:</span>
                        <span className="text-white font-black">{signals.length} UNIT(S)</span>
                    </div>
                </div>

                {/* MAP NAVIGATION CONTROLS */}
                <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-3 pointer-events-auto">
                    <button onClick={() => setZoom(z => Math.min(z + 0.5, 6))} className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-primary text-xl font-bold hover:bg-primary/10 transition-all">+</button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-primary text-xl font-bold hover:bg-primary/10 transition-all">-</button>
                    <button onClick={() => { setZoom(1); mapX.set(0); mapY.set(0); setActiveCity(null); }} className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-all">⟲</button>
                </div>

                {/* THE MAP CANVAS - DRAGGABLE & ZOOMABLE */}
                <motion.div
                    drag
                    dragMomentum={false}
                    style={{ x: sprX, y: sprY, scale: sprScale }}
                    className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                >
                    <div className="relative w-[1000px] h-[800px] select-none">

                        {/* REAL SATELLITE IMAGE LAYERS (Iraq Centered) */}
                        <div
                            className="absolute inset-0 rounded-[3rem] border border-primary/20 bg-cover bg-center overflow-hidden shadow-[0_0_100px_rgba(56,189,248,0.1)] transition-all duration-1000"
                            style={{
                                backgroundImage: `url('https://mt1.google.com/vt/lyrs=s&hl=en&x=39&y=25&z=6'), 
                                  url('https://mt1.google.com/vt/lyrs=s&hl=en&x=40&y=25&z=6'), 
                                  url('https://mt1.google.com/vt/lyrs=s&hl=en&x=39&y=26&z=6'), 
                                  url('https://mt1.google.com/vt/lyrs=s&hl=en&x=40&y=26&z=6')`,
                                backgroundSize: '100% 100%', // Approximate Iraq fitting
                                filter: 'brightness(0.6) contrast(1.1) saturate(0.8)',
                            }}
                        >
                            <div className="absolute inset-0 bg-[#0a0a0b]/30 mix-blend-multiply opacity-50"></div>
                            {/* Scanline pattern */}
                            <div className="absolute inset-0 opacity-[0.1] bg-[linear-gradient(rgba(56,189,248,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.1)_1px,transparent_1px)] bg-[length:50px_50px]"></div>
                        </div>

                        {/* SVG OVERLAY: TRUE BORDERS & MARKERS */}
                        <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none" viewBox="0 0 1000 800">
                            {/* Accurate-ish Iraq Boundary Path */}
                            <path
                                d="M480,103 L607,173 L717,194 L810,256 L912,333 L930,520 L878,693 L658,744 L440,719 L306,750 L210,683 L169,541 L140,320 L195,190 L340,140 Z"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                fill="rgba(56,189,248,0.03)"
                                className="animate-pulse"
                                strokeDasharray="10 5"
                            />

                            {/* Grid Markers */}
                            {IRAQ_CITIES.map(city => {
                                const { x, y } = getXY(city.lat, city.lng);
                                const packets = signalsWithLocations.filter(s => s.location?.name === city.name);
                                const hasActivity = packets.length > 0;
                                const isActive = activeCity === city.name;

                                return (
                                    <g key={city.name} className="pointer-events-auto cursor-pointer group/city" onClick={() => handleCityClick(city.name)}>
                                        {hasActivity && (
                                            <circle cx={x} cy={y} r={isActive ? 20 : 12} fill="none" stroke="#38bdf8" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px` }} />
                                        )}
                                        <circle cx={x} cy={y} r={isActive ? 8 : 4} fill={hasActivity ? "#38bdf8" : "rgba(255,255,255,0.2)"} className="transition-all duration-500 group-hover/city:r-10 shadow-[0_0_20px_rgba(56,189,248,0.8)]" />

                                        <g className="opacity-0 group-hover/city:opacity-100 transition-opacity duration-300">
                                            <rect x={x + 15} y={y - 25} width="160" height="50" rx="8" fill="rgba(6,10,22,0.95)" stroke="#38bdf8" strokeWidth="1" />
                                            <text x={x + 28} y={y - 2} fill="white" fontSize="11" fontWeight="900" className="uppercase tracking-widest">{city.name}</text>
                                            <text x={x + 28} y={y + 12} fill="#38bdf8" fontSize="8" className="font-mono">SIG STRENGTH: {hasActivity ? 'HIGH' : 'LOW'}</text>
                                        </g>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </motion.div>

                {/* SCANLINE CRT SCREEN LAYER */}
                <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
            </main>

            {/* 2. SCROLLABLE INTEL FEED SIDEBAR */}
            <aside className="w-[440px] bg-[#030406]/95 backdrop-blur-3xl border-l border-white/[0.04] flex flex-col z-[200] shadow-[-30px_0_60px_rgba(0,0,0,0.9)] overflow-hidden">

                {/* SIDEBAR HEADER */}
                <div className="p-10 pb-8 border-b border-white/[0.03] bg-white/[0.01]">
                    <div className="flex flex-col gap-2 mb-8">
                        <h2 className="text-[12px] font-black text-white/90 uppercase tracking-[0.4em]">Sector Analysis</h2>
                        <span className="text-[9px] font-mono text-primary/60 tracking-widest uppercase">Global Signal Intercept Active</span>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex-1 py-3 px-4 bg-primary/10 border border-primary/20 rounded-2xl text-[9px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all">ALL SIGNALS</button>
                        <button className="flex-1 py-3 px-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[9px] font-black text-white/30 uppercase tracking-widest hover:text-white/60 transition-all">HIGH PRIORITY</button>
                    </div>
                </div>

                {/* FEED CONTENT: INDEPENDENTLY SCROLLABLE */}
                <div className="flex-1 overflow-y-auto scrollbar-none p-8 flex flex-col gap-5">
                    <AnimatePresence mode="popLayout">
                        {signalsWithLocations.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <button
                                    onClick={() => post.location && handleCityClick(post.location.name)}
                                    className="w-full text-left group"
                                >
                                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-400 relative overflow-hidden">

                                        {/* Location Indicator */}
                                        {post.location && (
                                            <div className="absolute top-5 right-6 flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#38bdf8]"></span>
                                                <span className="text-[9px] font-black text-primary uppercase tracking-tighter">{post.location.name}</span>
                                            </div>
                                        )}

                                        <div className="text-[10px] font-mono text-white/20 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                            {new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                            REF-{getPostId(post.id).slice(-4).toUpperCase()}
                                        </div>

                                        <h3 className={`text-[14px] font-bold text-white/80 leading-relaxed group-hover:text-white transition-colors ${isAr ? 'text-right' : ''}`}>
                                            {deduplicateTitle(post.aiTitle || "")}
                                        </h3>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-primary/40 group-hover:text-primary transition-all uppercase tracking-widest">
                                                {post.location ? '⌖ Centering Sector' : 'Deep Analyze →'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <div className="w-4 h-1 bg-primary/20 rounded-full group-hover:bg-primary/40 transition-all"></div>
                                                <div className="w-4 h-1 bg-primary/10 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* SIDEBAR FOOTER */}
                <div className="p-6 border-t border-white/[0.03] bg-black/40 flex justify-between items-center text-[9px] font-mono text-white/20 uppercase tracking-widest">
                    <span>Systems Normal</span>
                    <span className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        Grid Sync: 100%
                    </span>
                </div>
            </aside>

            <style jsx>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}
