'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getAboutContent, getSiteSettings, getGallery } from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';
import useImagesLoaded from '@/components/site/useImagesLoaded';
import PhotoReelModal from '@/components/site/PhotoReelModal';

function normalizeGalleryItems(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map(item => {
      if (typeof item === 'string') return { src: item, span: 1 };
      if (item && typeof item === 'object') {
        return {
          src: item.src || item.url || '',
          span: [1, 2, 3].includes(Number(item.span)) ? Number(item.span) : 1,
        };
      }
      return null;
    })
    .filter(item => item && Boolean(item.src));
}

const fallbackGallery = Array.from(
  { length: 17 },
  (_, i) => ({ src: `/images/gallery-${String(i + 1).padStart(2, '0')}.jpeg`, span: 1 })
);

export default function AboutPage() {
  const [about, setAbout] = useState(null);
  const [settings, setSettings] = useState({});
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [a, s, g] = await Promise.all([getAboutContent(), getSiteSettings(), getGallery()]);
        if (a) setAbout(a);
        if (s) setSettings(s);
        if (g?.images?.length) setGallery(normalizeGalleryItems(g.images));
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
    }, { threshold: 0.01, rootMargin: '0px 0px 80px 0px' });
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i % 3) * 35 + 'ms';
      io.observe(el);
    });
    return () => io.disconnect();
  }, [about, loading]);

  const imagesReady = useImagesLoaded(!loading);

  const values = about?.values || [];
  const timeline = about?.timeline || [];
  const galleryList = gallery.length ? gallery : fallbackGallery;

  return (
    <>
      <LoadingScreen isReady={!loading && imagesReady} />
      <Navbar activePage="about" />

      {/* ─── Page Hero ─────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-bg">
          {about?.heroImage && <img src={about.heroImage} alt="About Zamani" />}
        </div>
        <div className="page-hero-content container">
          <span className="eyebrow light">About Us</span>
          <h1>
            {about?.heroTitle}{' '}
            <em>{about?.heroTitleEm}</em><br />
            {about?.heroTitleSuffix}
          </h1>
          <p>{about?.heroLead}</p>
        </div>
      </section>

      {/* ─── Marquee ───────────────────────────────────────────────────── */}
      <div className="marquee">
        <div className="marquee-track">
          {['Trust', 'Precision', 'Care', 'Experience', 'Integrity', 'Community', 'Global Reach', 'Local Heart', 'Trust', 'Precision', 'Care', 'Experience', 'Integrity', 'Community', 'Global Reach', 'Local Heart'].map((item, i) => (
            <span key={i}>{item} <span className="dot">✦</span></span>
          ))}
        </div>
      </div>

      {/* ─── Story ─────────────────────────────────────────────────────── */}
      <section className="story">
        <div className="container">
          <div className="story-grid">
            <div className="story-text reveal">
              <span className="eyebrow royal">Our Story</span>
              <h2>Where every journey<br /><em>begins with trust.</em></h2>
              <p>{about?.storyP1}</p>
              <p>{about?.storyP2}</p>
              <p>{about?.storyP3}</p>
              <div className="story-stats">
                <div className="stat">
                  <div className="num">15+</div>
                  <div className="lbl">Years of service</div>
                </div>
                <div className="stat">
                  <div className="num">12K+</div>
                  <div className="lbl">Happy clients</div>
                </div>
                <div className="stat">
                  <div className="num">11</div>
                  <div className="lbl">Services offered</div>
                </div>
              </div>
            </div>
            <div className="story-visual reveal">
              <img className="img-main" src={about?.storyImg1 || '/images/gallery-03.jpeg'} alt="Zamani office" />
              <img className="img-accent" src={about?.storyImg2 || '/images/gallery-08.jpeg'} alt="Zamani team" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Values ─────────────────────────────────────────────────────── */}
      <section className="values">
        <div className="container">
          <div className="values-head">
            <span className="eyebrow royal">Our Values</span>
            <h2>The principles that<br /><em>guide us.</em></h2>
            <p>These are not slogans on a wall — they are the standards every client experiences when they walk through our door.</p>
          </div>
          <div className="values-grid">
            {values.map((val, i) => (
              <div className="value-card reveal" key={i}>
                <div className="vc-num">0{i + 1}</div>
                <h3>{val.title}</h3>
                <p>{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Timeline ───────────────────────────────────────────────────── */}
      <section className="timeline">
        <div className="container">
          <span className="eyebrow light" style={{ display: 'flex', justifyContent: 'center', marginBottom: '.5rem' }}>Our Journey</span>
          <h2>Fifteen years of<br /><em>milestones.</em></h2>
          <div className="tl-list">
            {timeline.map((item, i) => (
              <div className="tl-item reveal" key={i}>
                <div className="tl-year">{item.year}</div>
                <div className="tl-dot" />
                <div className="tl-body">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gallery ────────────────────────────────────────────────────── */}
      <section className="gallery">
        <div className="container">
          <div className="gallery-head">
            <span className="eyebrow royal">Our Gallery</span>
            <h2>Moments from<br /><em>our journey.</em></h2>
            <p>A glimpse inside our office, our team, and the travellers we have had the privilege to serve.</p>
          </div>
          <div className="gallery-grid">
            {galleryList.map((item, i) => (
              <button
                type="button"
                className={`gallery-item reveal ${item.span === 2 ? 'gallery-span-2' : item.span === 3 ? 'gallery-span-3' : ''}`}
                key={`${item.src}-${i}`}
                onClick={() => setLightbox(i)}
                aria-label={`View gallery image ${i + 1}`}
              >
                <img src={item.src} alt={`Zamani gallery ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why ──────────────────────────────────────────────────────── */}
      <section className="why">
        <div className="container">
          <div className="why-grid">
            <div className="why-text reveal">
              <span className="eyebrow royal">Why Choose Us</span>
              <h2>A desk you can<br /><em>truly rely on.</em></h2>
              <p>We do not outsource your journey. Every case is handled by our own team — with the same care we would give a family member.</p>
              <div className="why-list">
                {[
                  { title: 'Licensed & Fully Accredited', desc: 'Registered travel agency with all necessary approvals and certifications.' },
                  { title: 'On-Time Delivery, Every Time', desc: 'Visas, passports, and tickets ready when we promise — no surprises.' },
                  { title: 'Single Point of Contact', desc: 'One advisor handles your entire case — from first call to final delivery.' },
                  { title: 'Transparent Pricing, Always', desc: 'Clear itemised quotes before we begin — what we quote is what you pay.' },
                ].map((item, i) => (
                  <div className="why-item" key={i}>
                    <div className="icon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="text">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/contact" className="btn btn-primary" style={{ marginTop: '2rem' }}>
                Get in Touch
              </Link>
            </div>
            <div className="why-visual reveal">
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80" alt="Our team" />
              <div className="why-quote">
                <p>"Zamani handled everything — I just had to show up at the airport."</p>
                <cite>— Rashid M., Job Visa · Dubai</cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="cta">
        <div className="container">
          <div className="cta-inner">
            <div className="reveal">
              <span className="eyebrow light">Start Today</span>
              <h2>Your journey begins<br /><em>with one call.</em></h2>
              <p>No lengthy forms. No waiting. Just a conversation with someone who cares.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary">Contact Us</Link>
                {settings?.whatsapp && (
                  <a href={settings.whatsapp} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                    WhatsApp Us
                  </a>
                )}
              </div>
            </div>
            <div className="cta-right reveal">
              {settings?.phone1 && (
                <div className="phone-block">
                  <span>Call us directly</span>
                  <a href={`tel:${settings.phone1.replace(/\s/g, '')}`}>{settings.phone1}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Full-Screen Photo Reel Lightbox ────────────────────────── */}
      {lightbox !== null && (
        <PhotoReelModal
          photos={galleryList}
          initialIndex={lightbox}
          categoryTitle="Moments From Our Journey"
          onClose={() => setLightbox(null)}
        />
      )}

      <Footer settings={settings} />
    </>
  );
}
