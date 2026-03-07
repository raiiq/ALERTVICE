"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { deduplicateTitle } from "../components/MediaDisplay";
import dynamic from 'next/dynamic';

// Leaflet dynamic imports for SSR compatibility
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(m => m.useMap), { ssr: false });

import 'leaflet/dist/leaflet.css';

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

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = (useMap as any)();
    useEffect(() => {
        if (center && map) map.flyTo(center, zoom, { duration: 1.5 });
    }, [center, zoom, map]);
    return null;
}

export default function MonitorTheSituation() {
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [activeTab, setActiveTab] = useState("FEED");
    const [mapCenter, setMapCenter] = useState<[number, number]>([33.3152, 44.3661]);
    const [mapZoom, setMapZoom] = useState(6);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const fetchSignals = async () => {
            try {
                const stored = localStorage.getItem("newsLang") || "en";
                const res = await fetch(`/api/news?lang=${stored}&limit=100&type=signal&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setSignals(data.posts || []);
                }
            } catch (e) { console.error(e); }
        };
        fetchSignals();
        const interval = setInterval(fetchSignals, 30000);
        return () => clearInterval(interval);
    }, []);

    const signalsWithLocations = useMemo(() => {
        return signals.map(s => {
            const text = ((s.aiTitle || "") + " " + (s.aiSummary || "") + " " + s.plainText).toLowerCase();
            const location = IRAQ_CITIES.find(city =>
                text.includes(city.name.toLowerCase()) || text.includes(city.ar)
            );
            return { ...s, location };
        });
    }, [signals]);

    const getTimeAgo = (dateStr: string) => {
        const d = new Date(dateStr);
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} minutes ago`;
        const hours = Math.floor(mins / 60);
        return `${hours} hours ago`;
    };

    if (!isClient) return <div className="min-h-screen bg-[#0d0d0f]" />;

    return (
        <div className="fixed inset-0 bg-[#0d0d0f] text-white flex flex-col font-sans overflow-hidden">

            {/* TOP HEADER BAR (Monitor The Situation Style) */}
            <header className="h-12 border-b border-white/5 bg-[#121216] px-4 flex items-center justify-between z-[1000]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                                <div className="w-3 h-3 border-2 border-black rounded-full"></div>
                            </div>
                            <span className="font-bold text-sm tracking-tight text-white/90">Monitor the Situation</span>
                        </Link>
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-[#1c1c22] border-none rounded py-1 px-3 pl-8 text-xs text-white/60 focus:outline-none focus:ring-1 focus:ring-primary/40 w-48 transition-all"
                        />
                        <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                {/* TOP TICKER / TOOLS */}
                <div className="hidden lg:flex items-center gap-4 flex-1 justify-center px-10">
                    <div className="flex items-center gap-1 overflow-hidden h-6">
                        <div className="flex items-center gap-3 animate-marquee whitespace-nowrap text-[10px] font-bold text-white/40 tracking-wider">
                            {signals.slice(0, 5).map(s => (
                                <span key={s.id} className="flex items-center gap-2">
                                    <span className="text-primary/60">●</span> {deduplicateTitle(s.aiTitle)}
                                    <span className="mx-4 opacity-20">|</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-[#1c1c22] rounded p-0.5">
                        <button className="px-2 py-0.5 text-[10px] font-bold text-white/30 hover:text-white transition-colors">6H</button>
                        <button className="px-2 py-0.5 text-[10px] font-bold bg-[#2d2d38] text-white rounded-sm shadow-sm">24H</button>
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-green-500 animate-pulse">●</span>
                        <span>8,689 MONITORS</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">

                {/* LEFT SIDEBAR (FEED) */}
                <aside className="w-[340px] bg-[#121216] border-r border-white/5 flex flex-col z-50">
                    <div className="p-3 border-b border-white/5">
                        <div className="flex items-center gap-4 mb-3">
                            {["FEED", "LIVE", "REPORTS"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-[10px] font-black tracking-widest uppercase transition-all pb-1 border-b-2 ${activeTab === tab ? 'text-white border-primary' : 'text-white/20 border-transparent hover:text-white/40'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-[9px] font-bold text-white/20 font-mono">{signals.length} events</span>
                                <button className="p-1 bg-[#1c1c22] rounded hover:bg-[#2d2d38] transition-colors">
                                    <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 hover:scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
                        {signalsWithLocations.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => s.location && setMapCenter([s.location.lat, s.location.lng])}
                                className="w-full p-4 text-left border-b border-white/[0.03] hover:bg-white/[0.03] transition-all group relative border-l-2 border-l-transparent hover:border-l-primary"
                            >
                                <div className="flex justify-between items-start mb-1.5 font-mono text-[9px] font-bold">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded-sm uppercase tracking-tighter ${s.aiTag === 'Conflict' ? 'bg-red-500/20 text-red-500' : 'bg-purple-500/20 text-purple-400'}`}>
                                            {s.aiTag || 'Event'}
                                        </span>
                                        <span className="text-white/20">S2</span>
                                    </div>
                                    <span className="text-white/20">{getTimeAgo(s.date)}</span>
                                </div>
                                <h4 className="text-[12px] font-bold leading-snug text-white/80 group-hover:text-white transition-colors line-clamp-2">
                                    {deduplicateTitle(s.aiTitle)}
                                </h4>
                                {s.location && (
                                    <div className="mt-2 flex items-center gap-1.5 text-white/20 group-hover:text-white/40 transition-colors">
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{s.location.name}</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* RIGHT: MAP AREA */}
                <main className="flex-1 relative bg-[#070709]">
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        className="w-full h-full grayscale-[0.3] contrast-[1.2] brightness-[0.7]"
                        zoomControl={false}
                        style={{ background: '#070709' }}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; CARTO'
                        />
                        <MapController center={mapCenter} zoom={mapZoom} />

                        {IRAQ_CITIES.map(city => {
                            const activeEvents = signalsWithLocations.filter(s => s.location?.name === city.name);
                            const hasEvents = activeEvents.length > 0;

                            return (
                                <CircleMarker
                                    key={city.name}
                                    center={[city.lat, city.lng]}
                                    radius={hasEvents ? 10 : 4}
                                    pathOptions={{
                                        fillColor: hasEvents ? '#f97316' : 'rgba(255,255,255,0.1)',
                                        fillOpacity: 0.8,
                                        color: hasEvents ? '#fff' : 'rgba(255,255,255,0.05)',
                                        weight: hasEvents ? 2 : 1
                                    }}
                                    eventHandlers={{
                                        click: () => { setMapCenter([city.lat, city.lng]); setMapZoom(11); }
                                    }}
                                >
                                    <Popup className="compact-popup">
                                        <div className="bg-[#121216] text-white p-2 rounded shadow-xl border border-white/5">
                                            <p className="text-[10px] font-black uppercase mb-1">{city.name}</p>
                                            <p className="text-[9px] text-white/40">{activeEvents.length} Recent Events</p>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>

                    {/* ZOOM CONTROLS (Floating Right) */}
                    <div className="absolute right-4 bottom-1/2 -translate-y-1/2 flex flex-col gap-1 z-50">
                        <button onClick={() => setMapZoom(z => z + 1)} className="w-8 h-8 bg-[#1c1c22]/80 border border-white/10 flex items-center justify-center hover:bg-[#2d2d38] transition-all">+</button>
                        <button onClick={() => setMapZoom(z => z - 1)} className="w-8 h-8 bg-[#1c1c22]/80 border border-white/10 flex items-center justify-center hover:bg-[#2d2d38] transition-all">-</button>
                    </div>

                    {/* STAR FIELD BACKGROUND (Top/Bottom Overlays) */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                        {[...Array(50)].map((_, i) => (
                            <div key={i} className="absolute bg-white rounded-full" style={{
                                width: Math.random() * 2 + 'px',
                                height: Math.random() * 2 + 'px',
                                top: Math.random() * 100 + '%',
                                left: Math.random() * 100 + '%',
                                boxShadow: '0 0 10px white'
                            }} />
                        ))}
                    </div>
                </main>
            </div>

            <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        .leaflet-container { background: #070709 !important; }
        .compact-popup .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 0; }
        .compact-popup .leaflet-popup-tip-container { display: none; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { border-radius: 10px; }
      `}</style>
        </div>
    );
}
