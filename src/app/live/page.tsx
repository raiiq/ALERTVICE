"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { deduplicateTitle } from "../components/MediaDisplay";
import { useLanguage } from "../context/LanguageContext";
import { extractFlags } from "../../utils/flags";
import { motion } from "framer-motion";

interface NewsPost {
    id: string;
    plainText: string;
    date: string;
    aiTitle: string | null;
    aiSummary?: string | null;
    aiTag?: string | null;
    location?: { name: string; country: string } | null;
}

// ALERT RADAR: COMPREHENSIVE PAN-MIDDLE EAST SECTORS (TEXT-ONLY)
const REGIONAL_SECTORS = [
    { name: "Baghdad", ar: "بغداد", country: "Iraq" },
    { name: "Tehran", ar: "طهران", country: "Iran" },
    { name: "Ankara", ar: "أنقرة", country: "Turkey" },
    { name: "Cairo", ar: "القاهرة", country: "Egypt" },
    { name: "Damascus", ar: "دمشق", country: "Syria" },
    { name: "Beirut", ar: "بيروت", country: "Lebanon" },
    { name: "Amman", ar: "عمان", country: "Jordan" },
    { name: "Jerusalem", ar: "القدس", country: "Israel" },
    { name: "Riyadh", ar: "الرياض", country: "Saudi Arabia" },
    { name: "Dubai", ar: "دبي", country: "UAE" }
];

