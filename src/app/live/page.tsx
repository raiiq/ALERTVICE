"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { deduplicateTitle } from "../components/MediaDisplay";
import dynamic from 'next/dynamic';

// Leaflet markers/popups are tricky in Next.js SSR, so we dynamic import the Map components
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(m => m.useMap), { ssr: false });

// Leaflet CSS needs to be loaded for the map to render correctly
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

// Helper to center and zoom map
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = (useMap as any)();
    useEffect(() => {
        if (center && map) {
            map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
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
        <div className="fixed inset-0 bg-black text-white flex overflow-hidden">

            {/* 1. FULL-WIDTH MAP BACKGROUND */}
            <div className="absolute inset-0 z-10">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    zoomControl={false}
                    scrollWheelZoom={true}
                    className="w-full h-full grayscale-[0.1] contrast-[1.2] brightness-[0.6]"
                    style={{ background: '#020203' }}
                >
                    {/* REAL GOOGLE SATELLITE MAP DATA */}
                    <TileLayer
                        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                        attribution='&copy; Google Maps'
                        maxZoom={20}
                    />

                    <MapController center={mapCenter} zoom={mapZoom} />

                    {/* Tactical Indicators for Cities */}
                    {IRAQ_CITIES.map(city => {
                        const activePackets = signalsWithLocations.filter(s => s.location?.name === city.name);
                        const hasActivity = activePackets.length > 0;

                        return (
                            <CircleMarker
                                key={city.name}
                                center={[city.lat, city.lng]}
                                radius={hasActivity ? 15 : 6}
                                pathOptions={{
                                    fillColor: hasActivity ? '#38bdf8' : 'rgba(255,255,255,0.2)',
                                    fillOpacity: hasActivity ? 0.7 : 0.4,
                                    color: hasActivity ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                                    weight: hasActivity ? 3 : 1,
                                    dashArray: hasActivity ? '5, 5' : 'none'
                                }}
                                eventHandlers={{
                                    click: () => { setMapCenter([city.lat, city.lng]); setMapZoom(11); }
                                }}
                            >
                                <Popup className="tactical-popup">
                                    <div className="bg-[#0a0a0c] text-white p-4 rounded-xl border border-primary/30 min-w-[200px]">
                                        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                                            <span className={`w-2 h-2 rounded-full ${hasActivity ? 'bg-primary animate-pulse' : 'bg-white/20'}`}></span>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">{city.name}</h4>
                                        </div>
                                        <div className="flex flex-col gap-1 text-[10px] font-mono text-white/50">
                                            <span>Coordinates: {city.lat.toFixed(4)}°, {city.lng.toFixed(4)}°</span>
                                            <span>Signal Load: {activePackets.length} Active</span>
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            </div>

            {/* 2. OVERLAY UI: HEADER & CONTROLS */}
            <div className="absolute inset-0 z-20 pointer-events-none">

                {/* TOP INTERFACE */}
                <div className="p-8 flex items-start justify-between">
                    <div className="flex items-center gap-6 pointer-events-auto">
                        <Link href="/" className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-3xl hover:border-primary/50 hover:bg-primary/10 transition-all group">
                            <svg className="w-6 h-6 text-white/60 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-black uppercase tracking-[0.5em] text-white/90">Signal Monitor <span className="text-primary/70">Tactical</span></h1>
                            <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1">Live Geo-Sector: Iraq / Kuwait / Saudi</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-[10px] font-mono text-white/40 tracking-widest uppercase pointer-events-auto bg-black/40 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-primary animate-pulse font-black">●</span>
                            <span>Global Intelligence Link: Established</span>
                        </div>
                        <div className="h-px w-full bg-white/5 my-1"></div>
                        <div className="flex gap-4">
                            <span>Signals: {signals.length}</span>
                            <span>Sync: 100%</span>
                        </div>
                    </div>
                </div>

                {/* CRT SCANLINE AND EFFECTS */}
                <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-40"></div>

                {/* ZOOM CONTROLS (BOTTOM RIGHT) */}
                <div className="absolute bottom-10 right-10 flex flex-col gap-3 pointer-events-auto z-50">
                    <button onClick={() => setMapZoom(z => Math.min(z + 1, 20))} className="w-12 h-12 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center text-primary text-2xl font-black hover:bg-primary/10 hover:border-primary/40 transition-all shadow-2xl">+</button>
                    <button onClick={() => setMapZoom(z => Math.max(z - 1, 1))} className="w-12 h-12 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center text-primary text-2xl font-black hover:bg-primary/10 hover:border-primary/40 transition-all shadow-2xl">-</button>
                    <button onClick={() => { setMapCenter([33.3152, 44.3661]); setMapZoom(6); }} className="w-12 h-12 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all shadow-2xl">⟲</button>
                </div>
            </div>

            {/* 3. FLOAT INTELLIGENCE FEED (Overlay Panel) */}
            <aside className="fixed top-32 bottom-10 right-10 w-[420px] bg-[#050507]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] flex flex-col z-[500] shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden">
                <div className="p-8 pb-6 border-b border-white/[0.04] bg-white/[0.01]">
                    <h2 className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em] mb-6 flex items-center justify-between">
                        Sector Analysis
                        <span className="text-primary/40 text-[9px] font-mono tracking-tighter">Live Uplink</span>
                    </h2>
                    <div className="flex gap-2">
                        <button className="flex-1 py-3 bg-primary/10 border border-primary/20 rounded-xl text-[9px] font-black text-primary uppercase tracking-widest">All Signals</button>
                        <button className="flex-1 py-3 bg-white/[0.02] border border-white/5 rounded-xl text-[9px] font-black text-white/30 uppercase tracking-widest hover:text-white/60">Urgent Only</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none p-6 flex flex-col gap-4">
                    {signalsWithLocations.map((post, idx) => (
                        <motion.div key={post.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                            <button onClick={() => post.location && focusTo(post.location.name)} className="w-full text-left group">
                                <div className="p-6 rounded-[1.8rem] bg-white/[0.02] border border-white/[0.06] group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300 relative">
                                    {post.location && (
                                        <div className="absolute top-5 right-6 flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                            <span className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#38bdf8]"></span>
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{post.location.name}</span>
                                        </div>
                                    )}
                                    <span className="text-[9px] font-mono text-white/20 mb-3 block uppercase tracking-widest">{new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <h3 className={`text-[13px] font-bold text-white/70 leading-relaxed group-hover:text-white transition-colors ${isAr ? 'text-right' : ''}`}>
                                        {deduplicateTitle(post.aiTitle || "")}
                                    </h3>
                                    <div className="mt-4 text-[9px] font-black text-white/20 uppercase tracking-widest group-hover:text-primary transition-colors flex items-center gap-2">
                                        {post.location ? '⌖ CENTERING SECTOR' : 'ANALYZE DATA →'}
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </aside>

            <style jsx global>{`
        .leaflet-container { background: #020203 !important; }
        .tactical-popup .leaflet-popup-content-wrapper {
          background: rgba(10,10,12,0.98);
          border: 1px solid rgba(56,189,248,0.4);
          color: white;
          border-radius: 20px;
          padding: 0;
          box-shadow: 0 0 50px rgba(0,0,0,1);
        }
        .tactical-popup .leaflet-popup-tip { background: rgba(56,189,248,0.4); }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}
