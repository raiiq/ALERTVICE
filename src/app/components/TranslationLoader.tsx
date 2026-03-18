"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function TranslationLoader() {
    const { isTranslating, lang } = useLanguage();
    const isAr = lang === 'ar';

    return (
        <AnimatePresence>
            {isTranslating && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[10000] bg-background/80 backdrop-blur-2xl flex items-center justify-center p-8"
                >
                    <div className="flex flex-col items-center gap-8">
                        {/* Tactical Translation Core */}
                        <div className="relative flex items-center justify-center scale-110 sm:scale-125">
                            <div className="absolute w-20 h-20 border border-primary/20 rounded-full animate-ping opacity-30"></div>
                            <div className="absolute w-12 h-12 border border-primary/40 rounded-full animate-pulse"></div>
                            <motion.div 
                                animate={{ rotate: -360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 border-2 border-transparent border-t-primary rounded-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary rounded-none shadow-[0_0_15px_var(--primary)] animate-pulse"></div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center gap-3">
                            <motion.span 
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-[11px] font-black text-primary uppercase tracking-[0.6em] pl-[0.6em]"
                            >
                                {isAr ? 'جارٍ الترجمة الفورية...' : 'INSTANT TRANSLATION...'}
                            </motion.span>
                            
                            {/* Scanning Data Line */}
                            <div className="w-40 h-[2px] bg-white/10 relative overflow-hidden mt-2">
                                <motion.div 
                                    initial={{ left: '-100%' }}
                                    animate={{ left: '100%' }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                                />
                            </div>
                            
                            <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-[0.4em] mt-2">ALERTVICE TERMINAL MESH v4.0</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
