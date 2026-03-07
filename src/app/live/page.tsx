"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { deduplicateTitle } from "../components/MediaDisplay";

interface NewsPost {
    id: string;
    plainText: string;
    date: string;
    aiTitle: string | null;
    aiSummary?: string | null;
    aiTag?: string | null;
    location?: { name: string; lat: number; lng: number } | null;
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

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    Conflict: { bg: "#7f1d1d", text: "#fca5a5" },
    Political: { bg: "#3b0764", text: "#c4b5fd" },
    Military: { bg: "#1e3a5f", text: "#7dd3fc" },
    Security: { bg: "#1a2e1a", text: "#86efac" },
    default: { bg: "#1c1c22", text: "#9ca3af" },
};

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minutes ago`;
    return `${Math.floor(mins / 60)} hours ago`;
}

// Globe component — uses globe.gl loaded client-side
function GlobeMap({
    signals,
    onFlyTo,
    targetLat,
    targetLng,
}: {
    signals: NewsPost[];
    onFlyTo: (lat: number, lng: number) => void;
    targetLat: number | null;
    targetLng: number | null;
}) {
    const globeRef = useRef<HTMLDivElement>(null);
    const globeInstance = useRef<any>(null);

    const points = useMemo(() => {
        return IRAQ_CITIES.map(city => {
            const events = signals.filter(s => s.location?.name === city.name);
            return {
                lat: city.lat,
                lng: city.lng,
                city: city.name,
                count: events.length,
                color: events.length > 0 ? "#f97316" : "rgba(255,255,255,0.2)",
                radius: events.length > 0 ? 0.5 + events.length * 0.1 : 0.2,
            };
        });
    }, [signals]);

    useEffect(() => {
        if (!globeRef.current) return;

        let globe: any = null;

        import("globe.gl").then((mod) => {
            const Globe = (mod.default || mod) as any;
            globe = Globe({ rendererConfig: { antialias: true, alpha: true } })(globeRef.current!);

            // Satellite imagery layer + night lights blend
            globe
                .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
                .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
                .showAtmosphere(true)
                .atmosphereColor("rgba(56,189,248,0.12)")
                .atmosphereAltitude(0.08)
                // Points
                .pointsData(points)
                .pointLat("lat")
                .pointLng("lng")
                .pointColor("color")
                .pointAltitude(0.01)
                .pointRadius("radius")
                .pointLabel((d: any) => `
          <div style="background:rgba(10,10,14,0.95);border:1px solid rgba(56,189,248,0.4);padding:8px 12px;border-radius:8px;color:white;font-size:11px;font-weight:bold;letter-spacing:0.05em;">
            ${d.city}<br/><span style="color:#38bdf8;font-size:9px">${d.count} signals</span>
          </div>
        `)
                .onPointClick((d: any) => { onFlyTo(d.lat, d.lng); });

            // Start view centered on Iraq
            globe.pointOfView({ lat: 33.3, lng: 44.4, altitude: 1.5 }, 0);

            globeInstance.current = globe;

            // Auto-rotate slowly
            globe.controls().autoRotate = true;
            globe.controls().autoRotateSpeed = 0.3;
            globe.controls().enableZoom = true;
        });

        return () => {
            if (globeRef.current) globeRef.current.innerHTML = "";
        };
    }, []);

    // Update points when signals change
    useEffect(() => {
        if (!globeInstance.current) return;
        globeInstance.current.pointsData(points);
    }, [points]);

    // Fly to city on event click
    useEffect(() => {
        if (!globeInstance.current || targetLat == null || targetLng == null) return;
        globeInstance.current.pointOfView({ lat: targetLat, lng: targetLng, altitude: 0.5 }, 1500);
        // Stop auto-rotate when user selects an event
        globeInstance.current.controls().autoRotate = false;
    }, [targetLat, targetLng]);

    return <div ref={globeRef} className="w-full h-full" />;
}

// ─────────────────────────────────────────
export default function MonitorPage() {
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [activeTab, setActiveTab] = useState<"FEED" | "LIVE" | "REPORTS">("FEED");
    const [targetLat, setTargetLat] = useState<number | null>(null);
    const [targetLng, setTargetLng] = useState<number | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const stored = typeof window !== "undefined" ? localStorage.getItem("newsLang") || "en" : "en";
        const fetchSignals = async () => {
            try {
                const res = await fetch(`/api/news?lang=${stored}&limit=100&type=signal&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    const posts = (data.posts || []) as any[];
                    // Attach location
                    const enriched = posts.map((p: any) => {
                        const text = ((p.aiTitle || "") + " " + (p.plainText || "")).toLowerCase();
                        const location = IRAQ_CITIES.find(c =>
                            text.includes(c.name.toLowerCase()) || text.includes(c.ar)
                        );
                        return { ...p, location: location || null };
                    });
                    setSignals(enriched);
                }
            } catch (e) { console.error(e); }
        };
        fetchSignals();
        const t = setInterval(fetchSignals, 30000);
        return () => clearInterval(t);
    }, []);

    const handleFlyTo = useCallback((lat: number, lng: number) => {
        setTargetLat(lat);
        setTargetLng(lng);
    }, []);

    const getPostId = (id: string) => id.split("/").pop() || "";

    return (
        <div
            className="fixed inset-0 text-white flex flex-col overflow-hidden"
            style={{ background: "#0d0d10", fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* ── TOP HEADER ── */}
            <header className="h-11 border-b border-white/[0.06] bg-[#111115] flex items-center gap-4 px-4 shrink-0 z-[900]">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity shrink-0">
                    <div className="w-5 h-5 rounded-sm bg-white flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-[#0d0d10] rounded-full" />
                    </div>
                    <span className="font-bold text-[13px] tracking-tight whitespace-nowrap text-white/90">Monitor the Situation</span>
                </Link>

                {/* Search */}
                <div className="relative">
                    <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search..." className="bg-[#1c1c24] text-white/60 placeholder:text-white/20 text-[11px] py-1.5 pl-8 pr-3 rounded w-40 outline-none border border-white/5 focus:border-primary/30" />
                </div>

                {/* Ticker */}
                <div className="flex-1 overflow-hidden h-full flex items-center mx-4">
                    <div className="whitespace-nowrap overflow-hidden h-full flex items-center">
                        <div className="inline-flex gap-8 items-center animate-marquee text-[10px] font-semibold text-white/30 tracking-wider">
                            {[...signals, ...signals].slice(0, 20).map((s, i) => (
                                <span key={i} className="flex items-center gap-2 shrink-0">
                                    <span className="text-orange-500/60">■</span>
                                    {deduplicateTitle(s.aiTitle)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-0.5 bg-[#1c1c24] rounded p-0.5 border border-white/5">
                        <button className="px-2.5 py-0.5 text-[10px] font-bold text-white/30 hover:text-white transition-colors">6H</button>
                        <button className="px-2.5 py-0.5 text-[10px] font-bold bg-[#2d2d3e] rounded text-white">24H</button>
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded px-3 py-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">8,689 Monitors</span>
                    </div>
                </div>
            </header>

            {/* ── MAIN BODY ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── LEFT FEED PANEL ── */}
                <aside className="w-[300px] bg-[#111115] border-r border-white/[0.05] flex flex-col shrink-0 z-50">
                    {/* Tabs */}
                    <div className="px-4 pt-3 pb-0 border-b border-white/[0.04]">
                        <div className="flex items-center gap-5 mb-3">
                            {(["FEED", "LIVE", "REPORTS"] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-[10px] font-black tracking-[0.15em] uppercase pb-2 border-b-2 transition-all ${activeTab === tab
                                        ? "text-white border-primary"
                                        : "text-white/25 border-transparent hover:text-white/50"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                            <span className="ml-auto text-[9px] font-mono text-white/20">{signals.length} events</span>
                        </div>
                    </div>

                    {/* Scrollable Event List */}
                    <div
                        className="flex-1 overflow-y-auto"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}
                    >
                        {signals.map((post, idx) => {
                            const tagStyle = TAG_COLORS[post.aiTag ?? "default"] ?? TAG_COLORS.default;
                            const title = deduplicateTitle(post.aiTitle) || post.plainText?.slice(0, 120);
                            return (
                                <button
                                    key={post.id + idx}
                                    onClick={() => post.location && handleFlyTo(post.location.lat, post.location.lng)}
                                    className="w-full text-left px-4 py-3 border-b border-white/[0.03] border-l-2 border-l-transparent hover:border-l-orange-500 hover:bg-white/[0.025] transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded"
                                                style={{ background: tagStyle.bg, color: tagStyle.text }}
                                            >
                                                {post.aiTag || "Event"}
                                            </span>
                                            <span className="text-[9px] font-mono text-white/15 font-bold">S{Math.min(idx + 1, 9)}</span>
                                        </div>
                                        <span className="text-[9px] text-white/20 font-mono">{getTimeAgo(post.date)}</span>
                                    </div>

                                    <p className="text-[12px] font-semibold text-white/75 group-hover:text-white leading-snug line-clamp-2 transition-colors">
                                        {title}
                                    </p>

                                    {post.location && (
                                        <div className="flex items-center gap-1 mt-1.5">
                                            <svg className="w-2.5 h-2.5 text-orange-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-[10px] font-bold text-orange-500/60 uppercase tracking-wider">{post.location.name}</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* ── GLOBE / MAP ── */}
                <main className="flex-1 relative overflow-hidden bg-[#07070c]">
                    {isClient && (
                        <GlobeMap
                            signals={signals}
                            onFlyTo={handleFlyTo}
                            targetLat={targetLat}
                            targetLng={targetLng}
                        />
                    )}

                    {/* Vignette Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(7,7,12,0.6)_100%)]" />

                    {/* Top-Right Status Badge */}
                    <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 items-end pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-xl rounded border border-white/5 px-3 py-2 text-[9px] font-mono tracking-widest text-white/30 uppercase">
                            <span className="text-green-400 animate-pulse mr-2">●</span>LIVE GLOBAL FEED
                        </div>
                        <div className="bg-black/60 backdrop-blur-xl rounded border border-white/5 px-3 py-2 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                            Iraq Sector · {signals.length} Signals
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
        </div>
    );
}
