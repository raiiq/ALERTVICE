"use client";

import { useLanguage } from "../context/LanguageContext";

export default function LanguageWrapper({ children }: { children: React.ReactNode }) {
    const { lang, isAr } = useLanguage();
    
    return (
        <div key={lang} className="contents" dir={isAr ? "rtl" : "ltr"}>
            {children}
        </div>
    );
}
