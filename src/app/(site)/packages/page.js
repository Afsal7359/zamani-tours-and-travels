'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getPackages, getSiteSettings } from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';

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

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Navbar activePage="packages" />

      {/* ─── Page Hero ─────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-bg">
          {settings?.bannerServices && <img src={settings.bannerServices} alt="Packages" />}
        </div>
        <div className="page-hero-content container">
          <span className="eyebrow light">Tour Packages</span>
          <h1>Curated journeys,<br /><em>ready to book.</em></h1>
          <p>Handpicked island escapes and hill-country getaways — every transfer, stay, and detail arranged for you.</p>
        </div>
      </section>

      {/* ─── Packages Grid ─────────────────────────────────────────────── */}
      <section className="svc-section">
        <div className="container">
          <div className="svc-head">
            <span className="eyebrow royal">Featured Destinations</span>
            <h2>Pick your<br /><em>perfect escape.</em></h2>
            <p>Each package is fully managed by our advisors — clear pricing, comfortable stays, and no hidden surprises.</p>
          </div>

          {packages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#5a627d' }}>No packages available yet. Please check back soon.</p>
          ) : (
            <div className="pkg-grid">
              {packages.map((pkg, i) => (
                <Link
                  href={`/packages/${pkg.slug || pkg.id}`}
                  className="pkg-card reveal"
                  key={pkg.id || i}
                >
                  <div className="pkg-img">
                    <img src={pkg.image} alt={pkg.title} />
                    {pkg.badge && <span className="pkg-badge">{pkg.badge}</span>}
                    {pkg.duration && <span className="pkg-duration">{pkg.duration}</span>}
                  </div>
                  <div className="pkg-body">
                    {pkg.location && (
                      <span className="pkg-location"><PinIcon />{pkg.location}</span>
                    )}
                    <h3>{pkg.title}</h3>
                    <p>{pkg.description}</p>
                    <div className="pkg-tags">
                      {(pkg.tags || []).slice(0, 3).map((tag, ti) => (
                        <span key={ti}>{tag}</span>
                      ))}
                    </div>
                    <div className="pkg-card-foot">
                      <div className="pkg-price">
                        {pkg.price && <strong>{pkg.price}</strong>}
                        {pkg.priceNote && <small>{pkg.priceNote}</small>}
                      </div>
                      <span className="pkg-view">
                        View Details
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
    </>
  );
}
