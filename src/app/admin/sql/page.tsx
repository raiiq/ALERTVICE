'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SqlConsolePage() {
    const [loading, setLoading] = useState(true);
    const [sqlQuery, setSqlQuery] = useState('SELECT * FROM posts ORDER BY post_date DESC LIMIT 10;');
    const [sqlResult, setSqlResult] = useState<any>(null);
    const [isExecutingSql, setIsExecutingSql] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const res = await fetch('/api/admin/check');
            if (!res.ok) {
                router.push('/admin/login');
                return;
            }
            setLoading(false);
        } catch (err) {
            router.push('/admin/login');
        }
    };

    const handleExecuteSql = async () => {
        if (!sqlQuery.trim()) return;
        setIsExecutingSql(true);
        setSqlResult(null);
        try {
            const res = await fetch('/api/admin/sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: sqlQuery }),
            });
            const data = await res.json();
            setSqlResult(data);
        } catch (err: any) {
            setSqlResult({ error: err.message });
        } finally {
            setIsExecutingSql(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
            <div className="text-foreground text-xl animate-pulse tracking-widest uppercase font-black">INITIALIZING SQL OVERRIDE...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070a] text-foreground p-4 md:p-8 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase whitespace-nowrap text-foreground">
                            SQL POWER CONSOLE
                        </h1>
                        <p className="text-amber-500 text-[10px] font-bold tracking-[0.4em] uppercase mt-2">
                             DIRECT DATABASE OVERRIDE • ROOT ACCESS
                        </p>
                    </div>
                    <button 
                        onClick={() => router.push('/admin/dashboard')}
                        className="px-6 py-2 bg-foreground/5 border border-border-color rounded-none text-[10px] font-black tracking-widest hover:bg-foreground/10 transition-all uppercase"
                    >
                        Back to Dashboard
                    </button>
                </header>

                <div className="space-y-6">
                    <div className="bg-[#0d1117] border border-border-color/50 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <svg className="w-24 h-24 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                        </div>

                         <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 block">COMMAND_BUFFER_v2.0</label>
                         <textarea 
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            className="w-full bg-surfaceackground/40 border border-amber-500/20 rounded-none p-8 font-mono text-sm text-amber-100 min-h-[250px] outline-none focus:border-amber-500/50 transition-all shadow-inner"
                            placeholder="SELECT * FROM posts LIMIT 10;"
                         />
                         
                         <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-6">
                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => setSqlQuery("SELECT * FROM posts ORDER BY post_date DESC LIMIT 50;")} className="text-[9px] font-black text-foreground/40 hover:text-foreground border border-border-color/50 bg-foreground/[0.02] px-4 py-2 rounded-none transition-all hover:border-white/20">RECENT SIGNALS</button>
                                <button onClick={() => setSqlQuery("SELECT tag, count(*) FROM posts GROUP BY tag;")} className="text-[9px] font-black text-foreground/40 hover:text-foreground border border-border-color/50 bg-foreground/[0.02] px-4 py-2 rounded-none transition-all hover:border-white/20">DISTRIBUTION</button>
                                <button onClick={() => setSqlQuery("DELETE FROM posts WHERE (title IS NULL OR title = '') AND (plain_text IS NULL OR plain_text = '');")} className="text-[9px] font-black text-red-500/40 hover:text-red-500 border border-red-500/10 bg-red-500/5 px-4 py-2 rounded-none transition-all">PURGE GHOSTS</button>
                            </div>
                            <button 
                                onClick={handleExecuteSql}
                                disabled={isExecutingSql}
                                className="w-full sm:w-auto bg-surfacember-600 hover:bg-surfacember-500 text-foreground font-black px-16 py-4 rounded-none shadow-2xl shadow-amber-600/30 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                            >
                                {isExecutingSql ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-none animate-spin"></div>
                                        EXECUTING...
                                    </>
                                ) : 'RUN QUERY'}
                            </button>
                         </div>
                    </div>

                    <AnimatePresence>
                        {sqlResult && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0a0c11] border border-border-color/50 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">RESPONSE_OUTPUT</label>
                                    {!sqlResult.error && <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">QUERY SUCCESSFUL</span>}
                                </div>
                                {sqlResult.error ? (
                                    <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-none text-red-400 font-mono text-xs leading-relaxed">
                                        <div className="flex items-center gap-2 mb-2 text-red-500 font-black">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                                            CRITICAL DATABASE ERROR
                                        </div>
                                        {sqlResult.error}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[800px] custom-scrollbar">
                                        <div className="bg-surfaceackground/50 p-6 rounded-none border border-white/[0.03]">
                                            <pre className="text-amber-100/70 font-mono text-[11px] leading-[1.8]">
                                                {JSON.stringify(sqlResult.result, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(245, 158, 11, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(245, 158, 11, 0.4);
                }
            `}</style>
        </div>
    );
}
