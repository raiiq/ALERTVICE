"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { deduplicateTitle } from "../components/MediaDisplay";
import { useLanguage } from "../context/LanguageContext";

interface NewsPost {
    id: string;
    plainText: string;
    date: string;
    aiTitle: string | null;
    aiSummary?: string | null;
    aiTag?: string | null;
    location?: { name: string; lat: number; lng: number } | null;
}

// ALERT RADAR: COMPREHENSIVE PAN-MIDDLE EAST DATA
const REGIONAL_CITIES = [
    // Iraq
    { name: "Baghdad", ar: "بغداد", country: "Iraq", lat: 33.3152, lng: 44.3661, isCapital: true },
    { name: "Mosul", ar: "الموصل", country: "Iraq", lat: 36.3489, lng: 43.1577 },
    { name: "Basra", ar: "البصرة", country: "Iraq", lat: 30.5081, lng: 47.7833 },
    { name: "Erbil", ar: "أربيل", country: "Iraq", lat: 36.1901, lng: 44.0094 },
    { name: "Sulaymaniyah", ar: "السليمانية", country: "Iraq", lat: 35.5617, lng: 45.4408 },
    { name: "Kirkuk", ar: "كركوك", country: "Iraq", lat: 35.4687, lng: 44.3921 },
    { name: "Najaf", ar: "النجف", country: "Iraq", lat: 32.0259, lng: 44.3436 },
    { name: "Karbala", ar: "كربلاء", country: "Iraq", lat: 32.6160, lng: 44.0248 },
    // Iran
    { name: "Tehran", ar: "طهران", country: "Iran", lat: 35.6892, lng: 51.3890, isCapital: true },
    { name: "Mashhad", ar: "مشهد", country: "Iran", lat: 36.2972, lng: 59.6067 },
    { name: "Isfahan", ar: "أصفهان", country: "Iran", lat: 32.6546, lng: 51.6680 },
    { name: "Tabriz", ar: "تبريز", country: "Iran", lat: 38.0962, lng: 46.2738 },
    { name: "Shiraz", ar: "شيراز", country: "Iran", lat: 29.5918, lng: 52.5837 },
    { name: "Kermanshah", ar: "كرمانشاه", country: "Iran", lat: 34.3167, lng: 47.0667 },
    { name: "Bandar Abbas", ar: "بندر عباس", country: "Iran", lat: 27.1833, lng: 56.2667 },
    // Turkey
    { name: "Ankara", ar: "أنقرة", country: "Turkey", lat: 39.9334, lng: 32.8597, isCapital: true },
    { name: "Istanbul", ar: "إسطنبول", country: "Turkey", lat: 41.0082, lng: 28.9784 },
    { name: "Izmir", ar: "إزمير", country: "Turkey", lat: 38.4237, lng: 27.1428 },
    { name: "Adana", ar: "أضنة", country: "Turkey", lat: 36.9914, lng: 35.3308 },
    { name: "Gaziantep", ar: "غازي عنتاب", country: "Turkey", lat: 37.0662, lng: 37.3833 },
    { name: "Diyarbakir", ar: "ديار بكر", country: "Turkey", lat: 37.9100, lng: 40.2400 },
    // Egypt
    { name: "Cairo", ar: "القاهرة", country: "Egypt", lat: 30.0444, lng: 31.2357, isCapital: true },
    { name: "Alexandria", ar: "الإسكندرية", country: "Egypt", lat: 31.2001, lng: 29.9187 },
    { name: "Suez", ar: "السويس", country: "Egypt", lat: 29.9668, lng: 32.5498 },
    { name: "Port Said", ar: "بورسعيد", country: "Egypt", lat: 31.2653, lng: 32.3019 },
    { name: "Aswan", ar: "أسوان", country: "Egypt", lat: 24.0889, lng: 32.8998 },
    // Syria & Levant
    { name: "Damascus", ar: "دمشق", country: "Syria", lat: 33.5138, lng: 36.2765, isCapital: true },
    { name: "Aleppo", ar: "حلب", country: "Syria", lat: 36.2021, lng: 37.1343 },
    { name: "Homs", ar: "حمص", country: "Syria", lat: 34.7324, lng: 36.7137 },
    { name: "Latakia", ar: "اللاذقية", country: "Syria", lat: 35.5317, lng: 35.7908 },
    { name: "Beirut", ar: "بيروت", country: "Lebanon", lat: 33.8938, lng: 35.5018, isCapital: true },
    { name: "Tripoli", ar: "طرابلس", country: "Lebanon", lat: 34.4367, lng: 35.8497 },
    { name: "Amman", ar: "عمان", country: "Jordan", lat: 31.9454, lng: 35.9284, isCapital: true },
    { name: "Aqaba", ar: "العقبة", country: "Jordan", lat: 29.5319, lng: 35.0061 },
    // Israel & Palestine
    { name: "Jerusalem", ar: "القدس", country: "Israel", lat: 31.7683, lng: 35.2137, isCapital: true },
    { name: "Tel Aviv", ar: "تل أبيب", country: "Israel", lat: 32.0853, lng: 34.7818 },
    { name: "Gaza", ar: "غزة", country: "Palestine", lat: 31.5017, lng: 34.4668 },
    { name: "Ramallah", ar: "رام الله", country: "Palestine", lat: 31.9029, lng: 35.2031, isCapital: true },
    // Gulf & Arabian Peninsula
    { name: "Dubai", ar: "دبي", country: "UAE", lat: 25.2048, lng: 55.2708 },
    { name: "Abu Dhabi", ar: "أبو ظبي", country: "UAE", lat: 24.4539, lng: 54.3773, isCapital: true },
    { name: "Riyadh", ar: "الرياض", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, isCapital: true },
    { name: "Jeddah", ar: "جدة", country: "Saudi Arabia", lat: 21.4858, lng: 39.1925 },
    { name: "Mecca", ar: "مكة المكرمة", country: "Saudi Arabia", lat: 21.3891, lng: 39.8579 },
    { name: "Medina", ar: "المدينة المنورة", country: "Saudi Arabia", lat: 24.4672, lng: 39.6068 },
    { name: "Dammam", ar: "الدمام", country: "Saudi Arabia", lat: 26.4207, lng: 50.0888 },
    { name: "Kuwait City", ar: "مدينة الكويت", country: "Kuwait", lat: 29.3759, lng: 47.9774, isCapital: true },
    { name: "Doha", ar: "الدوحة", country: "Qatar", lat: 25.2854, lng: 51.5310, isCapital: true },
    { name: "Manama", ar: "المنامة", country: "Bahrain", lat: 26.2285, lng: 50.5860, isCapital: true },
    { name: "Muscat", ar: "مسقط", country: "Oman", lat: 23.5859, lng: 58.4059, isCapital: true },
    { name: "Sana'a", ar: "صنعاء", country: "Yemen", lat: 15.3694, lng: 44.1910, isCapital: true },
    { name: "Aden", ar: "عدن", country: "Yemen", lat: 12.7855, lng: 45.0186 },
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
    const initializingRef = useRef(false);
    const [countries, setCountries] = useState<any[]>([]);
    const [selectedCityName, setSelectedCityName] = useState<string | null>(null);

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(data => setCountries(data.features));
    }, []);

    const ringData = useMemo(() => {
        return REGIONAL_CITIES.map(city => {
            const events = signals.filter(s => {
                const text = ((s.aiTitle || "") + " " + (s.plainText || "")).toLowerCase();
                return text.includes(city.name.toLowerCase()) || text.includes(city.ar);
            });
            const isSelected = city.name === selectedCityName;
            return {
                ...city,
                count: events.length,
                events: events.slice(0, 3),
                color: isSelected ? "#00bbff" : (events.length > 0 ? "#00bbff" : "rgba(100,116,139,0.4)"),
                size: isSelected ? 1.6 : (events.length > 0 ? 1.0 : 0.2),
                isSelected
            };
        });
    }, [signals, selectedCityName]);

    // ── INITIALIZE GLOBE (ONCE) ──
    useEffect(() => {
        let isMounted = true;
        if (!globeRef.current || globeInstance.current || initializingRef.current) return;

        initializingRef.current = true;
        if (globeRef.current) globeRef.current.innerHTML = ""; // Hard purge

        let globe: any = null;

        import("globe.gl").then((mod) => {
            if (!isMounted) {
                initializingRef.current = false;
                return;
            }
            const Globe = (mod.default || mod) as any;
            globe = Globe({ rendererConfig: { antialias: true, alpha: true } })(globeRef.current!);

            // BASE CONFIG (STATIC)
            globe
                .globeImageUrl("//unpkg.com/three-globe/example/img/earth-dark.jpg")
                .backgroundColor("#050508")
                .showAtmosphere(true)
                .atmosphereColor("#0088ff")
                .atmosphereAltitude(0.15)
                .polygonSideColor(() => 'rgba(0,136,255,0.02)')
                .labelLat("lat")
                .labelLng((d: any) => d.lng + 0.3) // Tactical offset to the right
                .labelAltitude(0.012)
                .labelResolution(6)
                .ringAltitude(0.008)
                .ringPropagationSpeed((d: any) => d.isSelected ? 4 : 2)
                .ringRepeatPeriod((d: any) => d.isSelected ? 1000 : 2500)
                .onLabelClick((d: any) => {
                    if (selectedCityName === d.name) {
                        setSelectedCityName(null);
                        globe.controls().autoRotate = true;
                    } else {
                        onFlyTo(d.lat, d.lng);
                    }
                })
                .onGlobeClick(() => {
                    setSelectedCityName(null);
                    if (globe.controls()) globe.controls().autoRotate = true;
                });

            globe.pointOfView({ lat: 26.0, lng: 44.0, altitude: 2.1 }, 0);
            if (globe.controls()) {
                globe.controls().autoRotate = true;
                globe.controls().autoRotateSpeed = 0.22;
                globe.controls().enableZoom = true;
            }

            globeInstance.current = globe;
            initializingRef.current = false;
        }).catch(err => {
            console.error("Globe Load Error:", err);
            initializingRef.current = false;
        });

        return () => {
            isMounted = false;
            if (globeInstance.current) {
                // Correct cleanup to prevent memory leaks and duplicated maps
                const scene = globeInstance.current.scene();
                if (scene) {
                    scene.traverse((object: any) => {
                        if (object.geometry) object.geometry.dispose();
                        if (object.material) {
                            if (Array.isArray(object.material)) object.material.forEach((m: any) => m.dispose());
                            else object.material.dispose();
                        }
                    });
                }
                if (globeRef.current) globeRef.current.innerHTML = "";
                globeInstance.current = null;
            }
            initializingRef.current = false;
        };
    }, []); // Empty dependency array = Initialize ONLY ONCE

    // ── REACTIVE UPDATES (DATA CHANGE) ──
    useEffect(() => {
        const globe = globeInstance.current;
        if (!globe) return;

        // Sync Countries/Polygons
        globe.polygonsData(countries)
            .polygonAltitude(0.002)
            .polygonStrokeColor((d: any) => {
                const countryName = d.properties.NAME;
                const activeCities = ringData.filter(city => city.country === countryName && (city.count > 0 || city.isSelected));
                return activeCities.length > 0 ? '#00bbff' : 'rgba(0,136,255,0.4)';
            })
            .polygonCapColor((d: any) => {
                const countryName = d.properties.NAME;
                const activeCities = ringData.filter(city => city.country === countryName && (city.count > 0 || city.isSelected));
                return activeCities.length > 0 ? 'rgba(0,187,255,0.08)' : 'rgba(15,15,25,0.85)';
            })
            .polygonLabel((d: any) => `
                <div style="background:rgba(5,5,10,0.9); border:1px solid #0088ff; padding:6px 14px; border-radius:4px; color:white; font-weight:900; font-size:11px; text-transform:uppercase; letter-spacing:0.2em; backdrop-filter:blur(10px); box-shadow: 0 0 25px rgba(0,136,255,0.3);">
                    ${d.properties.NAME} SECTOR
                </div>
            `);

        // Sync Labels - CLEAN RADAR MODE (Points Only)
        globe.labelsData(ringData)
            .labelText(() => "") // Hide persistent labels
            .labelLat((d: any) => {
                // Precision Vertical Staggering for dense clusters
                if (d.name === "Beirut") return d.lat + 0.5;
                if (d.name === "Amman") return d.lat - 0.5;
                if (d.name === "Manama") return d.lat + 0.3;
                if (d.name === "Doha") return d.lat - 0.3;
                if (d.name === "Gaza") return d.lat - 0.4;
                return d.lat;
            })
            .labelLng((d: any) => {
                // Precision Horizontal Staggering for dense clusters
                if (d.name === "Tel Aviv") return d.lng - 1.2;
                if (d.name === "Jerusalem") return d.lng + 0.4;
                if (d.name === "Damascus") return d.lng + 0.8;
                return d.lng + 0.3; // Default right-offset
            })
            .labelSize(0.38)
            .labelDotRadius(0.25) // High-visibility points
            .labelColor((d: any) => d.count > 0 || d.isSelected ? "#00bbff" : "#ffffff")
            .labelResolution(6)
            .labelAltitude(0.012)
            .labelLabel((d: any) => `
                <div style="background:rgba(5,5,8,0.98); border:1px solid ${d.isSelected || d.count > 0 ? '#00bbff' : '#004488'}; padding:16px; border-radius:12px; min-width:280px; box-shadow: 0 0 50px rgba(0,0,0,0.9); animation: fadeIn 0.3s ease-out; border-left: 5px solid ${d.isSelected || d.count > 0 ? '#00bbff' : '#004488'}; backdrop-filter: blur(15px);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid rgba(0,136,255,0.15); padding-bottom:12px;">
                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <div style="font-weight:900; font-size:14px; color:white; text-transform:uppercase; letter-spacing:0.1em;">\${d.name}</div>
                            <div style="font-weight:700; font-size:16px; color:#00bbff; font-family: var(--font-arabic, 'Segoe UI', Arial, sans-serif);" dir="rtl">\${d.ar || ''}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:10px; color:${d.count > 0 ? '#00bbff' : '#64748b'}; font-weight:900; letter-spacing:0.05em;">${d.count} ACTIVE SIGNALS</div>
                            <div style="font-size:9px; color:rgba(255,255,255,0.3); font-weight:700; margin-top:2px;">SECTOR: ${d.country.toUpperCase()}</div>
                        </div>
                    </div>
                    ${d.events.length > 0 ? `
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${d.events.map((e: any) => `
                                <div style="font-size:11px; line-height:1.5; color:rgba(255,255,255,0.9); background:rgba(0,136,255,0.04); padding:6px 10px; border-radius:4px; border-left:2px solid #00bbff;">
                                    ${e.aiTitle}
                                </div>
                            `).join('')}
                            <div style="font-size:9px; color:#00bbff; font-weight:bold; letter-spacing:0.1em; opacity:0.8;">RADAR SYNC ACTIVE</div>
                        </div>
                    ` : '<div style="font-size:11px; color:#475569; font-style:italic;">Sector quiet. Scanning...</div>'}
                </div>
                <style>@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }</style>
            `);

        // Sync Rings
        globe.ringsData(ringData.filter(d => d.count > 0 || d.isSelected))
            .ringColor((d: any) => d.isSelected ? '#00bbff' : 'rgba(0,187,255,0.6)')
            .ringMaxRadius((d: any) => d.size);

        // Sync HTML (Radar Lock)
        globe.htmlElementsData(ringData.filter(d => d.isSelected))
            .htmlElement((d: any) => {
                const el = document.createElement('div');
                el.innerHTML = `
                    <div style="position:relative; pointer-events:none;">
                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:90px; height:90px; border:1px solid rgba(0,187,255,0.4); border-radius:50%;">
                            <div style="position:absolute; width:100%; height:100%; border:2px solid #00bbff; border-radius:50%; animation: radarPing 2s linear infinite;"></div>
                            <div style="position:absolute; width:100%; height:100%; border:1px solid #00bbff; border-radius:50%; opacity:0.3; animation: radarPing 2s linear infinite; animation-delay: 1s;"></div>
                            <div style="position:absolute; top:-15px; left:50%; width:1px; height:15px; background:#00bbff;"></div>
                            <div style="position:absolute; bottom:-15px; left:50%; width:1px; height:15px; background:#00bbff;"></div>
                            <div style="position:absolute; left:-15px; top:50%; height:1px; width:15px; background:#00bbff;"></div>
                            <div style="position:absolute; right:-15px; top:50%; height:1px; width:15px; background:#00bbff;"></div>
                        </div>
                        <div style="position:absolute; bottom:55px; left:50%; transform:translateX(-50%); background:rgba(5,5,8,0.98); border:1px solid #0088ff; padding:15px; border-radius:10px; min-width:280px; box-shadow: 0 0 60px rgba(0,136,255,0.4); z-index:1000; animation: targetLockIn 0.8s cubic-bezier(0.17, 0.84, 0.44, 1); border-top-width: 4px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(0,136,255,0.3); padding-bottom:8px;">
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-weight:900; font-size:14px; color:white; text-transform:uppercase; letter-spacing:0.2em;">TARGET LOCKED</span>
                                    <span style="font-size:10px; color:#00bbff; font-weight:bold;">${d.name.toUpperCase()} / SECTOR ${Math.floor(Math.random() * 900) + 100}</span>
                                </div>
                                <div style="width:12px; height:12px; border-radius:50%; background:#00bbff; animation: blip 0.5s infinite; box-shadow: 0 0 15px #00bbff;"></div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:10px;">
                                ${d.events.map((e: any) => `<div style="font-size:11px; color:rgba(255,255,255,0.95); background:rgba(0,136,255,0.08); padding:10px; border-radius:6px; border-left:3px solid #00bbff;">${e.aiTitle}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
                return el;
            });
    }, [countries, ringData]);

    // Fly to city on event click - Radar Trigger
    useEffect(() => {
        if (!globeInstance.current || targetLat == null || targetLng == null) return;

        // Find city name from coordinates
        const city = REGIONAL_CITIES.find(c => Math.abs(c.lat - targetLat) < 0.1 && Math.abs(c.lng - targetLng) < 0.1);
        if (city) setSelectedCityName(city.name);

        globeInstance.current.pointOfView({ lat: targetLat, lng: targetLng, altitude: 0.35 }, 1500);
        globeInstance.current.controls().autoRotate = false;
    }, [targetLat, targetLng]);

    return <div ref={globeRef} className="w-full h-full" />;
}

