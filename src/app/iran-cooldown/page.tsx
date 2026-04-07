'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import './cooldown.css';

// Load map dynamically to avoid SSR errors with Leaflet
const DynamicMap = dynamic(() => import('./DynamicMap'), { 
  ssr: false,
  loading: () => <div className="bg-black w-full h-full animate-pulse" />
});

const CountdownPage = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Target: Wednesday, 8 April 2026, 03:00:00 Baghdad Time (UTC+3)
    const targetDate = new Date('2026-04-08T03:00:00+03:00');

    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="cooldown-page-wrapper">
      {/* Layer 0: Trump Background (50% opaque) */}
      <div className="trump-bg-overlay"></div>

      {/* Layer 1: Real Map framework (Soft Blend) */}
      <div className="map-wrapper">
        <DynamicMap />
      </div>

      {/* Layer 2: UI Overlays (News Style) */}
      <div className="cooldown-content-container">
        <div className="news-header">
          <h1>IRAN INFRASTRUCTURE TARGETING</h1>
        </div>
        <div className="news-subtitle">COOLDOWN TO IMPACT</div>
        <div className="nuclear-warning">
          WARNING: USA MIGHT USE NUCLEAR BOMBS TO BOMB IRAN
        </div>

        <div className="timer-container" dir="ltr">
          <div className="timer-block">
            <span className="timer-value">{formatNumber(timeLeft.hours)}</span>
            <span className="timer-label">Hours</span>
          </div>
          <div className="timer-block">
            <span className="timer-value" style={{ color: 'var(--military-yellow)' }}>:</span>
          </div>
          <div className="timer-block">
            <span className="timer-value">{formatNumber(timeLeft.minutes)}</span>
            <span className="timer-label">Minutes</span>
          </div>
          <div className="timer-block">
            <span className="timer-value" style={{ color: 'var(--military-yellow)' }}>:</span>
          </div>
          <div className="timer-block">
            <span className="timer-value">{formatNumber(timeLeft.seconds)}</span>
            <span className="timer-label">Seconds</span>
          </div>
        </div>

        <div className="news-footer">
          <div className="target-list">
            <div className="target-item"><span className="status-badge">TARGET</span> <strong>NUCLEAR FACILITIES:</strong> READY</div>
            <div className="target-item"><span className="status-badge">TARGET</span> <strong>OIL & ENERGY PLANTS:</strong> LINKED</div>
            <div className="target-item"><span className="status-badge">TARGET</span> <strong>WATER INFRASTRUCTURE:</strong> LOCKED</div>
          </div>
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <p><strong>ALERT:</strong> DESTRUCTIVE COOLDOWN ACTIVE. ALL TARGETS ARE IN RANGE.</p>
              <p><strong>REMAINING TIME:</strong> IMPACT SCHEDULED FOR WEDNESDAY AT 03:00 AM BAGHDAD TIME.</p>
            </div>
            <Link href="/" className="return-button">
              VIEW NEWS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownPage;
