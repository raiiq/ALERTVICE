"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { extractFlags } from "@/utils/flags";

interface NewsPost {
    id: string;
    plainText: string;
    date: string;
    aiTitle: string | null;
    aiSummary?: string | null;
    isUrgent?: boolean;
}

interface MarketDataPoint {
    symbol: string;
    price: string;
    change: string;
    changePercent: string;
}

interface DashboardData {
    isx60: MarketDataPoint;
    brent: MarketDataPoint;
    wti: MarketDataPoint;
    murban: MarketDataPoint;
    natgas: MarketDataPoint;
    gold: MarketDataPoint;
    silver: MarketDataPoint;
}

export default function GlobalSignals() {
    const { lang, isAr } = useLanguage();
    const pathname = usePathname();
    const [signals, setSignals] = useState<NewsPost[]>([]);
    const [urgentSignals, setUrgentSignals] = useState<NewsPost[]>([]);
    const [marketData, setMarketData] = useState<DashboardData | null>(null);

    useEffect(() => {
        const fetchAllSignals = async () => {
            try {
                // Fetch regular signals for ticker
                const resSignals = await fetch(`/api/news?lang=${lang}&limit=10&type=signal&t=${Date.now()}`);
                if (resSignals.ok) {
                    const data = await resSignals.json();
                    setSignals(data.posts || []);
                }

                // Fetch urgent signals for dispatch bar
                const resUrgent = await fetch(`/api/news?lang=${lang}&limit=5&urgent=true&t=${Date.now()}`);
                if (resUrgent.ok) {
                    const data = await resUrgent.json();
                    setUrgentSignals(data.posts || []);
                }

                // Fetch real-time market dashboard data
                const resMarket = await fetch(`/api/market?timeframe=5h&t=${Date.now()}`);
                if (resMarket.ok) {
                    const mdata = await resMarket.json();
                    setMarketData(mdata);
                }
            } catch (e) {
                console.error("Failed to fetch global signals or market info:", e);
            }
        };

        fetchAllSignals();
        const interval = setInterval(fetchAllSignals, 1000); // 1s refresh
        return () => clearInterval(interval);
    }, [lang]);

    const getPostId = (fullId: string) => fullId.split('/').pop();
    const deduplicateTitle = (title: string | null) => title?.replace(/^(ALERT|URGENT|BREAKING):\s*/i, '') || '';

    const repeatArray = (arr: any[], min: number) => {
        if (arr.length === 0) return [];
        let newArr = [...arr];
        while (newArr.length < min) {
            newArr = [...newArr, ...arr];
        }
        return newArr;
    };

    if (pathname === '/iran-cooldown') return null;

    return (
        <div className={`ticker-wrapper border-b border-white/5 mb-0 relative z-[100] sticky top-0 lg:top-16 ${pathname === '/' ? 'lg:ml-[600px] lg:w-[calc(100%-600px)]' : 'lg:ml-0 lg:w-full'}`}>
            {/* 0. GLOBAL ALERT BAR (TOP OF ALL BADGES) */}
            <div className="flex justify-center bg-black/40 border-b border-white/5 py-1">
                <Link 
                    href="/iran-cooldown"
                    className="bg-red-600 text-white px-4 py-1 text-[10px] font-black uppercase flex items-center gap-2 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.6)] border border-red-400/50 rounded-sm"
                >
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    {isAr ? 'هدف إيران: العد التنازلي نشط' : 'IRAN TARGETING: COOLDOWN ACTIVE'}
                </Link>
            </div>

            {/* 1. INTELLIGENCE TICKER (RADAR FLASH) */}
            <div className="intelligence-ticker">
                <div className="ticker-badge">
                    <div className="ticker-badge-dot mr-3"></div>
                    <span className="text-primary-foreground font-black text-[13px] tracking-[0.15em] uppercase">{isAr ? 'رادار' : 'RADAR FLASH'}</span>
                </div>
                <div className="ticker-content relative overflow-hidden flex-1 h-full flex items-center" dir="ltr">
                    <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} flex items-center gap-32`}>
                        {signals.length > 0 ? (
                            repeatArray(signals, 20).map((p, idx) => {
                                const flags = extractFlags((p.plainText || '') + ' ' + (p.aiTitle || ''));
                                return (
                                <Link key={`ticker-${idx}`} href={`/news/${getPostId(p.id)}`} className={`text-[10px] font-bold text-foreground/80 hover:text-primary transition-all uppercase whitespace-nowrap tracking-wider ${isAr ? 'flex-row-reverse' : ''}`}>
                                    <span className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className={`font-black text-primary border-b border-primary/20 flex items-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                                            {flags.length > 0 && (
                                                <div className="flex gap-1 items-center">
                                                    {flags.map((flag, i) => (
                                                        <div key={i} className="flex items-center justify-center w-[16px] h-[11px] rounded-[1px] overflow-hidden border border-white/20 shadow-sm shrink-0 bg-white/5">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={`https://flagcdn.com/w20/${flag}.png`} alt={flag} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <span style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '13px' } : {}}>{deduplicateTitle(p.aiTitle)}</span>
                                        </span>
                                        <span className="opacity-60" style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '12px' } : {}}>{p.aiSummary}</span>
                                    </span>
                                </Link>
                                );
                            })
                        ) : (
                            <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest px-10">
                                {isAr ? 'جارٍ مسح الترددات...' : 'SCANNING FREQUENCIES...'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. URGENT DISPATCH BAR */}
            <div className="urgent-dispatch-bar" dir={isAr ? 'rtl' : 'ltr'}>
                <div className="urgent-dispatch-label">
                    <span>{isAr ? 'عاجل' : 'URGENT'}</span>
                </div>
                <div className="urgent-dispatch-content relative overflow-hidden flex-1 h-full flex items-center" dir="ltr">
                    {urgentSignals.length > 0 ? (
                        <div className={`${isAr ? 'animate-urgent-marquee-rtl' : 'animate-urgent-marquee'} flex items-center gap-64`}>
                            {repeatArray(urgentSignals, 20).map((post, idx) => {
                                const flags = extractFlags((post.plainText || '') + ' ' + (post.aiTitle || ''));
                                return (
                                <Link key={`urgent-${idx}`} href={`/news/${getPostId(post.id)}`} className={`text-[14px] font-bold text-white hover:underline transition-all whitespace-nowrap tracking-wider flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                                    <span className="opacity-60 text-[10px] whitespace-nowrap">{new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                    {flags.length > 0 && (
                                        <div className="flex gap-1 items-center">
                                            {flags.map((flag, i) => (
                                                <div key={i} className="flex items-center justify-center w-5 h-[14px] rounded-[2px] overflow-hidden border border-white/20 shadow-sm shrink-0 bg-white/5">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={`https://flagcdn.com/w20/${flag}.png`} alt={flag} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <span style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '16px' } : {}}>{post.aiTitle || post.plainText?.slice(0, 100)}</span>
                                </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-center opacity-40">
                            <span className="text-[12px] font-monospace uppercase tracking-widest">{isAr ? 'لا توجد تنبيهات نشطة' : 'NO ACTIVE URGENT ALERTS'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. MARKET DISPATCH BAR (GREY/BLACK) */}
            {marketData && (
                <Link href="/market" className="market-dispatch-bar group" dir={isAr ? 'rtl' : 'ltr'}>
                    <div className="market-dispatch-label">
                        <span>{isAr ? 'بيانات السوق' : 'MARKET DATA'}</span>
                    </div>
                    <div className="market-dispatch-content relative overflow-hidden flex-1 h-full flex items-center" dir="ltr">
                        <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee'} flex items-center gap-12 px-6`}>
                            {repeatArray([...Array(1)], 10).map((_, i) => (
                                <div key={i} className={`flex items-center gap-12 ${isAr ? 'flex-row-reverse' : ''}`}>
                                    {/* ISX60 */}
                                    <div className={`flex items-center gap-2 shrink-0 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-foreground/50 font-black tracking-widest uppercase" style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '12px' } : {}}>{isAr ? 'مؤشر ISX 60' : 'ISX 60'}</span>
                                        <span className="text-foreground font-bold">{parseFloat(marketData.isx60.price || '0').toLocaleString()} <span className="text-[9px] text-foreground/40 font-normal ml-1">{isAr ? 'دينار' : 'IQD'}</span></span>
                                        <span className={`text-[10px] font-bold ${parseFloat(marketData.isx60.change || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {parseFloat(marketData.isx60.change || '0') >= 0 ? '+' : ''}{marketData.isx60.change} ({marketData.isx60.changePercent}%)
                                        </span>
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-3 bg-white/10 shrink-0"></div>
                                    {/* BRENT */}
                                    <div className={`flex items-center gap-2 shrink-0 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-foreground/50 font-black tracking-widest uppercase" style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '12px' } : {}}>{isAr ? 'برنت' : 'BRENT'}</span>
                                        <span className="text-foreground font-bold">${marketData.brent.price}</span>
                                        <span className={`text-[10px] font-bold ${parseFloat(marketData.brent.change || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {parseFloat(marketData.brent.change || '0') >= 0 ? '+' : ''}{marketData.brent.change} ({marketData.brent.changePercent}%)
                                        </span>
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-3 bg-white/10 shrink-0"></div>
                                    {/* MURBAN */}
                                    <div className={`flex items-center gap-2 shrink-0 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-foreground/50 font-black tracking-widest uppercase" style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '12px' } : {}}>{isAr ? 'مربان' : 'MURBAN'}</span>
                                        <span className="text-foreground font-bold">${marketData.murban.price}</span>
                                        <span className={`text-[10px] font-bold ${parseFloat(marketData.murban.change || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {parseFloat(marketData.murban.change || '0') >= 0 ? '+' : ''}{marketData.murban.change} ({marketData.murban.changePercent}%)
                                        </span>
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-3 bg-white/10 shrink-0"></div>
                                    {/* WTI */}
                                    <div className={`flex items-center gap-2 shrink-0 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-foreground/50 font-black tracking-widest uppercase" style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '12px' } : {}}>{isAr ? 'غرب تكساس' : 'WTI'}</span>
                                        <span className="text-foreground font-bold">${marketData.wti.price}</span>
                                        <span className={`text-[10px] font-bold ${parseFloat(marketData.wti.change || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {parseFloat(marketData.wti.change || '0') >= 0 ? '+' : ''}{marketData.wti.change} ({marketData.wti.changePercent}%)
                                        </span>
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-3 bg-white/10 shrink-0"></div>
                                    {/* NATGAS */}
                                    <div className={`flex items-center gap-2 shrink-0 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-foreground/50 font-black tracking-widest uppercase" style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '12px' } : {}}>{isAr ? 'الغاز الطبيعي' : 'NAT GAS'}</span>
                                        <span className="text-foreground font-bold">${marketData.natgas.price}</span>
                                        <span className={`text-[10px] font-bold ${parseFloat(marketData.natgas.change || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {parseFloat(marketData.natgas.change || '0') >= 0 ? '+' : ''}{marketData.natgas.change} ({marketData.natgas.changePercent}%)
                                        </span>
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-3 bg-white/10 shrink-0"></div>
                                    {/* GOLD */}
                                    <div className={`flex items-center gap-2 shrink-0 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-foreground/50 font-black tracking-widest uppercase" style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '12px' } : {}}>{isAr ? 'الذهب' : 'GOLD'}</span>
                                        <span className="text-foreground font-bold">${marketData.gold.price}</span>
                                        <span className={`text-[10px] font-bold ${parseFloat(marketData.gold.change || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {parseFloat(marketData.gold.change || '0') >= 0 ? '+' : ''}{marketData.gold.change} ({marketData.gold.changePercent}%)
                                        </span>
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-3 bg-white/10 shrink-0"></div>
                                    {/* SILVER */}
                                    <div className={`flex items-center gap-2 shrink-0 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-foreground/50 font-black tracking-widest uppercase" style={isAr ? { fontFamily: 'var(--font-arabic)', fontSize: '12px' } : {}}>{isAr ? 'الفضة' : 'SILVER'}</span>
                                        <span className="text-foreground font-bold">${marketData.silver.price}</span>
                                        <span className={`text-[10px] font-bold ${parseFloat(marketData.silver.change || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {parseFloat(marketData.silver.change || '0') >= 0 ? '+' : ''}{marketData.silver.change} ({marketData.silver.changePercent}%)
                                        </span>
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-3 bg-white/10 shrink-0 mr-8"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Link>
            )}
        </div>
    );
}
