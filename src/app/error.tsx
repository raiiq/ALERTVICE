"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("System Failure:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#050508] text-foreground flex flex-col items-center justify-center p-6 text-center">
            <div className="relative p-10 border border-red-500/30 bg-red-500/5 max-w-lg w-full">
                {/* Tactical Overlays */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

                <div className="mb-6">
                    <div className="w-16 h-16 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-2xl font-black text-red-500">!</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-[0.3em] text-red-500 uppercase mb-2">SYSTEM CRITICAL FAILURE</h1>
                    <p className="text-[10px] font-bold text-red-500/60 tracking-widest uppercase">Kernel Panic / Intelligence Feed Disrupted</p>
                </div>

                <div className="bg-black/40 p-4 border border-white/5 mb-8 text-left">
                    <code className="text-[10px] font-mono text-white/40 break-all leading-tight">
                        {error.message || "Unknown segmentation fault at 0x000F42"}
                        {error.digest && <div className="mt-2 text-red-500/40">DIGEST: {error.digest}</div>}
                    </code>
                </div>

                <button
                    onClick={() => reset()}
                    className="w-full bg-red-500 text-white font-black py-4 tracking-[0.4em] uppercase hover:bg-red-600 transition-all active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                >
                    INITIATE COLD REBOOT
                </button>
            </div>
            
            <p className="mt-8 text-[9px] font-black text-white/20 tracking-[0.5em] uppercase">
                ALERTVICE DEFENSE SYSTEMS • v4.0.1
            </p>
        </div>
    );
}
