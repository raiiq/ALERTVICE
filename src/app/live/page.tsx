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

// EXPANDED REGIONAL CITIES
const REGIONAL_CITIES = [
    // Iraq
    { name: "Baghdad", ar: "بغداد", country: "Iraq", lat: 33.3152, lng: 44.3661 },
    { name: "Mosul", ar: "الموصل", country: "Iraq", lat: 36.3489, lng: 43.1577 },
    { name: "Basra", ar: "البصرة", country: "Iraq", lat: 30.5081, lng: 47.7833 },
    { name: "Erbil", ar: "أربيل", country: "Iraq", lat: 36.1901, lng: 44.0094 },
    // Iran
    { name: "Tehran", ar: "طهران", country: "Iran", lat: 35.6892, lng: 51.3890 },
    { name: "Mashhad", ar: "مشهد", country: "Iran", lat: 36.2972, lng: 59.6067 },
    { name: "Isfahan", ar: "أصفهان", country: "Iran", lat: 32.6546, lng: 51.6680 },
    { name: "Tabriz", ar: "تبريز", country: "Iran", lat: 38.0962, lng: 46.2738 },
    { name: "Shiraz", ar: "شيراز", country: "Iran", lat: 29.5918, lng: 52.5837 },
    { name: "Ahvaz", ar: "الأهواز", country: "Iran", lat: 31.3273, lng: 48.6706 },
    // Israel & Levant
    { name: "Jerusalem", ar: "القدس", country: "Israel", lat: 31.7683, lng: 35.2137 },
    { name: "Tel Aviv", ar: "تل أبيب", country: "Israel", lat: 32.0853, lng: 34.7818 },
    { name: "Haifa", ar: "حيفا", country: "Israel", lat: 32.7940, lng: 34.9896 },
    { name: "Gaza", ar: "غزة", country: "Palestine", lat: 31.5, lng: 34.4667 },
    // Gulf Countries
    { name: "Dubai", ar: "دبي", country: "UAE", lat: 25.2048, lng: 55.2708 },
    { name: "Abu Dhabi", ar: "أبو ظبي", country: "UAE", lat: 24.4539, lng: 54.3773 },
    { name: "Riyadh", ar: "الرياض", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
    { name: "Jeddah", ar: "جدة", country: "Saudi Arabia", lat: 21.4858, lng: 39.1925 },
    { name: "Kuwait City", ar: "مدينة الكويت", country: "Kuwait", lat: 29.3759, lng: 47.9774 },
    { name: "Doha", ar: "الدوحة", country: "Qatar", lat: 25.2854, lng: 51.5310 },
    { name: "Manama", ar: "المنامة", country: "Bahrain", lat: 26.2285, lng: 50.5860 },
    { name: "Muscat", ar: "مسقط", country: "Oman", lat: 23.5859, lng: 58.4059 },
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
    const [countries, setCountries] = useState<any[]>([]);

    useEffect(() => {
        // Fetch country borders GeoJSON
        fetch('//unpkg.com/world-atlas/countries-110m.json')
            .then(res => res.json())
            .then(worldData => {
                // For globe.gl it's easier to use specific country GeoJSONs or a standard set
                // We'll use this known high-quality source
                fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
                    .then(res => res.json())
                    .then(data => setCountries(data.features));
            });
    }, []);

    const ringData = useMemo(() => {
        return REGIONAL_CITIES.map(city => {
            const events = signals.filter(s => {
                const text = ((s.aiTitle || "") + " " + (s.plainText || "")).toLowerCase();
                return text.includes(city.name.toLowerCase()) || text.includes(city.ar);
            });
            return {
                ...city,
                count: events.length,
                color: events.length > 0 ? "#f97316" : "rgba(255,255,255,0.05)",
                size: events.length > 0 ? 1.0 : 0.15
            };
        });
    }, [signals]);

    useEffect(() => {
        if (!globeRef.current) return;

        let globe: any = null;

        import("globe.gl").then((mod) => {
            const Globe = (mod.default || mod) as any;
            globe = Globe({ rendererConfig: { antialias: true, alpha: true } })(globeRef.current!);

            // TACTICAL VECTOR STYLE (Not Satellite)
            globe
                .globeImageUrl(null) // Solid background
                .backgroundColor("#07070c")
                .showAtmosphere(true)
                .atmosphereColor("#38bdf8")
                .atmosphereAltitude(0.15)
                // Country Polygons
                .polygonsData(countries)
                .polygonSideColor(() => 'rgba(56,189,248,0.02)')
                .polygonStrokeColor(() => '#1e293b')
                .polygonCapColor(() => 'rgba(15,23,42,0.7)')
                // Labels for regional context
                .labelsData(ringData)
                .labelLat("lat")
                .labelLng("lng")
                .labelText((d: any) => d.name)
                .labelSize(0.6)
                .labelDotRadius(0.2)
                .labelColor((d: any) => d.count > 0 ? "#f97316" : "rgba(255,255,255,0.4)")
                .labelResolution(3)
                // Rings for pulsing tactical effect
                .ringsData(ringData.filter(d => d.count > 0))
                .ringColor((d: any) => d.color)
                .ringMaxRadius((d: any) => d.size)
                .ringPropagationSpeed(2.5)
                .ringRepeatPeriod(1800)
                // Highlights for active countries
                .polygonAltitude((d: any) => {
                    const countryName = d.properties.NAME;
                    const activeCities = ringData.filter(city => city.country === countryName && city.count > 0);
                    return activeCities.length > 0 ? 0.01 : 0.001;
                })
                .polygonCapColor((d: any) => {
                    const countryName = d.properties.NAME;
                    const activeCities = ringData.filter(city => city.country === countryName && city.count > 0);
                    return activeCities.length > 0 ? 'rgba(249,115,22,0.06)' : 'rgba(15,23,42,0.8)';
                })
                .polygonStrokeColor((d: any) => {
                    const countryName = d.properties.NAME;
                    const activeCities = ringData.filter(city => city.country === countryName && city.count > 0);
                    return activeCities.length > 0 ? '#f97316' : '#1e293b';
                });

            // Start view centered on Iraq/Middle East
            globe.pointOfView({ lat: 28.0, lng: 48.0, altitude: 2.2 }, 0);

            globeInstance.current = globe;

            // Auto-rotate slowly
            globe.controls().autoRotate = true;
            globe.controls().autoRotateSpeed = 0.3;
            globe.controls().enableZoom = true;
            globe.controls().minAltitude = 0.1;
            globe.controls().maxAltitude = 12;
        });

        return () => {
            if (globeRef.current) globeRef.current.innerHTML = "";
        };
    }, [countries]);

    // Update markers when signals change
    useEffect(() => {
        if (!globeInstance.current) return;
        globeInstance.current.ringsData(ringData.filter(d => d.count > 0));
        globeInstance.current.labelsData(ringData);
    }, [ringData]);

    // Fly to city on event click
    useEffect(() => {
        if (!globeInstance.current || targetLat == null || targetLng == null) return;
        globeInstance.current.pointOfView({ lat: targetLat, lng: targetLng, altitude: 0.8 }, 1500);
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
                        const location = REGIONAL_CITIES.find((c: any) =>
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