// ─────────────────────────────────────────
export default function MonitorPage() {
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [filteredSignals, setFilteredSignals] = useState<NewsPost[]>([]);
    const [timeRange, setTimeRange] = useState<"6H" | "24H">("24H");
    const [activeTab, setActiveTab] = useState<"FEED" | "LIVE" | "REPORTS">("FEED");
    const { lang, isAr } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchSignals = async (currentLang = lang) => {
            try {
                // Tactical Timestamp to skip cache
                const res = await fetch(`/api/news?lang=${currentLang}&limit=100&type=signal&t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    const posts = (data.posts || []) as any[];
                    // Attach sector intelligence
                    const enriched = posts.map((p: any) => {
                        const text = ((p.aiTitle || "") + " " + (p.plainText || "")).toLowerCase();
                        const location = REGIONAL_SECTORS.find((c: any) =>
                            text.includes(c.name.toLowerCase()) || text.includes(c.ar)
                        );
                        return { ...p, location: location || null };
                    });
                    setSignals(enriched);
                }
            } catch (e) { console.error("RADAR ERROR:", e); }
        };
        fetchSignals(lang);
        const t = setInterval(() => fetchSignals(lang), 30000); // Efficient polling
        return () => clearInterval(t);
    }, [lang]);

    // Intelligence Filtering Logic
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
                (s.location?.name || "").toLowerCase().includes(searchLower);

            return matchesTime && matchesSearch;
        });
        setFilteredSignals(filtered);
    }, [signals, timeRange, searchQuery]);

    const getPostId = (id: string) => id.split("/").pop() || "";

    return (
        <div
            className="fixed inset-0 text-foreground flex flex-col overflow-hidden"
            style={{ background: "#050508", fontFamily: "var(--font-condensed, 'Franklin Gothic Medium', Arial, sans-serif)" }}
        >
            {/* ── RADAR-SPECIFIC BAR ── */}
            <header className="h-auto min-h-10 py-2 lg:py-0 border-b border-white/[0.08] bg-[#09090c]/80 backdrop-blur-md flex flex-col lg:flex-row items-center gap-4 px-4 shrink-0 z-[800] shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                {/* Search */}
                <div className="relative group w-full lg:w-48">
                    <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#0088ff]/40 pointer-events-none group-focus-within:text-[#0088ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Scanning radar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-foreground/5 text-foreground/70 placeholder:text-[#0088ff]/20 text-[10px] py-1 pl-9 pr-4 rounded-none w-full outline-none border border-border-color/50 focus:border-[#0088ff]/40 transition-all font-black uppercase tracking-widest cursor-text"
                    />
                </div>

                {/* Ticker - Tactical stream */}
                <div className="hidden sm:flex flex-1 overflow-hidden h-full items-center mx-6">
                    <div className="whitespace-nowrap overflow-hidden h-full flex items-center">
                        <div className="inline-flex gap-10 items-center animate-marquee text-[10px] font-bold text-[#0088ff]/50 tracking-widest uppercase">
                            {[...filteredSignals.slice(0, 20), ...filteredSignals.slice(0, 20), ...filteredSignals.slice(0, 20)].map((s, i) => (
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
                    <div className="flex items-center gap-2 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-none px-4 py-1.5 ">
                        <span className="w-2 h-2 bg-[#00ff88] rounded-none shadow-[0_0_10px_#00ff88] animate-pulse" />
                        <span className="text-[10px] font-black text-[#00ff88] tracking-[0.2em] uppercase">Tactical Ready</span>
                    </div>
                </div>
            </header>

            {/* ── MAIN BODY ── */}
            <div className="flex-1 flex overflow-hidden">
                <main className="w-full bg-[#09090c] flex flex-col z-50">
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
                            <span className="ml-auto text-[10px] font-mono text-[#0088ff]/40 font-black">{filteredSignals.length} CAPTURED</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-10" style={{ scrollbarWidth: "thin", scrollbarColor: "#0088ff44 transparent" }}>
                        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 py-4">
                            {filteredSignals.length > 0 ? filteredSignals.map((p, idx) => {
                                const title = deduplicateTitle(p.aiTitle) || p.plainText?.slice(0, 120);
                                const flags = extractFlags((p.plainText || '') + ' ' + title);
                                const isUrgent = (title + (p.plainText || "")).toLowerCase().includes("urgent") || 
                                           (title + (p.plainText || "")).toLowerCase().includes("عاجل") ||
                                           (title + (p.plainText || "")).toLowerCase().includes("breaking");

                                return (
                                    <motion.div 
                                        key={p.id + idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Link 
                                            href={`/news/${getPostId(p.id)}`}
                                            className={`w-full text-left px-5 py-6 border border-white/[0.04] flex flex-col gap-3 relative overflow-hidden group hover:bg-white/[0.02] transition-colors ${isUrgent ? 'border-red-500/30 bg-red-500/5' : ''}`}
                                        >
                                            <div className={`flex justify-between items-center ${isAr ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-1.5 h-1.5 bg-[#0088ff] rounded-none shadow-[0_0_8px_#0088ff] animate-pulse" />
                                                    <span className="text-[11px] font-bold text-[#0088ff]/60 font-mono tracking-widest" suppressHydrationWarning>
                                                        {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold font-mono uppercase text-foreground/20">ID-{getPostId(p.id).slice(-4)}</span>
                                            </div>

                                            <h4 className={`text-[16px] font-bold text-foreground/80 group-hover:text-[#0088ff] leading-[1.7] transition-all duration-300 ${isAr ? 'text-right' : 'text-left'}`}>
                                                {flags.length > 0 && (
                                                    <div className={`inline-flex gap-1 items-center mb-1 ${isAr ? 'ml-2' : 'mr-2'}`}>
                                                        {flags.map((flag, i) => (
                                                            <div key={i} className="flex items-center justify-center w-[20px] h-[14px] rounded-[1px] overflow-hidden border border-white/20 shadow-sm shrink-0 bg-white/5">
                                                                <img src={`https://flagcdn.com/w20/${flag}.png`} alt={flag} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {title}
                                            </h4>

                                            {p.aiSummary && p.aiSummary !== title && (
                                                <p className={`text-[14px] text-foreground/40 mt-1 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-500 ${isAr ? 'text-right' : 'text-left'}`}>
                                                    {p.aiSummary}
                                                </p>
                                            )}

                                            {p.location && (
                                                <div className={`flex items-center gap-2 mt-2 opacity-100 ${isAr ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-2 h-[1px] bg-[#0088ff]/30" />
                                                    <span className="text-[9px] font-black text-[#0088ff]/40 uppercase tracking-[0.2em]">SECTOR: {p.location.name}</span>
                                                </div>
                                            )}
                                        </Link>
                                    </motion.div>
                                );
                            }) : (
                                <div className="col-span-full p-20 text-center flex flex-col items-center gap-4 opacity-30 mt-10">
                                    <div className="w-12 h-12 border-2 border-dashed border-[#0088ff] rounded-none animate-spin" />
                                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Scanning Tactical Frequency...</span>
                                </div>
                            )}
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
