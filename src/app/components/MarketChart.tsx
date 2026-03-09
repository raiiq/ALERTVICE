"use client";

import { useState } from "react";
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
    const padding = priceRange * 0.1; // Reduced padding for a tighter look

    const getX = (i: number) => (i / (data.length - 1)) * 92;
    const getY = (v: number) => 88 - ((v - (minPrice - padding)) / (priceRange + padding * 2)) * 88;

    const pathData = data.reduce((path, d, i) => {
        return path + (i === 0 ? `M 0,${getY(d.value)}` : ` L ${getX(i)},${getY(d.value)}`);
    }, "");

    const areaData = `${pathData} L 92,88 L 0,88 Z`;

    // Mock volume data (sin wave + random)
    const volData = data.map((_, i) => 8 + Math.abs(Math.sin(i * 0.3) * 12) + Math.random() * 4);
    const maxVol = Math.max(...volData);

    const currentPrice = data[data.length - 1].value;
    const currentY = getY(currentPrice);

    return (
        <div className="relative w-full group/chart pt-2 pb-6" style={{ height }}>
            {/* Grid Lines - Behind everything */}
            <div className="absolute inset-x-0 top-2 bottom-6 flex flex-col justify-between pointer-events-none opacity-[0.03] z-0">
                {[0, 1, 2, 3, 4].map(i => <div key={i} className="w-full h-px bg-white" />)}
            </div>

            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
                onMouseLeave={() => setHoveredIndex(null)}
            >
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow-line-thin" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="0.8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Static Y-Axis Labels (Pure SVG) */}
                <g className="font-mono select-none pointer-events-none" fontSize="3.2" fontWeight="900" fill="white" fillOpacity="0.2">
                    <text x="99" y="4" textAnchor="end" className={`transition-opacity duration-500 ${Math.abs(currentY - 4) < 7 ? 'opacity-0' : ''}`}>{maxPrice.toFixed(2)}</text>
                    <text x="99" y="50" textAnchor="end" className={`transition-opacity duration-500 ${Math.abs(currentY - 50) < 7 ? 'opacity-0' : ''}`}>{((maxPrice + minPrice) / 2).toFixed(2)}</text>
                    <text x="99" y="96" textAnchor="end" className={`transition-opacity duration-500 ${Math.abs(currentY - 96) < 7 ? 'opacity-0' : ''}`}>{minPrice.toFixed(2)}</text>
                </g>

                {/* Current Price Dashed Tracking Line */}
                <motion.line
                    x1="0" x2="91" y1={currentY} y2={currentY}
                    stroke="white" strokeWidth="0.4" strokeOpacity="0.15"
                    strokeDasharray="1.5,1.5"
                    animate={{ y1: currentY, y2: currentY }}
                />

                {/* Shimmer Area */}
                <motion.path
                    d={areaData}
                    fill={`url(#grad-${color})`}
                    animate={{ d: areaData }}
                    transition={{ duration: 0.8, ease: "linear" }}
                />

                {/* Main Price Line */}
                <motion.path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ d: pathData }}
                    transition={{ duration: 0.8, ease: "linear" }}
                    style={{ filter: "url(#glow-line-thin)" }}
                />

                {/* Volume Bars */}
                <g className="opacity-15">
                    {volData.map((v, i) => (
                        <rect
                            key={i}
                            x={getX(i) - 0.3}
                            y={100 - (v / maxVol) * 10}
                            width="0.6"
                            height={(v / maxVol) * 10}
                            fill={color}
                            className="transition-all duration-500"
                        />
                    ))}
                </g>

                {/* Hover Crosshair */}
                {hoveredIndex !== null && (
                    <g>
                        <line
                            x1={getX(hoveredIndex)} x2={getX(hoveredIndex)} y1={0} y2={100}
                            stroke="white" strokeWidth="0.3" strokeOpacity="0.2"
                        />
                        <line
                            x1={0} x2={92} y1={getY(data[hoveredIndex].value)} y2={getY(data[hoveredIndex].value)}
                            stroke="white" strokeWidth="0.3" strokeOpacity="0.2"
                        />
                    </g>
                )}

                {/* Current Price Multi-Tag (The Fix) */}
                <motion.g animate={{ y: currentY }}>
                    {/* Background Tag */}
                    <rect x="91" y="-4.5" width="10" height="9" rx="1.5" fill="#000" stroke="white" strokeOpacity="0.2" strokeWidth="0.3" />
                    {/* Live Price Text */}
                    <text x="96" y="1.2" fill="white" fontSize="3.5" fontWeight="900" textAnchor="middle" className="font-mono">
                        {currentPrice.toFixed(1)}
                    </text>
                </motion.g>

                {/* Interaction Hitboxes */}
                {data.map((d, i) => (
                    <rect
                        key={i}
                        x={getX(i) - 1.5}
                        y={0}
                        width="3"
                        height="100"
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(i)}
                        className="cursor-crosshair"
                    />
                ))}
            </svg>

            {/* X-Axis Labels (Time) - Better size and spacing */}
            <div className="absolute inset-x-0 bottom-0 flex justify-between pointer-events-none px-2 opacity-30">
                {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
                    <span key={i} className="text-[10px] font-black font-mono text-white/50 tracking-tighter">
                        {data[i]?.time}
                    </span>
                ))}
            </div>

            {/* Advanced Technical Tooltip - Refined text sizes */}
            <AnimatePresence>
                {hoveredIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 15 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 15 }}
                        className="absolute z-50 pointer-events-none top-8 left-6"
                    >
                        <div className="bg-[#0f1115]/95 border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[130px]">
                            <div className="flex justify-between gap-6 border-b border-white/5 pb-1 mb-1">
                                <span className="text-[10px] font-black text-white/20 uppercase">TIMESTAMP</span>
                                <span className="text-[11px] font-black text-white">{data[hoveredIndex].time}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-black text-white/20">LIVE_PRICE</span>
                                <span className={`text-[13px] font-black`} style={{ color }}>{data[hoveredIndex].value.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-black text-white/20">SESSION_HI</span>
                                <span className="text-[11px] font-bold text-emerald-400">{(data[hoveredIndex].value * 1.002).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-black text-white/20">TRADE_VOL</span>
                                <span className="text-[11px] font-bold text-white/60">{Math.floor(volData[hoveredIndex] * 100).toLocaleString()}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
