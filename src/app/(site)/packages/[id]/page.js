'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getPackageBySlug, getPackage, getSiteSettings } from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';
import useImagesLoaded from '@/components/site/useImagesLoaded';

export default function PackageDetailPage() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [bySlug, st] = await Promise.all([getPackageBySlug(id), getSiteSettings()]);
        const found = bySlug || await getPackage(id);
        if (found) setPkg(found);
        if (st) setSettings(st);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!pkg) return;
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
  }, [pkg]);

  const imagesReady = useImagesLoaded(!loading);

  if (loading) return <LoadingScreen />;

  if (!pkg) {
    return (
      <>
        <Navbar activePage="packages" />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ color: 'var(--navy)' }}>Package not found</h2>
          <Link href="/packages" className="btn btn-primary">Back to Packages</Link>
        </div>
        <Footer settings={settings} />
      </>
    );
  }

  const allImages = [pkg.image, ...(pkg.images || [])].filter(Boolean);
  const highlights = Array.isArray(pkg.highlights) ? pkg.highlights : [];
  const inclusions = Array.isArray(pkg.inclusions) ? pkg.inclusions : [];
  const exclusions = Array.isArray(pkg.exclusions) ? pkg.exclusions : [];
  const itinerary = Array.isArray(pkg.itinerary) ? pkg.itinerary : [];
  const longDesc = pkg.longDescription || pkg.description || '';
  const paragraphs = longDesc.split('\n\n').filter(Boolean);

  return (
    <>
      {!imagesReady && <LoadingScreen />}
      <Navbar activePage="packages" />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="svc-detail-hero"
        style={!allImages[0] ? { background: '#050b26' } : {}}
      >
        {allImages[0] && (
          <div className="svc-detail-hero-bg">
            <img src={allImages[0]} alt={pkg.title} />
            <div className="svc-detail-hero-overlay" />
          </div>
        )}
        <div className="svc-detail-hero-content container">
          <div className="svc-detail-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/packages">Packages</Link>
            <span>/</span>
            <span>{pkg.title}</span>
          </div>
          <h1>{pkg.title}</h1>
          <div className="pkg-hero-meta">
            {pkg.location && (
              <span>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {pkg.location}
              </span>
            )}
            {pkg.duration && (
              <span>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {pkg.duration}
              </span>
            )}
            {pkg.price && (
              <span>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                {pkg.price}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <section className="svc-detail-body">
        <div className="container">
          <div className="svc-detail-grid">

            {/* Left — Overview, Gallery, Itinerary */}
            <div className="svc-detail-main">
              <div className="reveal">
                <h2 className="svc-detail-section-title">About this trip</h2>
                <div className="svc-detail-desc">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              {highlights.length > 0 && (
                <div className="svc-detail-highlights reveal">
                  <h3>Trip Highlights</h3>
                  <ul>
                    {highlights.map((h, i) => (
                      <li key={i}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Image Gallery */}
              {allImages.length > 1 && (
                <div className="svc-detail-gallery reveal">
                  <h3>Gallery</h3>
                  <div className="svc-gallery-main">
                    <img src={allImages[activeImg]} alt={pkg.title} />
                  </div>
                  <div className="svc-gallery-thumbs">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        className={`svc-gallery-thumb${activeImg === i ? ' active' : ''}`}
                        onClick={() => setActiveImg(i)}
                      >
                        <img src={img} alt={`${pkg.title} ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary */}
              {itinerary.length > 0 && (
                <div className="pkg-itinerary reveal">
                  <h3>Day-by-Day Itinerary</h3>
                  <div className="pkg-itin-list">
                    {itinerary.map((step, i) => (
                      <div className="pkg-itin-item" key={i}>
                        <div className="pkg-itin-marker">
                          <span>{i + 1}</span>
                        </div>
                        <div className="pkg-itin-content">
                          <span className="pkg-itin-day">{step.day || `Day ${i + 1}`}</span>
                          <h4>{step.title}</h4>
                          {step.description && <p>{step.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <div className="pkg-incex reveal">
                  <h3>What's Included</h3>
                  <div className="pkg-incex-grid">
                    {inclusions.length > 0 && (
                      <div className="pkg-incex-col">
                        <h4 className="pkg-incex-yes">Inclusions</h4>
                        <ul>
                          {inclusions.map((item, i) => (
                            <li key={i}>
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exclusions.length > 0 && (
                      <div className="pkg-incex-col">
                        <h4 className="pkg-incex-no">Exclusions</h4>
                        <ul>
                          {exclusions.map((item, i) => (
                            <li key={i}>
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right — Sticky CTA Card */}
            <aside className="svc-detail-sidebar">
              <div className="svc-cta-card reveal">
                <div className="svc-cta-card-head">
                  <span>Tour Package</span>
                  <h3>{pkg.title}</h3>
                </div>
                <div className="svc-cta-card-body">
                  {(pkg.price || pkg.duration) && (
                    <div className="pkg-cta-facts">
                      {pkg.price && (
                        <div className="pkg-cta-fact">
                          <span>Price</span>
                          <strong>{pkg.price}{pkg.priceNote ? ` · ${pkg.priceNote}` : ''}</strong>
                        </div>
                      )}
                      {pkg.duration && (
                        <div className="pkg-cta-fact">
                          <span>Duration</span>
                          <strong>{pkg.duration}</strong>
                        </div>
                      )}
                      {pkg.location && (
                        <div className="pkg-cta-fact">
                          <span>Destination</span>
                          <strong>{pkg.location}</strong>
                        </div>
                      )}
                    </div>
                  )}
                  <p>Speak with a dedicated advisor — we handle every booking, transfer, and detail of your trip.</p>
                  <Link href="/contact" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}>
                    Enquire Now
                  </Link>
                  <a
                    href={settings.whatsapp || '#'}
                    className="btn btn-outline"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '.75rem' }}
                  >
                    WhatsApp Us
                  </a>
                  {settings.phone1 && (
                    <a
                      href={`tel:${settings.phone1.replace(/\s/g, '')}`}
                      className="svc-cta-phone"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91" />
                      </svg>
                      {settings.phone1}
                    </a>
                  )}
                </div>
              </div>

              <div className="svc-back-link">
                <Link href="/packages">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  All Packages
                </Link>
              </div>
            </aside>
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
                <Link href="/packages" className="btn btn-ghost">All Packages</Link>
              </div>
            </div>
            <div className="cta-right reveal">
              <div className="phone-block">
                <span>Call us directly</span>
                <a href={`tel:${(settings.phone1 || '8592002549').replace(/\s/g, '')}`}>{settings.phone1 || '859 2002 549'}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </>
  );
}
