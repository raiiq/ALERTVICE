"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import MarketChart from "../components/MarketChart";
import { useLanguage } from "../context/LanguageContext";

interface MarketData {
    symbol: string;
    name: string;
    price: string;
    change: string;
    changePercent: string;
    lastUpdated: string;
    history: { time: string; value: number }[];
}

interface DashboardData {
    isx60: MarketData;
    brent: MarketData;
    wti: MarketData;
    murban: MarketData;
    natgas: MarketData;
    gold: MarketData;
    silver: MarketData;
}

export default function MarketDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const { lang, isAr, toggleLang } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('5h');

    const fetchData = async (tf: string = timeframe) => {
        try {
            const res = await fetch(`/api/market?timeframe=${tf}&t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setLoading(false);
            }
        } catch (e) {
            console.error("Failed to fetch market data", e);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []); // Run once on mount to set initial mounted state

    useEffect(() => {
        fetchData(timeframe);
        const interval = setInterval(() => fetchData(timeframe), 4000); // Update every 4s
        return () => clearInterval(interval);
    }, [lang, timeframe]); // Refetch and reset interval if language changes


    if (!mounted) return null;
    const t = {
        en: {
            title: "Market Intelligence",
            subtitle: "Strategic Economic Monitoring",
            isx: "Iraq Stock Exchange",
            oil: "Energy Benchmarks",
            metals: "Precious Metals",
            price: "Live Value",
            change: "24h Delta",
            status: "Operational",
            lastUpdate: "Last Sync",
            loading: "Establishing link..."
        },
        ar: {
            title: "استخبارات السوق",
            subtitle: "المراقبة الاقتصادية الاستراتيجية",
            isx: "بورصة العراق",
            oil: "مؤشرات الطاقة",
            metals: "المعادن الثمينة",
            price: "القيمة الحالية",
            change: "التغير ٢٤ ساعة",
            status: "قيد التشغيل",
            lastUpdate: "آخر مزامنة",
            loading: "جاري الاتصال..."
        }
    }[lang as 'en' | 'ar'];

    const MarketCard = ({ item, color }: { item: MarketData; color: string }) => {
        const isPositive = parseFloat(item.change) >= 0;

        return (
            <motion.div
                className="relative group p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-[#0a0a0b]/60 backdrop-blur-3xl border border-border-color/50 hover:border-primary/20 transition-all duration-500 overflow-hidden"
            >
                {/* Header Row: Title & Action Buttons */}
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3 className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20`}>
                                {item.symbol} Futures
                            </h3>
                            <div className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        </div>
                        <h2 className={`text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                            {isAr && item.symbol === 'ISX60' ? "مؤشر العراق 60" :
                                (isAr && item.symbol === 'MURBAN' ? "خام مربان" :
                                    (isAr && item.symbol === 'NATGAS' ? "الغاز الطبيعي" :
                                        (isAr && item.symbol === 'GOLD' ? "الذهب" :
                                            (isAr && item.symbol === 'SILVER' ? "الفضة" :
                                                item.name))))}
                            <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`text-[11px] sm:text-[12px] font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                                {isPositive ? '▲' : '▼'} {item.price}
                            </motion.span>
                        </h2>

                        <button className="flex items-center gap-2 px-3 py-1 mt-2 rounded-none bg-foreground/5 border border-border-color text-[9px] font-black uppercase tracking-widest text-foreground/40 hover:text-primary hover:border-primary/30 transition-all w-fit">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                            {isAr ? 'تحليل الرسم' : 'Analyze chart'}
                        </button>
                    </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex gap-1.5 sm:gap-2 mb-4 border-b border-border-color/50 pb-4 overflow-x-auto no-scrollbar">
                    {['5h', '24h', '5d', '10d'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded-none text-[9px] sm:text-[10px] font-black uppercase transition-all whitespace-nowrap ${timeframe === tf ? 'bg-primary text-primary-foreground' : 'text-foreground/20 hover:text-foreground/60'}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>

                {/* Main Price & Change Status */}
                <div className="flex justify-between items-baseline mb-4 sm:mb-6">
                    <div className={`flex items-baseline gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <motion.span
                            animate={{ opacity: [0.8, 1] }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tighter"
                        >
                            {item.price}
                        </motion.span>
                        <span className="text-[10px] sm:text-[11px] font-black text-foreground/30 uppercase tracking-widest">{item.symbol === 'GOLD' || item.symbol === 'SILVER' ? 'USD/oz' : 'USD'}</span>
                    </div>
                    <div className={`flex items-baseline gap-1.5 sm:gap-2 font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span className="text-sm sm:text-base font-bold">{isPositive ? '+' : ''}{item.change}</span>
                        <span className="text-[12px] sm:text-[13px] font-black opacity-80">({isPositive ? '+' : ''}{item.changePercent}%)</span>
                    </div>
                </div>

                {/* Technical Chart */}
                <div className="h-[200px] sm:h-[240px] mb-6 sm:mb-8">
                    <MarketChart data={item.history || []} color={color} height={200} />
                </div>

                {/* Performance Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 sm:mb-8 pt-6 border-t border-border-color/50">
                    {[
                        { label: '24h Change', val: '+24.6%' },
                        { label: 'Weekly', val: '+49.3%' },
                        { label: 'Monthly', val: '+68.1%' },
                        { label: 'Quarterly', val: '+87.4%' }
                    ].map((m, i) => (
                        <div key={i} className="flex flex-col items-start gap-1">
                            <span className="text-[9px] sm:text-[10px] font-black text-foreground/20 uppercase tracking-tight">{m.label}</span>
                            <span className="text-[11px] sm:text-[12px] font-black text-emerald-400 font-mono">{m.val}</span>
                        </div>
                    ))}
                </div>

                {/* Footer Status */}
                <div className={`flex justify-between items-center pt-5 border-t border-border-color/50 ${isAr ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-none bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <span className="text-[9px] sm:text-[11px] font-black text-foreground/40 uppercase tracking-widest leading-none">
                            Source: <span className="text-foreground/70">XTB.GLOB_FIN</span>
                        </span>
                    </div>
                    <span className="text-[9px] sm:text-[11px] font-black font-mono text-foreground/20 uppercase">
                        Ref: {new Date(item.lastUpdated).toLocaleTimeString([], { hour12: false })}
                    </span>
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`min-h-screen bg-surfaceackground text-foreground tracking-wide flex flex-col`} dir={isAr ? "rtl" : "ltr"}>
            {/* ── MAIN GLOBAL NAVBAR IS NOW IN ROOT LAYOUT ── */}
            <main className="flex-grow w-full px-6 lg:px-12 py-12 max-w-[1600px] mx-auto mt-20">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 px-4">
                    <div className="flex flex-col gap-2">
                        <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                            <div className="w-1.5 h-1.5 bg-primary rounded-none animate-ping shadow-[0_0_10px_#38bdf8]" />
                            <h1 className="text-4xl lg:text-5xl font-black text-foreground uppercase tracking-tight">
                                {t.title}
                            </h1>
                        </div>
                        <p className="text-sm text-foreground/30 font-black uppercase tracking-[0.4em]">
                            {t.subtitle}
                        </p>
                    </div>

                    <Link
                        href="/"
                        className={`flex items-center gap-3 px-6 py-3 rounded-none bg-foreground/5 border border-border-color text-[11px] font-black uppercase tracking-widest text-foreground/60 hover:text-primary hover:border-primary/30 transition-all ${isAr ? 'flex-row-reverse' : ''}`}
                    >
                        <svg className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        {isAr ? 'العودة للموجز' : 'Back to Intel Feed'}
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-20">
                        <div className="w-12 h-12 border border-primary/20 rounded-none flex items-center justify-center animate-spin-slow mb-6">
                            <div className="w-2 h-2 bg-primary rounded-none" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.loading}</span>
                    </div>
                ) : data && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <MarketCard item={data.gold} color="#FFD700" />
                            <MarketCard item={data.silver} color="#C0C0C0" />
                            <MarketCard item={data.natgas} color="#00ff88" />
                            <MarketCard item={data.murban} color="#10b981" />
                            <MarketCard item={data.brent} color="#fbbf24" />
                            <MarketCard item={data.wti} color="#f87171" />
                            <div className="lg:col-span-2">
                                <MarketCard item={data.isx60} color="#38bdf8" />
                            </div>
                        </div>

                        {/* Redesigned Live Activity Log - Stable & Dynamic Terminal Feed */}
                        <div className="mt-24">
                            <div className="flex items-center justify-between mb-8 px-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-none animate-pulse shadow-[0_0_10px_#10b981]" />
                                    <h2 className="text-xl font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                                        {isAr ? 'راصد النشاط الحي' : 'Live Activity Radar'}
                                        <span className="text-[10px] py-1 px-2 rounded bg-foreground/5 border border-border-color text-foreground/30 font-mono">
                                            v2.4.0_STABLE
                                        </span>
                                    </h2>
                                </div>
                                <div className="hidden md:flex items-center gap-6 text-[9px] font-black font-mono text-foreground/20 uppercase tracking-widest">
                                    <span>Sector: Global_Energy</span>
                                    <span>Signal: Clear</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[data.gold, data.silver, data.natgas, data.murban, data.brent, data.wti, data.isx60].map((item, idx) => {
                                    const isPos = parseFloat(item.change) >= 0;
                                    return (
                                        <div
                                            key={item.symbol}
                                            className="relative group p-6 rounded-[1.5rem] bg-[#0a0a0b]/40 backdrop-blur-3xl border border-border-color/50 hover:border-primary/20 transition-all duration-300"
                                        >
                                            {/* Status Header */}
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1 h-1 rounded-none ${isPos ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}`} />
                                                    <span className="text-[9px] font-black font-mono text-foreground/30 uppercase tracking-widest">
                                                        {item.symbol}_NODE
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-black font-mono text-foreground/10">
                                                    0x{Math.floor(Math.random() * 1000).toString(16).toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Name & Price */}
                                            <div className={`flex justify-between items-end ${isAr ? 'flex-row-reverse' : ''}`}>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-black text-foreground group-hover:text-primary transition-colors">
                                                        {isAr && item.symbol === 'ISX60' ? "مؤشر العراق 60" :
                                                            (isAr && item.symbol === 'MURBAN' ? "خام مربان" :
                                                                (isAr && item.symbol === 'NATGAS' ? "الغاز الطبيعي" :
                                                                    (isAr && item.symbol === 'GOLD' ? "الذهب" :
                                                                        (isAr && item.symbol === 'SILVER' ? "الفضة" :
                                                                            item.name))))}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-foreground/20 font-mono">TYPE: {item.symbol === 'GOLD' || item.symbol === 'SILVER' ? 'PRECIOUS_METAL' : 'FUTURES_MARKET'}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-black text-foreground font-mono leading-none">
                                                        {item.price}
                                                    </span>
                                                    <span className={`text-[10px] font-black font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {isPos ? '+' : ''}{item.changePercent}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Pulse Bar */}
                                            <div className="mt-4 h-[2px] w-full bg-foreground/5 rounded-none overflow-hidden">
                                                <motion.div
                                                    className={`h-full ${isPos ? 'bg-emerald-500/50' : 'bg-red-500/50'}`}
                                                    initial={false}
                                                    animate={{ width: ['20%', '80%', '40%', '90%', '60%'] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                />
                                            </div>

                                            {/* Footer Trace */}
                                            <div className={`mt-4 flex justify-between items-center text-[8px] font-black font-mono text-foreground/10 uppercase tracking-[0.2em] ${isAr ? 'flex-row-reverse' : ''}`}>
                                                <span>Trace: {new Date(item.lastUpdated).toLocaleTimeString([], { hour12: false })}</span>
                                                <span>Status: Optimized</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Auxiliary System Card */}
                                <div className="relative group p-6 rounded-[1.5rem] bg-primary/5 backdrop-blur-3xl border border-primary/20 flex flex-col justify-center items-center text-center gap-3">
                                    <div className="w-10 h-10 rounded-none border border-primary/20 flex items-center justify-center animate-spin-slow">
                                        <div className="w-2 h-2 bg-primary rounded-none shadow-[0_0_10px_#38bdf8]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">System Synchronized</span>
                                        <span className="text-[8px] font-bold text-primary/40 uppercase mt-1">Global News Signal Locked</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Tactical Footer Note */}
                <div className="mt-20 pt-8 border-t border-border-color/50 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
                    <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <div className="w-2 h-2 border border-white/20 rounded-none" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Source: Oilprice.com & Gold-API.com Data Link</span>
                    </div>
                    <div className="text-[10px] font-mono tracking-widest uppercase">
                        Secure Database Uplink // {new Date().toLocaleDateString()} // {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </main>

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[160px] rounded-none opacity-50" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-surfacelue-900/10 blur-[160px] rounded-none opacity-50" />
            </div>

            <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
        </div>
    );
}
