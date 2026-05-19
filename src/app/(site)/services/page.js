'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getServices, getSiteSettings } from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';

const iconMap = {
  plane: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91"/>
      <path d="M21 2l-9 9M15 2h6v6"/>
    </svg>
  ),
  passport: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="2" width="18" height="20" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M9 8h6M9 16h6"/>
    </svg>
  ),
  stamp: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  mosque: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  suitcase: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),
  id: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <circle cx="8" cy="12" r="2"/>
      <path d="M14 9h4M14 12h4M14 15h2"/>
    </svg>
  ),
  document: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  shield: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  work: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  temple: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21h18M3 10h18M5 21V10M19 21V10M12 3L3 10M12 3l9 7"/>
    </svg>
  ),
  forex: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12M8 9h6a2 2 0 010 4H8"/>
    </svg>
  ),
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, st] = await Promise.all([getServices(), getSiteSettings()]);
        if (s) setServices(s);
        if (st) setSettings(st);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      io.observe(el);
    });
    return () => io.disconnect();
  }, [services, loading]);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Navbar activePage="services" />

      {/* ─── Page Hero ─────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-bg">
          {settings?.bannerServices && <img src={settings.bannerServices} alt="Services" />}
        </div>
        <div className="page-hero-content container">
          <span className="eyebrow light">Our Services</span>
          <h1>Eleven services,<br /><em>one trusted desk.</em></h1>
          <p>Everything you need to cross borders — from flights and visas to Umrah, forex, and beyond.</p>
        </div>
      </section>

      {/* ─── Services Grid ─────────────────────────────────────────────── */}
      <section className="svc-section">
        <div className="container">
          <div className="svc-head">
            <span className="eyebrow royal">Complete Service List</span>
            <h2>Every service you need,<br /><em>under one roof.</em></h2>
            <p>Each service is handled by dedicated specialists who know every step of the process — so you never have to worry.</p>
          </div>
          <div className="svc-grid">
            {services.map((svc, i) => (
              <Link
                href={`/services/${svc.slug || svc.id}`}
                className="svc-card reveal"
                key={svc.id || i}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="svc-img">
                  <img src={svc.image} alt={svc.title} />
                  <span className="svc-num">{svc.num}</span>
                  <span className="svc-icon-badge">
                    {iconMap[svc.iconType] || iconMap.document}
                  </span>
                </div>
                <div className="svc-body">
                  <h3>{svc.title}</h3>
                  <p>{svc.description}</p>
                  <div className="svc-tags">
                    {(svc.tags || []).map((tag, ti) => (
                      <span key={ti}>{tag}</span>
                    ))}
                  </div>
                  <div className="svc-detail-link" style={{ marginTop: '1rem' }}>
                    View Details
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Custom Package CTA ────────────────────────────────────────── */}
      <section className="svc-custom">
        <div className="container">
          <div className="svc-custom-inner">
            <div className="reveal">
              <span className="eyebrow light">Custom Packages</span>
              <h2>Can't find what<br /><em>you need?</em></h2>
              <p>Every journey is unique. Tell us your requirements and we will build a custom solution around them — at transparent pricing.</p>
            </div>
            <div className="reveal" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-primary">Talk to an Advisor</Link>
              <a href={settings?.whatsapp || '#'} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="cta">
        <div className="container">
          <div className="cta-inner">
            <div className="reveal">
              <span className="eyebrow light">Get Started</span>
              <h2>Ready to begin<br /><em>your journey?</em></h2>
              <p>Speak with a dedicated advisor today. Clear quotes, transparent pricing, no surprises.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary">Contact Us</Link>
                <Link href="/process" className="btn btn-ghost">See How It Works</Link>
              </div>
            </div>
            <div className="cta-right reveal">
              <div className="phone-block">
                <span>Call us directly</span>
                <a href={`tel:${settings?.phone1?.replace(/\s/g, '')}`}>{settings?.phone1}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </>
  );
}
