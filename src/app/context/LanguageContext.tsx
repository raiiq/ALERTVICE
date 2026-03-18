"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ar" | "en";

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

    useEffect(() => {
        const savedLang = localStorage.getItem("newsLang") as Language;
        if (savedLang) setLangState(savedLang);
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem("newsLang", newLang);
    };

    const toggleLang = () => {
        setIsTranslating(true);
        const newLang = lang === "ar" ? "en" : "ar";
        
        setTimeout(() => {
            setLangState(newLang);
            localStorage.setItem("newsLang", newLang);
            setTimeout(() => setIsTranslating(false), 800);
        }, 600);
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
