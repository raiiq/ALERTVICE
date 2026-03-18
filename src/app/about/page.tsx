"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AboutPage() {
    const [mounted, setMounted] = useState(false);
    const [lang, setLang] = useState("en");

    useEffect(() => {
        setMounted(true);
        setLang(localStorage.getItem("newsLang") || "en");
    }, []);

    const isAr = lang === "ar";

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
                    {isAr ? "عن أليرت فايس" : "About Alertvice"}
                </h1>

                <div className={`space-y-8 text-lg sm:text-xl leading-relaxed text-text-muted/90 font-light ${isAr ? "text-right" : "text-left"}`}>
                    <section>
                        <h2 className="text-2xl font-bold text-primary uppercase tracking-widest mb-4">
                            {isAr ? "رؤيتنا" : "Our Vision"}
                        </h2>
                        <p>
                            {isAr
                                ? "أليرت فايس هي منصة إخبارية رائدة تعتمد على الذكاء الاصطناعي، تهدف إلى توفير معلومات فورية ودقيقة من المصادر العالمية الأكثر موثوقية. نحن نؤمن بأن الوصول السريع إلى المعلومات هو الركيزة الأساسية لاتخاذ القرارات السليمة في عالم متسارع."
                                : "Alertvice is a premier AI-driven news intelligence platform dedicated to providing real-time, accurate information from the world's most critical sources. We believe that rapid access to information is the cornerstone of informed decision-making in an accelerating world."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary uppercase tracking-widest mb-4">
                            {isAr ? "التكنولوجيا والذكاء الاصطناعي" : "Technology & AI"}
                        </h2>
                        <p>
                            {isAr
                                ? "نستخدم أحدث تقنيات المعالجة اللغوية لترجمة وتحليل الأخبار لحظة بلحظة. يتم تصفية البيانات، استخلاص العناوين، وتلخيص المحتوى المعقد لضمان وصول الجوهر إليك دون ضجيج. محركنا يراقب باستمرار القنوات الاستراتيجية لتقديم صورة كاملة عما يحدث في السياسة، الاقتصاد، والأمن العالمي."
                                : "We utilize state-of-the-art natural language processing (NLP) to translate and analyze news as it breaks. Our system filters data, extracts key headlines, and summarizes complex content to ensure the core message reaches you without the noise. Our engine constantly monitors strategic channels to provide a comprehensive picture of global politics, economics, and security."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-primary uppercase tracking-widest mb-4">
                            {isAr ? "الالتزام بالدقة" : "Commitment to Accuracy"}
                        </h2>
                        <p>
                            {isAr
                                ? "في عصر المعلومات المضللة، نلتزم في أليرت فايس بالشفافية. نوفر روابط مباشرة للمصادر الأصلية لكل خبر، مما يتيح لمتابعينا التحقق من صحة البيانات بأنفسهم. هدفنا هو بناء جسر من الثقة بين التكنولوجيا المتقدمة والوعي البشري."
                                : "In an era of misinformation, Alertvice is committed to transparency. We provide direct links to original sources for every report, allowing our audience to verify data independently. Our goal is to build a bridge of trust between advanced technology and human awareness."
                            }
                        </p>
                    </section>
                </div>

                <div className="mt-20 p-8 border border-border bg-surface rounded-none text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted mb-6">
                        {isAr ? "انضم إلى شبكتنا الاستخباراتية" : "Join Our Intelligence Network"}
                    </p>
                    <a
                        href="https://t.me/alertvice"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-10 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded shadow-[0_0_20px_var(--primary)] hover:scale-105 transition-transform"
                    >
                        Telegram Channel
                    </a>
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
                            {isAr ? "الجيل القادم من ذكاء الأخبار العالمي." : "The next generation of global news intelligence."}
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
