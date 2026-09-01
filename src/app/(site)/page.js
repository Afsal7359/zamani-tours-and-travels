'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import {
  getHomeContent,
  getServices,
  getPackages,
  getTestimonials,
  getSiteSettings,
  getGallery,
  getVideoGallery,
  getFeedbackGallery,
} from '@/lib/firestore';
import { defaultGallery, defaultFeedbackGallery, defaultVideoGallery } from '@/lib/defaultData';
import LoadingScreen from '@/components/site/LoadingScreen';
import useImagesLoaded from '@/components/site/useImagesLoaded';
import PackageCard from '@/components/site/PackageCard';
import ReelModal from '@/components/site/ReelModal';
import PhotoReelModal from '@/components/site/PhotoReelModal';

function getSlideConnectionClass(list, i) {
  if (!list || list.length <= 1) return '';
  const item = list[i];
  const prev = list[(i - 1 + list.length) % list.length];
  
  if (item?.connectNext && !prev?.connectNext) return 'gallery-connect-start';
  if (item?.connectNext && prev?.connectNext) return 'gallery-connect-middle';
  if (!item?.connectNext && prev?.connectNext) return 'gallery-connect-end';
  return '';
}

function getVideoPoster(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto,w_600/').replace(/\.[^/.]+$/, '.jpg');
  }
  return url.replace(/\.[^/.]+$/, '.jpg');
}

function VideoMarqueeCard({ item, index, totalLength, conn, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);
  const poster = getVideoPoster(item.src);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div
      className={`gallery-slide gallery-video-slide ${conn} ${item.span === 2 ? 'gallery-slide-span-2' : item.span === 3 ? 'gallery-slide-span-3' : ''}`}
      aria-hidden={index >= totalLength}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {poster && (
        <img
          src={poster}
          alt={`Video thumbnail ${(index % totalLength) + 1}`}
          className="gallery-video-poster"
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            opacity: isHovered ? 0 : 1,
            transition: 'opacity 0.35s ease',
            pointerEvents: 'none',
          }}
        />
      )}
      <video
        ref={videoRef}
        src={item.src}
        muted
        loop
        playsInline
        preload="metadata"
        className="gallery-video-element"
        style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />
      <div className="gallery-video-overlay" style={{ zIndex: 2 }}>
        <div className="gallery-video-play-btn">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="gallery-video-tag">
          {item.span === 3 ? 'Panorama Reel' : item.span === 2 ? 'Wide Reel' : 'Watch Reel'}
        </span>
      </div>
    </div>
  );
}

function normalizeGalleryList(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map(item => {
      if (typeof item === 'string') return { src: item, span: 1, connectNext: false };
      if (item && typeof item === 'object') {
        return {
          src: item.src || item.url || '',
          span: [1, 2, 3].includes(Number(item.span)) ? Number(item.span) : 1,
          connectNext: Boolean(item.connectNext),
        };
      }
      return null;
    })
    .filter(item => item && Boolean(item.src));
}

function createMarqueeItems(items, minCount = 12) {
  if (!items || !items.length) return [];
  let list = [...items];
  while (list.length < minCount) {
    list = [...list, ...items];
  }
  return [...list, ...list];
}

