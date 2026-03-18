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
                    className="fixed inset-0 z-[10000] bg-background/60 backdrop-blur-xl flex items-center justify-center p-8"
                >
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border border-primary/20 rounded-none animate-spin-slow"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary rounded-none animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">
                                {isAr ? 'جارٍ الترجمة الفورية...' : 'INSTANT TRANSLATION IN PROGRESS...'}
                            </span>
                            <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-[0.3em] mt-4 border-t border-white/5 pt-4">ALERTVICE TERMINAL MESH v2.0</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
