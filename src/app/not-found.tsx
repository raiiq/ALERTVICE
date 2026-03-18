"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#050508] text-foreground flex flex-col items-center justify-center p-6 text-center">
            <div className="relative p-10 border border-primary/20 bg-primary/5 max-w-lg w-full">
                {/* Tactical Overlays */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/40"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/40"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/40"></div>

                <div className="mb-8">
                    <h1 className="text-6xl font-black tracking-tighter text-primary/20 mb-2">404</h1>
                    <h2 className="text-xl font-black tracking-[0.2em] text-primary uppercase mb-4">INTELLIGENCE LOST</h2>
                    <p className="text-[10px] font-bold text-foreground/40 tracking-widest uppercase max-w-xs mx-auto">
                        The requested sector does not contain active signals or has been classified.
                    </p>
                </div>

                <Link
                    href="/"
                    className="inline-block bg-primary text-primary-foreground font-black px-10 py-4 tracking-[0.3em] uppercase hover:bg-primary/90 transition-all active:scale-95 shadow-[0_0_30px_rgba(56,189,248,0.2)]"
                >
                    RETURN TO HQ
                </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-4 opacity-20">
                <div className="w-12 h-[1px] bg-primary"></div>
                <span className="text-[8px] font-black tracking-[0.4em] uppercase">SECURE_LINK_TERMINATED</span>
                <div className="w-12 h-[1px] bg-primary"></div>
            </div>
        </div>
    );
}
