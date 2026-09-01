'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getPackages, getSiteSettings } from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';
import useImagesLoaded from '@/components/site/useImagesLoaded';
import PackageCard from '@/components/site/PackageCard';
import PartnerPackageModal from '@/components/site/PartnerPackageModal';

const PinIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [p, st] = await Promise.all([getPackages(), getSiteSettings()]);
        if (p) setPackages(p);
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
  }, [packages, loading]);

  const imagesReady = useImagesLoaded(!loading);

  return (
    <>
      <LoadingScreen isReady={!loading && imagesReady} />
      <Navbar activePage="packages" />
      <PartnerPackageModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
      />

      {/* ─── Page Hero ─────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-bg">
          {settings?.bannerServices && <img src={settings.bannerServices} alt="Packages" />}
        </div>
        <div className="page-hero-content container">
          <span className="eyebrow light">Tour Packages</span>
          <h1>Curated journeys,<br /><em>ready to book.</em></h1>
          <p>Handpicked island escapes and hill-country getaways — every transfer, stay, and detail arranged for you.</p>
          <div style={{ marginTop: '1.8rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPartnerModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#F6C042', color: '#0A1235', borderColor: '#F6C042', fontWeight: 700 }}
            >
              <span>🏨</span> List Your Resort / Package
            </button>
            <a href="#featured" className="btn btn-ghost">
              Explore Packages ↓
            </a>
          </div>
        </div>
      </section>

      {/* ─── Packages Grid ─────────────────────────────────────────────── */}
      <section id="featured" className="svc-section">
        <div className="container">
          <div className="svc-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span className="eyebrow royal">Featured Destinations</span>
              <h2>Pick your<br /><em>perfect escape.</em></h2>
              <p>Each package is fully managed by our advisors — clear pricing, comfortable stays, and no hidden surprises.</p>
            </div>
            <button
              onClick={() => setPartnerModalOpen(true)}
              className="partner-quick-btn"
            >
              <span className="sparkle">✨</span>
              <span><strong>Resort Owners & Partners:</strong> Submit Your Itinerary</span>
              <span className="arrow">→</span>
            </button>
          </div>

          {packages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#5a627d' }}>No packages available yet. Please check back soon.</p>
          ) : (
            <div className="pkg-grid">
              {packages.map((pkg, i) => (
                <PackageCard key={pkg.id || i} pkg={pkg} index={i} className="reveal" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Partner & Resort Listing Feature Banner ───────────────────── */}
      <section className="partner-feature-section">
        <div className="container">
          <div className="partner-banner-card reveal">
            <div className="partner-banner-text">
              <span className="eyebrow light">Partner With Zamani</span>
              <h2>Are you a Resort Manager<br /><em>or Tour Operator?</em></h2>
              <p>
                List your exclusive stays, custom itineraries, and package deals with adult and child rates. Our admin team will review and feature your property to thousands of high-intent travelers.
              </p>
              <div className="partner-badges">
                <span>✓ Zero Listing Hassle</span>
                <span>✓ Day-by-Day Itineraries</span>
                <span>✓ High-Quality Media Showcase</span>
                <span>✓ Direct Admin Approval</span>
              </div>
            </div>
            <div className="partner-banner-action">
              <button
                onClick={() => setPartnerModalOpen(true)}
                className="btn btn-partner-cta"
              >
                <span>➕ Submit Your Package & Itinerary</span>
              </button>
              <small>Fast review & listing within 24-48 hours</small>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Custom Package CTA ────────────────────────────────────────── */}
      <section className="svc-custom">
        <div className="container">
          <div className="svc-custom-inner">
            <div className="reveal">
              <span className="eyebrow light">Bespoke Trips</span>
              <h2>Want a package<br /><em>built for you?</em></h2>
              <p>Tell us your destination, dates, and budget — we will design a custom itinerary around exactly what you have in mind.</p>
            </div>
            <div className="reveal" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-primary">Plan My Trip</Link>
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
                <Link href="/services" className="btn btn-ghost">Our Services</Link>
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

      <style jsx>{`
        .partner-quick-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 0.75rem 1.25rem;
          border-radius: 50px;
          color: #1e40af;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.08);
        }
        .partner-quick-btn:hover {
          background: #2B47E5;
          color: #ffffff;
          border-color: #2B47E5;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(43, 71, 229, 0.25);
        }
        .partner-quick-btn .arrow {
          transition: transform 0.2s;
        }
        .partner-quick-btn:hover .arrow {
          transform: translateX(4px);
        }
        .partner-feature-section {
          padding: 2.5rem 0 4.5rem 0;
          background: #fdfbf7;
        }
        .partner-banner-card {
          background: linear-gradient(135deg, #0A1235 0%, #152259 100%);
          border-radius: 24px;
          padding: 3rem 3.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2.5rem;
          color: #fff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px -10px rgba(10, 18, 53, 0.35);
        }
        .partner-banner-card::after {
          content: '';
          position: absolute;
          right: -50px;
          bottom: -50px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(246, 192, 66, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .partner-banner-text h2 {
          color: #fff;
          font-size: 2rem;
          margin: 0.6rem 0 1rem 0;
        }
        .partner-banner-text h2 em {
          color: #F6C042;
          font-style: normal;
        }
        .partner-banner-text p {
          color: #cbd5e1;
          font-size: 0.95rem;
          max-width: 580px;
          line-height: 1.6;
        }
        .partner-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          margin-top: 1.4rem;
        }
        .partner-badges span {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          font-size: 0.78rem;
          padding: 0.35rem 0.8rem;
          border-radius: 50px;
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .partner-banner-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }
        .btn-partner-cta {
          background: #F6C042;
          color: #0A1235;
          border: none;
          padding: 1.1rem 2rem;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 8px 25px rgba(246, 192, 66, 0.3);
          white-space: nowrap;
        }
        .btn-partner-cta:hover {
          background: #ffcf56;
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(246, 192, 66, 0.45);
        }
        .partner-banner-action small {
          color: #94a3b8;
          font-size: 0.75rem;
        }
        @media (max-width: 900px) {
          .partner-banner-card {
            flex-direction: column;
            padding: 2.2rem;
            text-align: left;
            align-items: flex-start;
          }
          .partner-banner-action {
            width: 100%;
            align-items: flex-start;
          }
          .btn-partner-cta {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}

