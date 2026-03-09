"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DataPoint {
    time: string;
    value: number;
}

interface MarketChartProps {
    data: DataPoint[];
    color: string;
    height?: number;
}

export default function MarketChart({ data, color, height = 240 }: MarketChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (data.length < 2) return <div style={{ height }} className="w-full bg-white/5 animate-pulse rounded-2xl" />;

    const prices = data.map(d => d.value);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = (maxPrice - minPrice) || 1;
    const padding = priceRange * 0.1;

    const getX = (i: number) => (i / (data.length - 1)) * 100;
    const getY = (v: number) => 90 - ((v - (minPrice - padding)) / (priceRange + padding * 2)) * 80;

    // Smooth cubic bezier path
    const pathData = data.reduce((path, d, i) => {
        if (i === 0) return `M ${getX(0)},${getY(d.value)}`;
        const xPrev = getX(i - 1);
        const yPrev = getY(data[i - 1].value);
        const xCurr = getX(i);
        const yCurr = getY(d.value);
        const mx = (xPrev + xCurr) / 2;
        return `${path} C ${mx},${yPrev} ${mx},${yCurr} ${xCurr},${yCurr}`;
    }, "");

    const areaData = `${pathData} L ${getX(data.length - 1)},95 L ${getX(0)},95 Z`;

    // Detect peaks and valleys (local mins/maxes)
    const peaksAndValleys = useMemo(() => {
        const points: { index: number; type: 'peak' | 'valley' }[] = [];
        if (data.length < 3) return points;
        for (let i = 1; i < data.length - 1; i++) {
            const prev = data[i - 1].value;
            const curr = data[i].value;
            const next = data[i + 1].value;
            if (curr > prev && curr > next) points.push({ index: i, type: 'peak' });
            if (curr < prev && curr < next) points.push({ index: i, type: 'valley' });
        }
        return points;
    }, [data]);

    const currentPrice = data[data.length - 1].value;
    const currentY = getY(currentPrice);

    const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;
    const hoveredX = hoveredIndex !== null ? getX(hoveredIndex) : 0;
    const hoveredY = hoveredIndex !== null ? getY(data[hoveredIndex].value) : 0;

    return (
        <div className="relative w-full group/chart pt-2 pb-6" style={{ height }}>
            {/* Grid Lines */}
            <div className="absolute inset-x-0 top-2 bottom-6 flex flex-col justify-between pointer-events-none opacity-[0.04] z-0">
                {[0, 1, 2, 3].map(i => <div key={i} className="w-full h-px bg-white" />)}
            </div>

            {/* Y-Axis Labels (HTML Overlay) */}
            <div className="absolute right-1 top-2 bottom-6 w-14 flex flex-col justify-between items-end pointer-events-none z-10">
                <span className="text-[8px] sm:text-[9px] font-black font-mono text-white/15">{maxPrice.toFixed(2)}</span>
                <span className="text-[8px] sm:text-[9px] font-black font-mono text-white/15">{((maxPrice + minPrice) / 2).toFixed(2)}</span>
                <span className="text-[8px] sm:text-[9px] font-black font-mono text-white/15">{minPrice.toFixed(2)}</span>
            </div>

            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
                onMouseLeave={() => setHoveredIndex(null)}
            >
                <defs>
                    {/* Area gradient */}
                    <linearGradient id={`area-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                        <stop offset="60%" stopColor={color} stopOpacity="0.04" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    {/* Line gradient (left-to-right fade in) */}
                    <linearGradient id={`line-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="15%" stopColor={color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={color} stopOpacity="1" />
                    </linearGradient>
                    {/* Glow filter */}
                    <filter id={`glow-${color.replace('#', '')}`} x="-20%" y="-40%" width="140%" height="180%">
                        <feGaussianBlur stdDeviation="0.6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {/* Stronger glow for the dot */}
                    <filter id={`dot-glow-${color.replace('#', '')}`} x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="1.2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Current Price Tracking Line */}
                <line
                    x1="0" x2="100" y1={currentY} y2={currentY}
                    stroke="white" strokeWidth="0.2" strokeOpacity="0.06"
                    strokeDasharray="1,1.5"
                />

                {/* Area Fill */}
                <path
                    d={areaData}
                    fill={`url(#area-grad-${color.replace('#', '')})`}
                />

                {/* Shadow Line (creates depth) */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.08"
                />

                {/* Main Line - Gradient Stroke */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={`url(#line-grad-${color.replace('#', '')})`}
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: `url(#glow-${color.replace('#', '')})` }}
                />

                {/* End Point Dot (current price) */}
                <circle
                    cx={getX(data.length - 1)}
                    cy={currentY}
                    r="1.2"
                    fill={color}
                    style={{ filter: `url(#dot-glow-${color.replace('#', '')})` }}
                />

                {/* Hover Crosshair */}
                {hoveredIndex !== null && (
                    <g>
                        <line
                            x1={hoveredX} x2={hoveredX} y1={5} y2={95}
                            stroke="white" strokeWidth="0.2" strokeOpacity="0.15"
                            strokeDasharray="0.8,0.8"
                        />
                        <line
                            x1={0} x2={100} y1={hoveredY} y2={hoveredY}
                            stroke="white" strokeWidth="0.15" strokeOpacity="0.08"
                            strokeDasharray="0.8,0.8"
                        />
                    </g>
                )}

                {/* Interaction Hitboxes */}
                {data.map((d, i) => (
                    <rect
                        key={i}
                        x={getX(i) - (50 / data.length)}
                        y={0}
                        width={100 / data.length}
                        height="100"
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(i)}
                        className="cursor-crosshair"
                    />
                ))}
            </svg>

            {/* Peak & Valley Dots (HTML overlay) */}
            {peaksAndValleys.map(({ index, type }) => {
                const xPct = getX(index);
                const yPct = getY(data[index].value);
                const isPeak = type === 'peak';
                return (
                    <div
                        key={`pv-${index}`}
                        className="absolute pointer-events-none z-10"
                        style={{
                            left: `${xPct}%`,
                            top: `calc(${yPct}% + 8px)`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {/* Outer ring */}
                        <div className={`w-[9px] h-[9px] rounded-full border ${isPeak ? 'border-emerald-400/30' : 'border-red-400/30'} flex items-center justify-center`}>
                            {/* Inner dot */}
                            <div className={`w-[4px] h-[4px] rounded-full ${isPeak ? 'bg-emerald-400/80' : 'bg-red-400/80'}`} />
                        </div>
                    </div>
                );
            })}

            {/* Hovered Dot (HTML overlay) */}
            {hoveredIndex !== null && (
                <div
                    className="absolute pointer-events-none z-20"
                    style={{
                        left: `${hoveredX}%`,
                        top: `calc(${hoveredY}% + 8px)`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="relative flex items-center justify-center">
                        {/* Outer glow ring */}
                        <div className="w-[16px] h-[16px] rounded-full absolute" style={{ border: `1.5px solid ${color}30`, boxShadow: `0 0 8px ${color}20` }} />
                        {/* Inner bright dot */}
                        <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                    </div>
                </div>
            )}

            {/* Current Price Tag (HTML overlay) */}
            <div
                className="absolute right-0 z-20 pointer-events-none"
                style={{ top: `calc(${currentY}% + 8px)`, transform: 'translateY(-50%)' }}
            >
                <div className="flex items-center">
                    <div className="h-px w-3 bg-white/15" />
                    <div className="bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        <span className="text-[9px] font-black font-mono text-black leading-none">
                            {currentPrice.toFixed(currentPrice < 10 ? 3 : 2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="absolute inset-x-0 bottom-0 flex justify-between pointer-events-none px-1 opacity-25">
                {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
                    <span key={i} className="text-[7px] sm:text-[9px] font-black font-mono text-white">
                        {data[i]?.time}
                    </span>
                ))}
            </div>

            {/* Hover Tooltip */}
            <AnimatePresence>
                {hoveredData && hoveredIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 pointer-events-none"
                        style={{
                            left: `${Math.min(Math.max(hoveredX, 15), 85)}%`,
                            top: '8px',
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="bg-[#0c0c10]/95 border border-white/10 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-xl flex flex-col gap-0.5 min-w-[110px]">
                            <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-1">
                                <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">Time</span>
                                <span className="text-[10px] font-black text-white font-mono">{hoveredData.time}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">Price</span>
                                <span className="text-[12px] font-black font-mono" style={{ color }}>
                                    {hoveredData.value.toFixed(hoveredData.value < 10 ? 3 : 2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">Δ</span>
                                <span className={`text-[10px] font-black font-mono ${hoveredData.value >= currentPrice ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {hoveredData.value >= currentPrice ? '+' : ''}{(hoveredData.value - currentPrice).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
