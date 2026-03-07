"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { deduplicateTitle } from "../components/MediaDisplay";
import dynamic from 'next/dynamic';

// Leaflet markers/popups are tricky in Next.js SSR, so we dynamic import the Map component
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(m => m.useMap), { ssr: false });

// Leaflet CSS needs to be loaded differently in Next.js, or we can just inject a link
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
        if (center && map) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
}

export default function GlobalMonitorSystem() {
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [lang, setLang] = useState("en");
    const [mapCenter, setMapCenter] = useState<[number, number]>([33.3152, 44.3661]);
    const [mapZoom, setMapZoom] = useState(6);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
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
        const interval = setInterval(fetchSignals, 20000);
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

    const focusTo = (cityName: string) => {
        const city = IRAQ_CITIES.find(c => c.name === cityName);
        if (city) {
            setMapCenter([city.lat, city.lng]);
            setMapZoom(12);
        }
    };

    const isAr = lang === "ar";
    const getPostId = (idString: string) => idString.split('/').pop() || "";

    if (!isClient) return <div className="min-h-screen bg-black" />;

    return (
        <div className="fixed inset-0 bg-[#020202] text-white flex overflow-hidden selection:bg-primary/30">

            {/* 1. SECTOR FEEDS SIDEBAR (Independently Scrollable) */}
            <aside className="w-[450px] bg-[#050507] border-r border-white/5 flex flex-col z-[500] shadow-[30px_0_60px_rgba(0,0,0,0.8)]">
                <div className="p-10 pb-8 border-b border-white/[0.03]">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/" className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center bg-white/[0.02] hover:bg-primary/10 hover:border-primary/30 transition-all group">
                            <svg className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xs font-black uppercase tracking-[0.4em] text-white">Tac-Monitor <span className="text-primary/70">Alpha</span></h1>
                            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest mt-1">Global Intelligence Feed - IQ SECTOR</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex-1 py-3 bg-primary/10 border border-primary/30 rounded-xl text-[9px] font-black text-primary uppercase tracking-widest">LIVE STREAM</button>
                        <button onClick={() => { setMapCenter([33.3152, 44.3661]); setMapZoom(6); }} className="flex-1 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[9px] font-black text-white/40 tracking-widest hover:text-white transition-all">RESET GRID</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none p-6 flex flex-col gap-4">
                    {signalsWithLocations.map((post, idx) => (
                        <motion.div key={post.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                            <button
                                onClick={() => post.location && focusTo(post.location.name)}
                                className="w-full text-left group"
                            >
                                <div className="p-6 rounded-[1.5rem] bg-white/[0.01] border border-white/[0.04] group-hover:bg-primary/[0.03] group-hover:border-primary/40 transition-all duration-500 relative overflow-hidden backdrop-blur-sm">
                                    {post.location && (
                                        <div className="absolute top-5 right-6 flex items-center gap-2 px-2.5 py-1 bg-primary/5 rounded-md border border-primary/20">
                                            <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>
                                            <span className="text-[8px] font-black text-primary/80 uppercase tracking-tighter">{post.location.name}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-[9px] font-mono text-white/20 mb-3 uppercase tracking-widest">
                                        {new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <span className="text-white/10 mx-1">|</span>
                                        SIG: {getPostId(post.id).slice(-4).toUpperCase()}
                                    </div>

                                    <h3 className={`text-[13px] font-bold text-white/80 leading-relaxed group-hover:text-white transition-colors ${isAr ? 'text-right' : ''}`}>
                                        {deduplicateTitle(post.aiTitle || "")}
                                    </h3>

                                    <div className="mt-4 flex items-center justify-between text-[8px] font-black text-white/10 uppercase tracking-[0.3em] group-hover:text-primary transition-all">
                                        <span>{post.location ? '⌖ Centering Sector' : 'Deep Analyze →'}</span>
                                        <div className="flex gap-0.5">
                                            <div className="w-4 h-0.5 bg-primary/10 rounded-full group-hover:bg-primary/40"></div>
                                            <div className="w-2 h-0.5 bg-primary/5 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/[0.03] bg-black/40 flex justify-between items-center text-[8px] font-mono text-white/10 uppercase tracking-widest px-8">
                    <span>Core-Link Stable</span>
                    <span>Sync-V2.8</span>
                </div>
            </aside>

            {/* 2. FULL-SCREEN INTERACTIVE MAP (Google Satellite) */}
            <main className="flex-1 relative bg-black/50">

                {/* TACTICAL OVERLAY UI */}
                <div className="absolute inset-0 pointer-events-none z-[100]">
                    {/* Scanlines Effect */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
                    {/* Dark Vigette */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_80%)] opacity-40"></div>

                    {/* Coordinate Display */}
                    <div className="absolute bottom-10 left-10 flex items-center gap-6 font-mono text-[9px] text-white/20 tracking-[0.4em] uppercase">
                        <span className="flex items-center gap-2"><span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span>Grid Active</span>
                        <span className="w-px h-3 bg-white/10"></span>
                        <span>44.3661° E, 33.3152° N</span>
                        <span className="w-px h-3 bg-white/10"></span>
                        <span>Zoom-Level: {mapZoom.toFixed(1)}x</span>
                    </div>
                </div>

                {/* REAL MAP COMPONENT */}
                <div className="absolute inset-0 z-10 w-full h-full">
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        scrollWheelZoom={true}
                        className="w-full h-full grayscale-[0.2] contrast-[1.2] brightness-[0.7]"
                        style={{ background: '#050507' }}
                        zoomControl={false}
                    >
                        {/* GOOGLE SATELLITE LAYER - THE HIGH-RES SOURCE */}
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                            attribution='&copy; <a href="https://maps.google.com">Google Maps Intelligence</a>'
                            maxZoom={20}
                        />

                        <MapController center={mapCenter} zoom={mapZoom} />

                        {/* Tactical Markers for Cities */}
                        {IRAQ_CITIES.map(city => {
                            const activePackets = signalsWithLocations.filter(s => s.location?.name === city.name);
                            const hasActivity = activePackets.length > 0;

                            return (
                                <CircleMarker
                                    key={city.name}
                                    center={[city.lat, city.lng]}
                                    radius={hasActivity ? 12 : 6}
                                    pathOptions={{
                                        fillColor: hasActivity ? '#38bdf8' : 'rgba(255,255,255,0.2)',
                                        fillOpacity: hasActivity ? 0.8 : 0.4,
                                        color: hasActivity ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                                        weight: hasActivity ? 4 : 1,
                                    }}
                                    eventHandlers={{
                                        click: () => { setMapCenter([city.lat, city.lng]); setMapZoom(11); }
                                    }}
                                >
                                    <Popup className="tactical-popup">
                                        <div className="bg-[#0a0a0c] text-white p-3 rounded-lg border border-primary/20 min-w-[160px]">
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-primary mb-2 border-b border-primary/10 pb-1">{city.name}</h4>
                                            <p className="text-[9px] font-mono text-white/60 uppercase">Signals: {activePackets.length} Active</p>
                                            {hasActivity && <div className="mt-2 text-[8px] font-black text-white/20 animate-pulse tracking-tighter">DATA LINK STABILIZED</div>}
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>
                </div>
            </main>

            <style jsx global>{`
        .leaflet-container {
          background: #050507 !important;
        }
        .leaflet-bar {
          border: 1px solid rgba(255,255,255,0.1) !important;
          background: rgba(0,0,0,0.8) !important;
          backdrop-filter: blur(8px);
        }
        .tactical-popup .leaflet-popup-content-wrapper {
          background: rgba(10,10,12,0.95);
          border: 1px solid rgba(56,189,248,0.3);
          color: white;
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 0 30px rgba(0,0,0,0.8);
        }
        .tactical-popup .leaflet-popup-tip {
          background: rgba(10,10,12,0.95);
          border: 1px solid rgba(56,189,248,0.3);
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}
