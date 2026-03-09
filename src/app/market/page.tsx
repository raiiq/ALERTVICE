"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import MarketChart from "../components/MarketChart";

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
}

export default function MarketDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [lang, setLang] = useState("en");
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
        const stored = localStorage.getItem("newsLang") || "en";
        setLang(stored);
    }, []); // Run once on mount to set initial mounted state and language

    useEffect(() => {
        fetchData(timeframe);
        const interval = setInterval(() => fetchData(timeframe), 4000); // Update every 4s
        return () => clearInterval(interval);
    }, [lang, timeframe]); // Refetch and reset interval if language changes

    if (!mounted) return null;

    const isAr = lang === 'ar';
    const t = {
        en: {
            title: "Market Intelligence",
            subtitle: "Strategic Economic Monitoring",
            isx: "Iraq Stock Exchange",
            oil: "Energy Benchmarks",
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
                className="relative group p-6 rounded-[2rem] bg-[#0a0a0b]/60 backdrop-blur-3xl border border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden"
            >
                {/* Header Row: Title & Action Buttons */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] text-white/20`}>
                                {item.symbol} Futures
                            </h3>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        </div>
                        <h2 className={`text-2xl font-black text-white group-hover:text-primary transition-colors flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                            {isAr && item.symbol === 'ISX60' ? "مؤشر العراق 60" : item.name}
                            <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`text-[12px] font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                                {isPositive ? '▲' : '▼'} {item.price}
                            </motion.span>
                        </h2>

                        <button className="flex items-center gap-2 px-3 py-1 mt-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-primary hover:border-primary/30 transition-all w-fit">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                            Analyze chart
                        </button>
                    </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex gap-2 mb-4 border-b border-white/5 pb-4">
                    {['5h', '24h', '5d', '10d'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${timeframe === tf ? 'bg-primary text-black' : 'text-white/20 hover:text-white/60'}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>

                {/* Main Price & Change Status */}
                <div className="flex justify-between items-baseline mb-6">
                    <div className={`flex items-baseline gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <motion.span
                            animate={{ opacity: [0.8, 1] }}
                            className="text-5xl font-black text-white tracking-tighter"
                        >
                            {item.price}
                        </motion.span>
                        <span className="text-[11px] font-black text-white/30 uppercase tracking-widest">USD</span>
                    </div>
                    <div className={`flex items-baseline gap-2 font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span className="text-base font-bold">{isPositive ? '+' : ''}{item.change}</span>
                        <span className="text-[13px] font-black opacity-80">({isPositive ? '+' : ''}{item.changePercent}%)</span>
                    </div>
                </div>

                {/* Technical Chart */}
                <div className="h-[240px] mb-8">
                    <MarketChart data={item.history || []} color={color} height={240} />
                </div>

                {/* Performance Metrics Row */}
                <div className="grid grid-cols-4 gap-4 mb-8 pt-6 border-t border-white/5">
                    {[
                        { label: '24h Change', val: '+24.6%' },
                        { label: 'Weekly', val: '+49.3%' },
                        { label: 'Monthly', val: '+68.1%' },
                        { label: 'Quarterly', val: '+87.4%' }
                    ].map((m, i) => (
                        <div key={i} className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-tight">{m.label}</span>
                            <span className="text-[12px] font-black text-emerald-400 font-mono">{m.val}</span>
                        </div>
                    ))}
                </div>

                {/* Footer Status */}
                <div className={`flex justify-between items-center pt-5 border-t border-white/5 ${isAr ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">
                            Source: <span className="text-white/70">XTB.GLOB_FIN</span>
                        </span>
                    </div>
                    <span className="text-[11px] font-black font-mono text-white/20 uppercase">
                        Ref: {new Date(item.lastUpdated).toLocaleTimeString([], { hour12: false })}
                    </span>
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`min-h-screen bg-background text-foreground tracking-wide flex flex-col font-cairo`} dir={isAr ? "rtl" : "ltr"}>
            <main className="flex-grow w-full px-6 lg:px-12 py-12 max-w-[1800px] mx-auto mt-20">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 px-4">
                    <div className="flex flex-col gap-2">
                        <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping shadow-[0_0_10px_#38bdf8]" />
                            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
                                {t.title}
                            </h1>
                        </div>
                        <p className="text-sm text-white/30 font-black uppercase tracking-[0.4em]">
                            {t.subtitle}
                        </p>
                    </div>

                    <Link
                        href="/"
                        className={`flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-primary hover:border-primary/30 transition-all ${isAr ? 'flex-row-reverse' : ''}`}
                    >
                        <svg className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        {isAr ? 'العودة للموجز' : 'Back to Intel Feed'}
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-20">
                        <div className="w-12 h-12 border border-primary/20 rounded-full flex items-center justify-center animate-spin-slow mb-6">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.loading}</span>
                    </div>
                ) : data && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <MarketCard item={data.isx60} color="#38bdf8" />
                            <MarketCard item={data.brent} color="#fbbf24" />
                            <MarketCard item={data.wti} color="#f87171" />
                        </div>

                        {/* Historical Activity Log */}
                        <div className="mt-20">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <h2 className="text-xl font-black text-white uppercase tracking-widest">
                                    {isAr ? 'سجل النشاط المباشر' : 'Live Activity Log'}
                                </h2>
                                <div className="flex-grow h-px bg-white/5" />
                            </div>

                            <div className="overflow-hidden rounded-[2rem] bg-[#0a0a0b]/40 backdrop-blur-3xl border border-white/5">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="px-6 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{isAr ? 'الأداة' : 'Instrument'}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{isAr ? 'السعر' : 'Price'}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{isAr ? 'الوقت' : 'Time'}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">{isAr ? 'الحالة' : 'Status'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence mode="popLayout">
                                            {[data.isx60, data.brent, data.wti].map((item, idx) => (
                                                <motion.tr
                                                    key={`${item.symbol}-${item.lastUpdated}`}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-white group-hover:text-primary transition-colors">{item.name}</span>
                                                            <span className="text-[9px] font-mono text-white/20">{item.symbol}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-bold text-white text-[12px]">
                                                        {item.price} <span className="text-[10px] text-white/20 font-black">USD</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-white/40 text-[11px]">
                                                        {new Date(item.lastUpdated).toLocaleTimeString([], { hour12: false })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                                            Synced
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Tactical Footer Note */}
                <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
                    <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <div className="w-2 h-2 border border-white/20 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Source: Official Oilprice.com Data link</span>
                    </div>
                    <div className="text-[10px] font-mono tracking-widest uppercase">
                        Secure Database Uplink // {new Date().toLocaleDateString()} // {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </main>

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[160px] rounded-full opacity-50" />
                <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-900/10 blur-[160px] rounded-full opacity-50" />
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
