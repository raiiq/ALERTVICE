"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

export default function TermsPage() {
    const { lang, isAr } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-surfaceackground text-foreground tracking-wide flex flex-col" dir={isAr ? "rtl" : "ltr"}>
            {/* Header */}
            <header className="w-full bg-surface border-b border-border z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] shrink-0">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-primary rounded-none animate-pulse shadow-[0_0_10px_var(--primary)]"></div>
                        <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground uppercase drop-shadow-[0_0_8px_var(--primary)] hover:text-primary transition-all duration-300">
                            ALERTVICE <span className="text-primary font-light">NEWS</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl sm:text-6xl font-black text-foreground mb-10 uppercase tracking-tighter border-b border-primary pb-4">
                    {isAr ? "شروط الخدمة" : "Terms of Service"}
                </h1>

                <div className={`space-y-10 text-lg sm:text-xl leading-relaxed text-text-muted/90 font-light ${isAr ? "text-right" : "text-left"}`}>
                    <section>
                        <h2 className="text-2xl font-bold text-foreground uppercase tracking-widest mb-4">
                            {isAr ? "1. قبول الشروط" : "1. Acceptance of Terms"}
                        </h2>
                        <p>
                            {isAr
                                ? "من خلال الوصول إلى أليرت فايس، فإنك توافق على الالتزام بشروط هذه الخدمة، وجميع القوانين واللوائح المعمول بها. إذا كنت لا توافق على أي من هذه الشروط، فيحظر عليك استخدام أو الوصول إلى هذا الموقع."
                                : "By accessing Alertvice, you are agreeing to be bound by these terms of service, all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground uppercase tracking-widest mb-4">
                            {isAr ? "2. ترخيص الاستخدام" : "2. Use License"}
                        </h2>
                        <p>
                            {isAr
                                ? "يتم توفير المحتوى على أليرت فايس لأغراض إعلامية فقط. يُمنح الإذن بمشاركة روابط المحتوى مع الإشارة إلى المصدر. لا يُسمح باستخدام تقنيات استخراج البيانات الآلية (scraping) دون تصريح مسبق."
                                : "The content on Alertvice is provided for informational purposes only. Permission is granted to share content links with proper attribution. Unauthorized automated data extraction (scraping) is strictly prohibited without prior permission."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground uppercase tracking-widest mb-4">
                            {isAr ? "3. إخلاء المسؤولية" : "3. Disclaimer"}
                        </h2>
                        <p>
                            {isAr
                                ? "يتم توفير خدمات أليرت فايس 'كما هي'. أليرت فايس لا يقدم أي ضمانات، صريحة أو ضمنية، ويخلي مسؤوليته بموجب هذا من جميع الضمانات الأخرى بما في ذلك، على سبيل المثال لا الحصر، دقة وصحة المعلومات المترجمة بواسطة الذكاء الاصطناعي."
                                : "The services on Alertvice are provided on an 'as is' basis. Alertvice makes no warranties, expressed or implied, and hereby disclaims all other warranties including, without limitation, the accuracy or reliability of AI-translated and processed information."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-foreground uppercase tracking-widest mb-4">
                            {isAr ? "4. القانون المعمول به" : "4. Governing Law"}
                        </h2>
                        <p>
                            {isAr
                                ? "تخضع هذه الشروط والأحكام وتفسر وفقاً للقوانين المعمول بها عالمياً، وتخضع بشكل غير حصري للاختصاص القضائي للمحاكم المختصة."
                                : "These terms and conditions are governed by and construed in accordance with international standards and you irrevocably submit to the exclusive jurisdiction of the competent courts."
                            }
                        </p>
                    </section>
                </div>
            </main>

            <footer className="w-full bg-[#020512] border-t border-border py-12 mt-20">
                <div className="max-w-[1400px] mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-primary rounded-none shadow-[0_0_8px_var(--primary)]"></div>
                            <span className="text-foreground font-black tracking-widest uppercase text-lg">Alertvice</span>
                        </div>
                        <p className="text-xs text-text-muted/60 max-w-xs leading-relaxed uppercase tracking-widest font-bold">
                            {isAr ? "الأخبار الاستخباراتية العالمية." : "Global Intelligence News Feed."}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 font-bold uppercase tracking-widest text-xs">
                        <div className="flex flex-col gap-4">
                            <span className="text-foreground text-[10px] text-primary mb-2">{isAr ? "المنصة" : "Platform"}</span>
                            <Link href="/" className="text-text-muted hover:text-foreground transition-colors">{isAr ? "الرئيسية" : "News Feed"}</Link>
                            <Link href="/about" className="text-text-muted hover:text-foreground transition-colors">{isAr ? "عن الشركة" : "About Us"}</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-foreground text-[10px] text-primary mb-2">{isAr ? "قانوني" : "Legal"}</span>
                            <Link href="/terms" className="text-text-muted hover:text-foreground transition-colors">{isAr ? "شروط الخدمة" : "Terms of Service"}</Link>
                            <span className="text-text-muted">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-foreground text-[10px] text-primary mb-2">{isAr ? "تواصل" : "Connect"}</span>
                            <a href="https://t.me/alertvice" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-foreground transition-colors">Telegram</a>
                            <span className="text-text-muted">Email: intel@alertvice.site</span>
                        </div>
                    </div>
                </div>
                <div className="max-w-[1400px] mx-auto px-4 mt-12 pt-8 border-t border-border-color/50 flex flex-col sm:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/30">
                    <span>Alertvice Intelligence &copy; {mounted ? new Date().getFullYear() : "2026"}</span>
                    <span className="mt-4 sm:mt-0">{isAr ? "جميع الحقوق محفوظة" : "All rights reserved"}</span>
                </div>
            </footer>
        </div>
    );
}
