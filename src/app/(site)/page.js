'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import {
  getHomeContent,
  getServices,
  getDestinations,
  getTestimonials,
  getSiteSettings,
} from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';

export default function HomePage() {
  const router = useRouter();
  const [home, setHome] = useState(null);
  const [services, setServices] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [h, s, d, t, st] = await Promise.all([
          getHomeContent(),
          getServices(),
          getDestinations(),
          getTestimonials(),
          getSiteSettings(),
        ]);
        if (h) setHome(h);
        if (s) setServices(s);
        if (d) setDestinations(d);
        if (t) setTestimonials(t);
        if (st) setSettings(st);
      } catch (e) {
        console.error('Error loading home data:', e);
      } finally {
        setLoading(false);
      }
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
  }, [home, services, destinations, testimonials, loading]);

  if (loading) return <LoadingScreen />;

  const marqueeItems = home?.marqueeItems || [];
  const doubled = marqueeItems.length ? [...marqueeItems, ...marqueeItems] : [];

  return (
    <>
      <Navbar activePage="home" />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          {home?.heroImage && <img src={home.heroImage} alt="Hero" />}
        </div>
        <div className="hero-content container">
          <div className="hero-top">
            <div>
              <span className="eyebrow light">Zamani Tours &amp; Travels</span>
              <h1>
                {home?.heroTitle}<br />
                <em>{home?.heroTitleEm}</em><br />
                {home?.heroTitleSuffix}
              </h1>
              <p className="lead">{home?.heroLead}</p>
              <div className="hero-cta">
                <Link href="/contact" className="btn btn-primary">
                  Plan My Journey
                  <span className="arr">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 8L8 2M8 2H3M8 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </Link>
                <Link href="/services" className="btn btn-ghost">Explore Services</Link>
              </div>
            </div>
            <div className="hero-meta">
              <span>{home?.heroMetaLeft}</span>
              <strong>{home?.heroMetaTrust}</strong>
            </div>
          </div>

          <div className="hero-search">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.5)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Where would you like to go?" />
            <div className="divider" />
            <select>
              <option>Service</option>
              <option>Flights</option>
              <option>Visa</option>
              <option>Umrah</option>
              <option>Holiday</option>
              <option>Forex</option>
            </select>
            <button className="search-btn" aria-label="Search" onClick={() => router.push('/services')}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="hero-badge">
          <div className="big">{home?.heroBadgeNum}</div>
          <p>{home?.heroBadgeLabel}</p>
        </div>
      </section>

      {/* ─── Marquee ──────────────────────────────────────────────────── */}
      <div className="marquee">
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <span key={i}>{item}{i % marqueeItems.length !== marqueeItems.length - 1 ? '' : ''} <span className="dot">✦</span></span>
          ))}
        </div>
      </div>

      {/* ─── About ────────────────────────────────────────────────────── */}
      <section className="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-text reveal">
              <span className="eyebrow royal">Our Story</span>
              <h2>
                {home?.aboutTitle}{' '}
                <em>{home?.aboutTitleEm}</em><br />
                {home?.aboutTitleSuffix}
              </h2>
              <p>{home?.aboutP1}</p>
              <p>{home?.aboutP2}</p>
              <div className="about-stats">
                <div className="stat">
                  <div className="num">{home?.statYears}</div>
                  <div className="lbl">Years of service</div>
                </div>
                <div className="stat">
                  <div className="num">{home?.statClients}</div>
                  <div className="lbl">Happy clients</div>
                </div>
                <div className="stat">
                  <div className="num">{home?.statServices}</div>
                  <div className="lbl">Services offered</div>
                </div>
              </div>
              <Link href="/about" className="btn btn-outline" style={{ marginTop: '2rem' }}>
                Learn More About Us
              </Link>
            </div>
            <div className="about-visual reveal">
              {home?.aboutImg1 && <img className="img-main" src={home.aboutImg1} alt="About" />}
              {home?.aboutImg2 && <img className="img-accent" src={home.aboutImg2} alt="About" />}
              {home?.statClients && (
                <div className="trust-badge">
                  <strong>{home.statClients}</strong>
                  Clients trusted us
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Services ─────────────────────────────────────────────────── */}
      <section className="services">
        <div className="container">
          <div className="services-head">
            <div>
              <span className="eyebrow light">What We Do</span>
              <h2>Every service,<br /><em>under one roof.</em></h2>
            </div>
            <p className="sub">
              Flights, visas, Umrah, holiday packages, forex, attestation and more — all managed by dedicated specialists.
            </p>
          </div>
          <div className="services-grid">
            {services.map((svc, i) => (
              <Link
                href={`/services/${svc.slug || svc.id}`}
                className="service reveal"
                key={svc.id || i}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="svc-img-wrap">
                  <img src={svc.image} alt={svc.title} />
                </div>
                <div className="svc-body">
                  <div className="svc-num">{svc.num}</div>
                  <h3>{svc.title}</h3>
                  <p>{svc.description}</p>
                  <div className="svc-tags">
                    {(svc.tags || []).slice(0, 3).map((tag, ti) => (
                      <span key={ti}>{tag}</span>
                    ))}
                  </div>
                  <div className="svc-detail-link">
                    View Details
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/services" className="btn btn-ghost">
              View All Services
              <span className="arr">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M8 2H3M8 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Destinations ─────────────────────────────────────────────── */}
      <section className="destinations">
        <div className="container">
          <div className="dest-head">
            <div>
              <span className="eyebrow royal">Popular Destinations</span>
              <h2>Where will you<br /><em>go next?</em></h2>
            </div>
            <Link href="/contact" className="btn btn-outline">Enquire Now</Link>
          </div>
          <div className="dest-tabs">
            <button className="dest-tab active">All</button>
            <button className="dest-tab">Pilgrimage</button>
            <button className="dest-tab">Beach</button>
            <button className="dest-tab">City Break</button>
          </div>
          <div className="dest-grid">
            {destinations.map((dest, i) => (
              <div className="dest-card reveal" key={dest.id || i}>
                <img src={dest.image} alt={dest.name} />
                <div className="dest-info">
                  {dest.badge && <span className="badge">{dest.badge}</span>}
                  <h3>{dest.name}</h3>
                  <p>{dest.country}</p>
                  {dest.showPrice !== false && <div className="price">{dest.price}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process (static) ─────────────────────────────────────────── */}
      <section className="process">
        <div className="container">
          <div className="process-head">
            <span className="eyebrow royal">How It Works</span>
            <h2>Simple steps,<br /><em>seamless journey.</em></h2>
            <p>We make everything easy — from your first call to your safe return home.</p>
          </div>
          <div className="process-steps">
            {[
              { num: '01', title: 'Tell Us Your Plan', desc: 'Call, WhatsApp, or walk in. Tell us what you need and our team takes it from there.' },
              { num: '02', title: 'Get a Tailored Quote', desc: 'Receive a clear, itemised quote with no hidden fees — multiple options across budgets.' },
              { num: '03', title: 'We Handle Everything', desc: 'Your dedicated advisor manages bookings, visas, attestations and logistics end-to-end.' },
              { num: '04', title: 'Travel With Peace', desc: 'Step out with all documents in hand and our 24/7 support line available for anything.' },
            ].map((step, i) => (
              <div className="step reveal" key={i}>
                <div className="step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/process" className="btn btn-outline">See the Full Process</Link>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="features-text reveal">
              <span className="eyebrow light">Why Choose Zamani</span>
              <h2>Trusted by families,<br /><em>relied on by professionals.</em></h2>
              <p>For over 15 years, we have been the one desk every traveller in Kerala trusts — for the big journeys and the small details.</p>
              <div className="feature-list">
                {[
                  { title: 'Licensed & Registered Agency', desc: 'Fully accredited travel agency operating with complete legal compliance.' },
                  { title: 'Dedicated Human Advisor', desc: 'A real person handles your case — not a chatbot, not a call queue.' },
                  { title: 'Transparent, No-Hidden-Fee Pricing', desc: 'What we quote is what you pay. Every rupee explained.' },
                  { title: '24/7 Emergency Support', desc: "From departure to return — we're on call whenever you need us." },
                ].map((feat, i) => (
                  <div className="feature-item" key={i}>
                    <div className="icon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="text">
                      <h4>{feat.title}</h4>
                      <p>{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/about" className="btn btn-ghost" style={{ marginTop: '2rem' }}>
                Our Story
              </Link>
            </div>
            <div className="features-visual reveal">
              <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=80" alt="Zamani trusted service" />
              <div className="features-quote">
                <p>"They handled our Umrah from A to Z. Every call answered, every document ready on time."</p>
                <cite>— Fathima A., Umrah Client 2024</cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────── */}
      <section className="testimonials">
        <div className="container">
          <div className="test-head">
            <span className="eyebrow royal">Client Stories</span>
            <h2>Journeys they'll<br /><em>never forget.</em></h2>
            <p>Real experiences from real clients who trusted us with their most important trips.</p>
          </div>
          <div className="test-grid">
            {testimonials.map((t, i) => (
              <div className="test-card reveal" key={t.id || i}>
                <div className="stars">
                  {Array.from({ length: t.stars || 5 }).map((_, si) => (
                    <svg key={si} width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <blockquote>"{t.quote}"</blockquote>
                <div className="test-author">
                  <div className="avatar">{t.initials}</div>
                  <div>
                    <strong>{t.author}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="cta">
        <div className="container">
          <div className="cta-inner">
            <div className="reveal">
              <span className="eyebrow light">Ready to Travel?</span>
              <h2>Let's plan your<br /><em>next journey.</em></h2>
              <p>Speak with a dedicated advisor today. No commitment — just clarity.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary">Get Started</Link>
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
              {settings?.email && (
                <div className="phone-block">
                  <span>Or email us</span>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </>
  );
}