// ─────────────────────────────────────────
export default function MonitorPage() {
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [filteredSignals, setFilteredSignals] = useState<NewsPost[]>([]);
    const [timeRange, setTimeRange] = useState<"6H" | "24H">("24H");
    const [activeTab, setActiveTab] = useState<"FEED" | "LIVE" | "REPORTS">("FEED");
    const [targetLat, setTargetLat] = useState<number | null>(null);
    const [targetLng, setTargetLng] = useState<number | null>(null);
    const [isClient, setIsClient] = useState(false);
    const { lang, isAr } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setIsClient(true);

        const fetchSignals = async (currentLang = lang) => {
            try {
                const res = await fetch(`/api/news?lang=${currentLang}&limit=100&type=signal&t=${Date.now()}`);
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
        fetchSignals(lang);
        const t = setInterval(() => fetchSignals(lang), 30000);
        return () => clearInterval(t);
    }, [lang]);

    // Implement Time-Range Filtering logic
    useEffect(() => {
        const threshold = new Date();
        if (timeRange === "6H") threshold.setHours(threshold.getHours() - 6);
        else threshold.setHours(threshold.getHours() - 24);

        const filtered = signals.filter(s => {
            const matchesTime = new Date(s.date) >= threshold;
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery === "" ||
                (s.aiTitle || "").toLowerCase().includes(searchLower) ||
                (s.plainText || "").toLowerCase().includes(searchLower) ||
                (s.location?.name || "").toLowerCase().includes(searchLower) ||
                (s.aiTag || "").toLowerCase().includes(searchLower);

            return matchesTime && matchesSearch;
        });
        setFilteredSignals(filtered);
    }, [signals, timeRange, searchQuery]);

    const handleFlyTo = useCallback((lat: number, lng: number) => {
        setTargetLat(lat);
        setTargetLng(lng);
    }, []);

    const getPostId = (id: string) => id.split("/").pop() || "";

    return (
        <div
            className="fixed inset-0 text-foreground flex flex-col overflow-hidden"
            style={{ background: "#050508", fontFamily: "var(--font-condensed, 'Franklin Gothic Medium', Arial, sans-serif)" }}
        >
            {/* ── MAIN GLOBAL NAVBAR IS NOW IN ROOT LAYOUT ── */}

            {/* ── RADAR-SPECIFIC BAR ── */}
            <header className="h-10 border-b border-white/[0.08] bg-[#09090c]/80 backdrop-blur-md flex items-center gap-4 px-4 shrink-0 z-[800] shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                {/* Search */}
                <div className="relative group">
                    <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#0088ff]/40 pointer-events-none group-focus-within:text-[#0088ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Scanning radar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-foreground/5 text-foreground/70 placeholder:text-[#0088ff]/20 text-[10px] py-1 pl-9 pr-4 rounded-none w-48 outline-none border border-border-color/50 focus:border-[#0088ff]/40 transition-all font-black uppercase tracking-widest"
                    />
                </div>

                {/* Ticker */}
                <div className="flex-1 overflow-hidden h-full flex items-center mx-6">
                    <div className="whitespace-nowrap overflow-hidden h-full flex items-center">
                        <div className="inline-flex gap-10 items-center animate-marquee text-[10px] font-bold text-[#0088ff]/50 tracking-widest uppercase">
                            {filteredSignals.slice(0, 15).map((s, i) => (
                                <span key={i} className="flex items-center gap-3 shrink-0">
                                    <span className="w-1.5 h-1.5 bg-[#0088ff] rounded-none shadow-[0_0_8px_#0088ff] animate-pulse" />
                                    {deduplicateTitle(s.aiTitle)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1 bg-[#12121a] rounded-none p-1 border border-border-color/50">
                        <button
                            onClick={() => setTimeRange("6H")}
                            className={`px-3 py-1 text-[10px] font-black rounded-none transition-all ${timeRange === "6H" ? "bg-[#0088ff] text-foreground shadow-[0_0_15px_rgba(0,136,255,0.4)]" : "text-foreground/30 hover:text-foreground/60"}`}
                        >
                            6H
                        </button>
                        <button
                            onClick={() => setTimeRange("24H")}
                            className={`px-3 py-1 text-[10px] font-black rounded-none transition-all ${timeRange === "24H" ? "bg-[#0088ff] text-foreground shadow-[0_0_15px_rgba(0,136,255,0.4)]" : "text-foreground/30 hover:text-foreground/60"}`}
                        >
                            24H
                        </button>
                    </div>
                    <div className="flex items-center gap-2 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-none px-4 py-1.5 shadow-[inset_0_0_20px_rgba(0,255,136,0.02)]">
                        <span className="w-2 h-2 bg-[#00ff88] rounded-none shadow-[0_0_10px_#00ff88] animate-pulse" />
                        <span className="text-[10px] font-black text-[#00ff88] tracking-[0.2em] uppercase">9,412 Active Ops</span>
                    </div>
                </div>
            </header>

            {/* ── MAIN BODY ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── LEFT FEED PANEL ── */}
                <aside className="w-[320px] bg-[#09090c] border-r border-white/[0.08] flex flex-col shrink-0 z-50 shadow-[4px_0_30px_rgba(0,0,0,0.5)]">
                    {/* Tabs */}
                    <div className="px-5 pt-4 pb-0 border-b border-white/[0.05]">
                        <div className="flex items-center gap-6 mb-4">
                            {(["FEED", "LIVE", "REPORTS"] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-[10px] font-black tracking-[0.2em] uppercase pb-3 border-b-2 transition-all ${activeTab === tab
                                        ? "text-foreground border-[#0088ff] drop-shadow-[0_0_10px_rgba(0,136,255,0.5)]"
                                        : "text-foreground/20 border-transparent hover:text-foreground/50"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                            <span className="ml-auto text-[10px] font-mono text-[#0088ff]/40 font-black">{filteredSignals.length} DATA</span>
                        </div>
                    </div>

                    {/* Scrollable Event List */}
                    <div
                        className="flex-1 overflow-y-auto"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "#0088ff44 transparent" }}
                    >
                        {filteredSignals.length > 0 ? filteredSignals.map((post, idx) => {
                            const tagStyle = TAG_COLORS[post.aiTag ?? "default"] ?? TAG_COLORS.default;
                            const title = deduplicateTitle(post.aiTitle) || post.plainText?.slice(0, 120);
                            return (
                                <button
                                    key={post.id + idx}
                                    onClick={() => post.location && handleFlyTo(post.location.lat, post.location.lng)}
                                    className="w-full text-left px-5 py-4 border-b border-white/[0.04] border-l-4 border-l-transparent hover:border-l-[#0088ff] hover:bg-[#0088ff]/[0.03] transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-[0_0_8px_rgba(0,136,255,0.2)]"
                                                style={{ background: tagStyle.bg, color: tagStyle.text, border: `1px solid ${tagStyle.text}33` }}
                                            >
                                                {post.aiTag || "Signal"}
                                            </span>
                                            <span className="text-[9px] font-mono text-[#0088ff]/40 font-bold uppercase tracking-widest">R{Math.min(idx + 101, 999)}</span>
                                        </div>
                                        <span className="text-[9px] text-foreground/30 font-mono italic">{getTimeAgo(post.date)}</span>
                                    </div>

                                    <p className="text-[12.5px] font-bold text-foreground/85 group-hover:text-foreground leading-relaxed line-clamp-3 transition-colors mb-2">
                                        {title}
                                    </p>

                                    {post.location && (
                                        <div className="flex items-center gap-2 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <div className="w-1.5 h-1.5 bg-[#0088ff] rounded-none shadow-[0_0_5px_#0088ff]" />
                                            <span className="text-[9px] font-black text-[#0088ff] uppercase tracking-widest">{post.location.name} Intelligence</span>
                                        </div>
                                    )}
                                </button>
                            );
                        }) : (
                            <div className="p-10 text-center flex flex-col items-center gap-4 opacity-30 mt-10">
                                <div className="w-12 h-12 border-2 border-dashed border-[#0088ff] rounded-none animate-spin" />
                                <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Intercepting Feed...</span>
                            </div>
                        )}
                    </div>
                </aside>
                {/* ── GLOBE / MAP ── */}
                <main className="flex-1 relative overflow-hidden bg-[#050508]">
                    {isClient && (
                        <GlobeMap
                            signals={filteredSignals}
                            onFlyTo={handleFlyTo}
                            targetLat={targetLat}
                            targetLng={targetLng}
                        />
                    )}

                    {/* Vignette Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(5,5,8,0.7)_100%)]" />
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
