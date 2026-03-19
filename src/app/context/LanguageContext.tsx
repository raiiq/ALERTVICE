"use client";

import { createContext, useContext, useState, useEffect } from "react";
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
    const searchParams = useSearchParams();

    // React to URL changes (e.g. from router.push)
    useEffect(() => {
        const urlLang = searchParams.get('lang') as Language;
        if (urlLang === 'ar' || urlLang === 'en') {
            if (urlLang !== lang) {
                console.log(`[LanguageContext] URL Sync: ${urlLang}`);
                setLangState(urlLang);
                localStorage.setItem("newsLang", urlLang);
            }
        }
    }, [searchParams, lang]);

    // Initial load from localStorage
    useEffect(() => {
        const savedLang = localStorage.getItem("newsLang") as Language;
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        
        // Only set from storage if no URL param is present
        if (savedLang && !urlLang) {
            setLangState(savedLang);
        }
    }, []);

    const setLang = (newLang: Language) => {
        if (newLang === lang) return;
        
        console.log(`[LanguageContext] Setting language: ${lang} -> ${newLang}`);
        setIsTranslating(true);
        
        try {
            setLangState(newLang);
            localStorage.setItem("newsLang", newLang);
            
            // Refresh server components and cache
            router.refresh();
            
            // Keep the overlay for a short duration to mask content refresh
            setTimeout(() => {
                setIsTranslating(false);
            }, 800);
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
        <LanguageContext.Provider value={{ lang, setLang, toggleLang, isAr, isTranslating }}>
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
