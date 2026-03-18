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
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-8 font-mono"
                >
                    <div className="flex flex-col items-center gap-6 border border-white/10 p-8 sm:p-12 relative w-full max-w-[400px]">
                        {/* Brackets */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>

                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-600 animate-pulse"></div>
                            <span className="text-[12px] sm:text-[14px] font-bold text-primary tracking-[0.4em] uppercase">
                                {isAr ? 'فك التشفير العسكري...' : 'MIL-SPEC DECRYPTION'}
                            </span>
                        </div>
                        
                        <div className="w-full bg-white/5 h-2 overflow-hidden relative">
                            <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute top-0 bottom-0 left-0 bg-red-600"
                            />
                        </div>
                        
                        <div className="flex justify-between w-full text-[10px] text-white/40 tracking-[0.2em] uppercase mt-2">
                            <span>PROCESSING SIGNAL...</span>
                            <span>[ OVERRIDE ]</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