export default function HomePage() {
  const router = useRouter();
  const [home, setHome] = useState(null);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [settings, setSettings] = useState({});
  const [gallery, setGallery] = useState([]);
  const [videoGallery, setVideoGallery] = useState([]);
  const [feedbackGallery, setFeedbackGallery] = useState([]);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [selectedFeedbackIndex, setSelectedFeedbackIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const pkgTrackRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [h, s, p, t, st, g, vg, fg] = await Promise.all([
          getHomeContent(),
          getServices(),
          getPackages(),
          getTestimonials(),
          getSiteSettings(),
          getGallery(),
          getVideoGallery(),
          getFeedbackGallery(),
        ]);
        if (h) setHome(h);
        if (s) setServices(s);
        if (p) setPackages(p);
        if (t) setTestimonials(t);
        if (st) setSettings(st);
        if (g?.images?.length) setGallery(normalizeGalleryList(g.images));
        if (vg?.videos?.length) setVideoGallery(normalizeGalleryList(vg.videos));
        if (fg?.images?.length) setFeedbackGallery(normalizeGalleryList(fg.images));
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
  }, [home, services, packages, testimonials, loading]);

  useEffect(() => {
    if (loading || !packages.length) return;
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 768px)').matches) return;
    const track = pkgTrackRef.current;
    if (!track) return;
    const id = setInterval(() => {
      const max = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= max - 4) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: track.clientWidth * 0.82, behavior: 'smooth' });
      }
    }, 3200);
    return () => clearInterval(id);
  }, [packages, loading]);

  const imagesReady = useImagesLoaded(!loading);

  const marqueeItems = home?.marqueeItems || [];
  const doubled = marqueeItems.length ? [...marqueeItems, ...marqueeItems] : [];
  const galleryStrip = gallery.length ? gallery : normalizeGalleryList(defaultGallery.images);
  const videoStrip = videoGallery.length ? videoGallery : normalizeGalleryList(defaultVideoGallery.videos);
  const feedbackStrip = feedbackGallery.length ? feedbackGallery : normalizeGalleryList(defaultFeedbackGallery.images);

  const marqueeGallery = createMarqueeItems(galleryStrip);
  const marqueeVideos = createMarqueeItems(videoStrip);
  const marqueeFeedbacks = createMarqueeItems(feedbackStrip);

  return (
    <>
      <LoadingScreen isReady={!loading && imagesReady} />
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

      {/* ─── Gallery Strip ────────────────────────────────────────────── */}
      <section className="gallery-strip">
        <div className="container">
          <div className="gallery-head reveal">
            <span className="eyebrow royal">Our Gallery</span>
            <h2>Moments from<br /><em>our journey.</em></h2>
            <p>A glimpse inside our services, video highlights, banners, and the travellers we are proud to serve.</p>
          </div>

          <div className="gallery-row-label">
            <span className="gallery-row-badge">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Company Banners &amp; Updates
            </span>
            <span className="gallery-row-desc">Latest service announcements, packages &amp; posters</span>
          </div>
        </div>

        <div className="gallery-marquee">
          <div className="gallery-marquee-track">
            {marqueeGallery.map((item, i) => {
              const conn = getSlideConnectionClass(marqueeGallery, i);
              return (
                <div
                  className={`gallery-slide gallery-clickable-slide ${conn} ${item.span === 2 ? 'gallery-slide-span-2' : item.span === 3 ? 'gallery-slide-span-3' : ''}`}
                  key={`g1-${i}`}
                  aria-hidden={i >= galleryStrip.length}
                  onClick={() => setSelectedPhotoIndex(i % galleryStrip.length)}
                  role="button"
                  tabIndex={0}
                >
                  <img src={item.src} alt={`Zamani gallery ${(i % galleryStrip.length) + 1}`} loading="lazy" />
                </div>
              );
            })}
          </div>
        </div>

        {videoStrip.length > 0 && (
          <>
            <div className="container" style={{ marginTop: '2.5rem' }}>
              <div className="gallery-row-label">
                <span className="gallery-row-badge video-badge">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Video Highlights &amp; Reels
                </span>
                <span className="gallery-row-desc">Real glimpses of our tours, destinations &amp; experiences</span>
              </div>
            </div>

            <div className="gallery-marquee">
              <div className="gallery-marquee-track">
                {marqueeVideos.map((item, i) => {
                  const conn = getSlideConnectionClass(marqueeVideos, i);
                  return (
                    <VideoMarqueeCard
                      key={`gv-${i}`}
                      item={item}
                      index={i}
                      totalLength={videoStrip.length}
                      conn={conn}
                      onSelect={() => setSelectedVideoIndex(i % videoStrip.length)}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="container" style={{ marginTop: '2.5rem' }}>
          <div className="gallery-row-label">
            <span className="gallery-row-badge feedback-badge">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Customer Feedbacks &amp; Reviews
            </span>
            <span className="gallery-row-desc">Real stories, reviews &amp; happy traveller memories</span>
          </div>
        </div>

        <div className="gallery-marquee gallery-marquee-reverse">
          <div className="gallery-marquee-track">
            {marqueeFeedbacks.map((item, i) => {
              const conn = getSlideConnectionClass(marqueeFeedbacks, i);
              return (
                <div
                  className={`gallery-slide gallery-clickable-slide ${conn} ${item.span === 2 ? 'gallery-slide-span-2' : item.span === 3 ? 'gallery-slide-span-3' : ''}`}
                  key={`g2-${i}`}
                  aria-hidden={i >= feedbackStrip.length}
                  onClick={() => setSelectedFeedbackIndex(i % feedbackStrip.length)}
                  role="button"
                  tabIndex={0}
                >
                  <img src={item.src} alt={`Customer review ${(i % feedbackStrip.length) + 1}`} loading="lazy" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full-Screen Interactive Video Reels Modal */}
      {selectedVideoIndex !== null && (
        <ReelModal
          videos={videoStrip}
          initialIndex={selectedVideoIndex}
          onClose={() => setSelectedVideoIndex(null)}
        />
      )}

      {/* Full-Screen Interactive Photo Reels Modal (Company Banners) */}
      {selectedPhotoIndex !== null && (
        <PhotoReelModal
          photos={galleryStrip}
          initialIndex={selectedPhotoIndex}
          categoryTitle="Company Banners & Moments"
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}

      {/* Full-Screen Interactive Photo Reels Modal (Customer Feedbacks & Reviews) */}
      {selectedFeedbackIndex !== null && (
        <PhotoReelModal
          photos={feedbackStrip}
          initialIndex={selectedFeedbackIndex}
          categoryTitle="Customer Reviews & Stories"
          onClose={() => setSelectedFeedbackIndex(null)}
        />
      )}

      {/* ─── Tour Packages ────────────────────────────────────────────── */}
      {packages.length > 0 && (
        <section className="home-packages">
          <div className="container">
            <div className="home-pkg-head">
              <span className="eyebrow royal">Tour Packages</span>
              <h2>Handpicked trips,<br /><em>ready to go.</em></h2>
              <p>Curated island escapes and hill-country getaways — every transfer, stay, and detail arranged for you.</p>
            </div>
            <div className="home-pkg-track" ref={pkgTrackRef}>
              {packages.slice(0, 4).map((pkg, i) => (
                <PackageCard key={pkg.id || i} pkg={pkg} index={i} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link href="/packages" className="btn btn-primary">
                More Packages
                <span className="arr">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8L8 2M8 2H3M8 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </section>
      )}

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
