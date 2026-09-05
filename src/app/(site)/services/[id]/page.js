'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getServiceBySlug, getService, getSiteSettings } from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';
import useImagesLoaded from '@/components/site/useImagesLoaded';
import DetailGallerySlider from '@/components/site/DetailGallerySlider';

const iconMap = {
  plane: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91"/><path d="M21 2l-9 9M15 2h6v6"/></svg>,
  passport: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M9 8h6M9 16h6"/></svg>,
  stamp: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  mosque: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  suitcase: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  id: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 9h4M14 12h4M14 15h2"/></svg>,
  document: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  shield: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  work: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  temple: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M3 10h18M5 21V10M19 21V10M12 3L3 10M12 3l9 7"/></svg>,
  forex: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 9h6a2 2 0 010 4H8"/></svg>,
};

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [bySlug, st] = await Promise.all([getServiceBySlug(id), getSiteSettings()]);
        const svc = bySlug || await getService(id);
        if (svc) setService(svc);
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
    if (!service) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: '120px 0px' });
    
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i % 3) * 30 + 'ms';
      io.observe(el);
      // Failsafe: Ensure visible in case observer doesn't fire immediately
      setTimeout(() => el.classList.add('in'), 350 + i * 30);
    });
    return () => io.disconnect();
  }, [service]);

  if (loading) {
    return (
      <>
        <Navbar activePage="services" />
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 42, height: 42, border: '3px solid rgba(200,169,110,0.2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        </div>
        <Footer settings={settings} />
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Navbar activePage="services" />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ color: 'var(--navy)' }}>Service not found</h2>
          <Link href="/services" className="btn btn-primary">Back to Services</Link>
        </div>
        <Footer settings={settings} />
      </>
    );
  }

  const allImages = [service.image, ...(service.images || [])].filter(Boolean);
  const highlights = Array.isArray(service.highlights) ? service.highlights : [];
  const faqs = Array.isArray(service.faqs) ? service.faqs : [];
  const longDesc = service.longDescription || service.description || '';
  const paragraphs = longDesc.split('\n\n').filter(Boolean);

  return (
    <>
      <Navbar activePage="services" />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="svc-detail-hero"
        style={!allImages[0] ? { background: '#050b26' } : {}}
      >
        {allImages[0] && (
          <div className="svc-detail-hero-bg">
            {/\.(mp4|webm|mov|ogg)($|\?)/i.test(allImages[0]) || allImages[0].includes('/video/upload/') ? (
              <video
                src={allImages[0]}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img src={allImages[0]} alt={service.title} />
            )}
            <div className="svc-detail-hero-overlay" />
          </div>
        )}
        <div className="svc-detail-hero-content container">
          <div className="svc-detail-breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/services">Services</Link>
            <span>/</span>
            <span>{service.title}</span>
          </div>
          <h1>{service.title}</h1>
        </div>
      </section>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <section className="svc-detail-body">
        <div className="container">
          <div className="svc-detail-grid">

            {/* Left — Description + Highlights */}
            <div className="svc-detail-main">
              <div className="reveal">
                <h2 className="svc-detail-section-title">{service.title}</h2>
                <div className="svc-detail-desc">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              {highlights.length > 0 && (
                <div className="svc-detail-highlights reveal">
                  <h3>What's Included</h3>
                  <ul>
                    {highlights.map((h, i) => (
                      <li key={i}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Image Gallery */}
              <DetailGallerySlider images={allImages} title={service.title} />

              {/* FAQs */}
              {faqs.length > 0 && (
                <div className="svc-detail-faqs reveal">
                  <h3>Frequently Asked Questions</h3>
                  <div className="svc-faq-list">
                    {faqs.map((faq, i) => (
                      <div key={i} className={`svc-faq-item${openFaq === i ? ' open' : ''}`}>
                        <button
                          className="svc-faq-q"
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        >
                          {faq.q}
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                        {openFaq === i && (
                          <div className="svc-faq-a">{faq.a}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — Sticky CTA Card */}
            <aside className="svc-detail-sidebar">
              <div className="svc-cta-card reveal">
                <div className="svc-cta-card-head">
                  <span>Ready to get started?</span>
                  <h3>{service.title}</h3>
                </div>
                <div className="svc-cta-card-body">
                  <p>Speak with a dedicated advisor — we handle everything from documents to departure.</p>
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
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91"/>
                      </svg>
                      {settings.phone1}
                    </a>
                  )}
                </div>
              </div>

              <div className="svc-back-link">
                <Link href="/services">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                  </svg>
                  All Services
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
                <Link href="/services" className="btn btn-ghost">All Services</Link>
              </div>
            </div>
            <div className="cta-right reveal">
              <div className="phone-block">
                <span>Call us directly</span>
                <a href={`tel:${(settings.phone1 || '8592042002').replace(/\s/g, '')}`}>{settings.phone1 || '859 2042 002'}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </>
  );
}
