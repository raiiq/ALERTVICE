"use client";

import { createContext, useContext, useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Language = "en" | "ar";

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    toggleLang: () => void;
    isAr: boolean;
    isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Language>("en");
    const [isTranslating, setIsTranslating] = useState(false);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Combined pending states
    const activeTranslating = isTranslating || isPending;

    // React to URL changes via a separate component wrapped in Suspense
    function LanguageSync() {
        const searchParams = useSearchParams();
        useEffect(() => {
            const urlLang = searchParams.get('lang') as Language;
            if (urlLang === 'ar' || urlLang === 'en') {
                if (urlLang !== lang) {
                    console.log(`[LanguageSync] URL Sync: ${urlLang}`);
                    setLangState(urlLang);
                    localStorage.setItem("newsLang", urlLang);
                }
            }
        }, [searchParams]);
        return null;
    }

    // Initial load from localStorage and URL
    useEffect(() => {
        const savedLang = localStorage.getItem("newsLang") as Language;
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang') as Language;
        
        if (urlLang === 'ar' || urlLang === 'en') {
            setLangState(urlLang);
        } else if (savedLang === 'ar' || savedLang === 'en') {
            setLangState(savedLang);
        }
    }, []);

    const setLang = (newLang: Language) => {
        if (newLang === lang) return;
        
        console.log(`[LanguageContext] Setting language: ${lang} -> ${newLang}`);
        setIsTranslating(true);
        
        try {
            startTransition(() => {
                setLangState(newLang);
                localStorage.setItem("newsLang", newLang);
                
                // Refresh server components and cache
                router.refresh();
                
                // Keep the overlay for a short duration to mask content refresh
                setTimeout(() => {
                    setIsTranslating(false);
                }, 400); // Tactical speed enhancement
            });
        } catch (err) {
            console.error("[LanguageContext] Failed to persist language:", err);
            setIsTranslating(false);
        }
    };

    const toggleLang = () => {
        const newLang = lang === "ar" ? "en" : "ar";
        setLang(newLang);
    };

    const isAr = lang === "ar";

    return (
        <LanguageContext.Provider value={{ lang, setLang, toggleLang, isAr, isTranslating: activeTranslating }}>
            <Suspense fallback={null}>
                <LanguageSync />
            </Suspense>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
