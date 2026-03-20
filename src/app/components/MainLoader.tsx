"use client";

export function MainLoader() {
    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[99999] pointer-events-none">
            <div className="flex flex-col items-center gap-6 p-8 border border-white/10 relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/40"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/40"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/40"></div>

                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary animate-ping"></div>
                    <span className="text-[10px] font-black text-primary tracking-[0.5em] uppercase">Initial Loading Sync</span>
                </div>
                <div className="w-48 h-[1px] bg-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary animate-scanline"></div>
                </div>
            </div>
        </div>
    );
}
