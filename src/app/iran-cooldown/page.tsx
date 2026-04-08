'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import './cooldown.css';

// Load map dynamically to avoid SSR errors with Leaflet
const DynamicMap = dynamic(() => import('./DynamicMap'), { 
  ssr: false,
  loading: () => <div className="bg-black w-full h-full animate-pulse" />
});

const CountdownPage = () => {
  const { lang, isAr } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Target: Tuesday, 21 April 2026, 03:00:00 Baghdad Time (UTC+3)
    const targetDate = new Date('2026-04-21T03:00:00+03:00');

    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  // Tactical Translations
  const t = {
    title: isAr ? "استهداف البنية التحتية الإيرانية" : "IRAN INFRASTRUCTURE TARGETING",
    subtitle: isAr ? "العد التنازلي للتأثير" : "COOLDOWN TO IMPACT",
    warning: isAr ? "تحذير: قد تستخدم الولايات المتحدة القنابل النووية لقصف إيران" : "WARNING: USA MIGHT USE NUCLEAR BOMBS TO BOMB IRAN",
    days: isAr ? "أيام" : "Days",
    hours: isAr ? "ساعات" : "Hours",
    minutes: isAr ? "دقائق" : "Minutes",
    seconds: isAr ? "ثواني" : "Seconds",
    alert: isAr ? "تنبيه: العد التنازلي التدميري نشط. جميع الأهداف في المدى." : "ALERT: DESTRUCTIVE COOLDOWN ACTIVE. ALL TARGETS ARE IN RANGE.",
    remaining: isAr ? "الوقت المتبقي: التأثير المجدول ليوم الثلاثاء الساعة 03:00 صباحاً بتوقيت بغداد." : "REMAINING TIME: IMPACT SCHEDULED FOR TUESDAY AT 03:00 AM BAGHDAD TIME.",
    viewNews: isAr ? "عرض الأخبار" : "VIEW NEWS",
    target: isAr ? "هدف" : "TARGET",
    nuclear: isAr ? "المرافق النووية:" : "NUCLEAR FACILITIES:",
    oil: isAr ? "محطات النفط والطاقة:" : "OIL & ENERGY PLANTS:",
    water: isAr ? "البنية التحتية للمياه:" : "WATER INFRASTRUCTURE:",
    ready: isAr ? "جاهز" : "READY",
    linked: isAr ? "مرتبط" : "LINKED",
    locked: isAr ? "مقفل" : "LOCKED"
  };

  return (
    <div className={`cooldown-page-wrapper ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Layer 0: Trump Background (50% opaque) */}
      <div className="trump-bg-overlay"></div>

      {/* Layer 1: Real Map framework (Soft Blend) */}
      <div className="map-wrapper">
        <DynamicMap />
      </div>

      {/* Layer 2: UI Overlays (News Style) */}
      <div className="cooldown-content-container">
        <div className="news-header">
          <h1>{t.title}</h1>
        </div>
        <div className="news-subtitle">{t.subtitle}</div>
        <div className="nuclear-warning">
          {t.warning}
        </div>

        <div className="timer-container" dir="ltr">
          <div className="timer-block">
            <span className="timer-value">{formatNumber(timeLeft.days)}</span>
            <span className="timer-label">{t.days}</span>
          </div>
          <div className="timer-block">
            <span className="timer-value" style={{ color: 'var(--military-yellow)' }}>:</span>
          </div>
          <div className="timer-block">
            <span className="timer-value">{formatNumber(timeLeft.hours)}</span>
            <span className="timer-label">{t.hours}</span>
          </div>
          <div className="timer-block">
            <span className="timer-value" style={{ color: 'var(--military-yellow)' }}>:</span>
          </div>
          <div className="timer-block">
            <span className="timer-value">{formatNumber(timeLeft.minutes)}</span>
            <span className="timer-label">{t.minutes}</span>
          </div>
          <div className="timer-block">
            <span className="timer-value" style={{ color: 'var(--military-yellow)' }}>:</span>
          </div>
          <div className="timer-block">
            <span className="timer-value">{formatNumber(timeLeft.seconds)}</span>
            <span className="timer-label">{t.seconds}</span>
          </div>
        </div>

        <div className="news-footer">
          <div className="target-list">
            <div className="target-item"><span className="status-badge">{t.target}</span> <strong>{t.nuclear}</strong> {t.ready}</div>
            <div className="target-item"><span className="status-badge">{t.target}</span> <strong>{t.oil}</strong> {t.linked}</div>
            <div className="target-item"><span className="status-badge">{t.target}</span> <strong>{t.water}</strong> {t.locked}</div>
          </div>
          <div className={`footer-details ${isAr ? 'text-right' : 'text-left'}`} style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <p><strong>{isAr ? 'تنبيه:' : 'ALERT:'}</strong> {t.alert}</p>
              <p><strong>{isAr ? 'الوقت المتبقي:' : 'REMAINING TIME:'}</strong> {t.remaining}</p>
            </div>
            <Link href="/" className="return-button">
              {t.viewNews}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownPage;
