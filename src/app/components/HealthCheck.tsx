"use client";

import { useEffect, useState } from "react";

export default function HealthCheck() {
    const [status, setStatus] = useState<"ok" | "alert" | "failed">("ok");
    const [latency, setLatency] = useState<number>(0);

    useEffect(() => {
        const checkHealth = async () => {
            const start = Date.now();
            try {
                const res = await fetch("/api/admin/check", { cache: 'no-store' });
                const end = Date.now();
                setLatency(end - start);
                
                if (res.ok) setStatus("ok");
                else setStatus("alert");
            } catch (e) {
                setStatus("failed");
            }
        };

        const interval = setInterval(checkHealth, 60000); // Check every minute
        checkHealth();
        return () => clearInterval(interval);
    }, []);

    if (status === "ok" && latency < 500) return null; // Invisible if healthy

    return (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none lg:top-20 lg:right-8">
            <div className={`px-3 py-1.5 border backdrop-blur-md flex items-center gap-3 transition-all duration-500 ${
                status === "failed" ? "bg-red-500/10 border-red-500/40 text-red-500" : 
                status === "alert" || latency > 1000 ? "bg-amber-500/10 border-amber-500/40 text-amber-500" :
                "bg-primary/10 border-primary/40 text-primary"
            }`}>
                <div className={`w-1.5 h-1.5 rounded-none animate-pulse ${
                    status === "failed" ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : 
                    status === "alert" || latency > 1000 ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" :
                    "bg-primary shadow-[0_0_8px_#38bdf8]"
                }`}></div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black tracking-widest uppercase">
                        {status === "failed" ? "LINK SEVERED" : status === "alert" ? "DEGRADED SIGNAL" : "LATENCY ALERT"}
                    </span>
                    <span className="text-[7px] font-mono opacity-60">
                        {status === "failed" ? "ERROR_503" : `${latency}MS`}
                    </span>
                </div>
            </div>
        </div>
    );
}
