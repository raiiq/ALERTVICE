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
  const [miniNews, setMiniNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

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

  // Fetch Regional News (Mini Sidebar)
  useEffect(() => {
    const fetchRegionalNews = async () => {
      try {
        setNewsLoading(true);
        // Querying Supabase for Iran-specific text signals (strictly no media)
        // Targeted keywords for multi-word OR search in backend
        const query = isAr 
          ? "إيران طهران أصفهان نطنز بوشهر تبريز مشهد كرمان" 
          : "Iran Tehran Isfahan Natanz Bushehr Tabriz Mashhad Kerman";
        const res = await fetch(`/api/news?q=${encodeURIComponent(query)}&type=signal&limit=15&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setMiniNews(data.posts || []);
        }
      } catch (e) {
        console.error("Failed to fetch sidebar news", e);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchRegionalNews();
    const interval = setInterval(fetchRegionalNews, 60000); // 60s tactical pulse
    return () => clearInterval(interval);
  }, [isAr]);

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
    locked: isAr ? "مقفل" : "LOCKED",
    ceasefire: isAr ? "وقف إطلاق النار: الولايات المتحدة - إسرائيل - إيران (باستثناء لبنان) | 7 أبريل - 21 أبريل" : "CEASEFIRE: USA-ISRAEL-IRAN (EXCL. LEBANON) | APRIL 07 - APRIL 21",
    intelSidebar: isAr ? "الاستخبارات الإقليمية" : "REGIONAL INTELLIGENCE",
    noNews: isAr ? "لا توجد تحديثات حالية للقطاع" : "NO CURRENT SECTOR UPDATES"
  };

  return (
    <div className={`cooldown-page-wrapper ${isAr ? 'font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Layer 0: Trump Background (50% opaque) */}
      <div className="trump-bg-overlay"></div>

      {/* Layer 1: Real Map framework (Soft Blend) */}
      <div className="map-wrapper">
        <DynamicMap />
      </div>

        {/* Layer 2: UI Overlays (Tactical Split View) */}
        <div className="cooldown-layout-grid">
          
          {/* Left Sidebar: Mini News */}
          <div className="mini-news-sidebar">
            <div className="sidebar-header">
              <div className="pulse-dot"></div>
              {t.intelSidebar}
            </div>
            <div className="sidebar-scroll">
              {newsLoading ? (
                <div className="news-loading-skeleton">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton-item animate-pulse"></div>
                  ))}
                </div>
              ) : miniNews.length > 0 ? (
                miniNews.map((post, idx) => (
                  <Link key={idx} href={`/news/${post.id.split('/').pop()}`} className="sidebar-news-item">
                    <div className="item-time">{new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="item-title">{post.aiTitle || post.plainText?.slice(0, 60)}</div>
                  </Link>
                ))
              ) : (
                <div className="no-news-status">{t.noNews}</div>
              )}
            </div>
          </div>

          <div className="cooldown-content-container">
            {/* Ceasefire Badge */}
            <div className="ceasefire-badge">
              <span className="badge-icon">⚠</span>
              {t.ceasefire}
            </div>

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
    </div>
  );
};

export default CountdownPage;
