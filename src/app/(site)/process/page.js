'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getProcessSteps, getSiteSettings } from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';
import useImagesLoaded from '@/components/site/useImagesLoaded';

const faqs = [
  { q: 'How quickly can you process a visa?', a: 'Turnaround times depend on the destination and visa type. Standard visas typically take 3–7 working days, while express or tatkal processing can be done in 24–48 hours for eligible applications. We always advise you on the realistic timeline before you confirm.' },
  { q: 'Do I need to visit your office in person?', a: 'Not necessarily. Many services — including visa applications, attestations, and flight bookings — can be handled remotely via WhatsApp or email. We will guide you on exactly what documents to send and how.' },
  { q: 'Are there any hidden fees in your quotes?', a: 'Absolutely not. Every quote we provide is fully itemised — you see exactly what each component costs. What we quote is what you pay, with no surprises at any stage.' },
  { q: 'Do you offer support after booking?', a: 'Yes. From the moment you confirm with us to the day you return home, your dedicated advisor is available. For urgent travel emergencies, our support line is available 24/7.' },
  { q: 'Can you handle group bookings and corporate travel?', a: 'Yes, we regularly handle group Umrah packages, family holidays, and corporate GCC work visa batches. We have specialised processes for group documentation and can negotiate better rates for larger groups.' },
  { q: 'What payment methods do you accept?', a: 'We accept bank transfers, UPI, cash at our office, and can arrange flexible payment schedules for large packages. All transactions are documented and receipts are provided for every payment.' },
];

export default function ProcessPage() {
  const [steps, setSteps] = useState([]);
  const [settings, setSettings] = useState({});
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, st] = await Promise.all([getProcessSteps(), getSiteSettings()]);
        if (s) setSteps(s);
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
    }, { threshold: 0.01, rootMargin: '0px 0px 80px 0px' });
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i % 3) * 35 + 'ms';
      io.observe(el);
    });
    return () => io.disconnect();
  }, [steps, loading]);

  const imagesReady = useImagesLoaded(!loading);

  return (
    <>
      <Navbar activePage="process" />

      {/* ─── Page Hero ─────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-bg">
          {settings?.bannerProcess && <img src={settings.bannerProcess} alt="Our process" />}
        </div>
        <div className="page-hero-content container">
          <span className="eyebrow light">How It Works</span>
          <h1>Simple steps,<br /><em>seamless journey.</em></h1>
          <p>From your first enquiry to your safe return — here's exactly how Zamani works for you.</p>
        </div>
      </section>

      {/* ─── Steps ─────────────────────────────────────────────────────── */}
      <section className="steps-section">
        <div className="container">
          <div className="steps-head">
            <span className="eyebrow royal">The Process</span>
            <h2>Four steps to your<br /><em>perfect journey.</em></h2>
            <p>We've refined our process over 15 years to make your experience as smooth and stress-free as possible.</p>
          </div>
          <div className="steps-list">
            {steps.map((step, i) => (
              <div className={`step-row reveal${i % 2 === 1 ? ' reverse' : ''}`} key={step.id || i}>
                <div className="step-content">
                  <div className="step-tag">{step.tag || `Step ${step.num}`}</div>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                  {step.items && step.items.length > 0 && (
                    <ul>
                      {step.items.map((item, ii) => (
                        <li key={ii}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="step-center">
                  <div className="step-circle">{step.num}</div>
                  <div className="step-line" />
                </div>
                <div className="step-visual">
                  <img src={step.image} alt={step.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why It Works ──────────────────────────────────────────────── */}
      <section className="why-works">
        <div className="container">
          <span className="eyebrow royal" style={{ display: 'flex', justifyContent: 'center', marginBottom: '.5rem' }}>Why Our Process Works</span>
          <h2>Built around you,<br /><em>every time.</em></h2>
          <div className="why-features">
            {[
              { title: 'Human-First Approach', desc: 'Every enquiry is handled by a real advisor — not a form or a bot. We listen before we advise.', icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )},
              { title: 'End-to-End Management', desc: 'We handle every step of the process — you only need to provide documents and trust us to deliver.', icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              )},
              { title: 'Real-Time Updates', desc: 'We keep you informed at every milestone — via WhatsApp, call or email, whichever works for you.', icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91"/></svg>
              )},
              { title: 'Post-Travel Care', desc: 'Even after you return, we follow up and are available for renewals, follow-on services, or anything you need.', icon: (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              )},
            ].map((feat, i) => (
              <div className="why-feat reveal" key={i}>
                <div className="feat-icon">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      <section className="faq">
        <div className="container">
          <div className="faq-head">
            <span className="eyebrow royal">FAQ</span>
            <h2>Common questions,<br /><em>clear answers.</em></h2>
            <p>Everything you need to know about working with Zamani.</p>
          </div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div className="faq-item" key={i}>
                <button
                  className={`faq-q${openFaq === i ? ' open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <div className={`faq-a${openFaq === i ? ' open' : ''}`}>
                  <div className="faq-a-inner">{faq.a}</div>
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
              <span className="eyebrow light">Ready to Start?</span>
              <h2>Begin your journey<br /><em>with a single call.</em></h2>
              <p>No obligation. No complexity. Just a conversation about where you want to go.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary">Get in Touch</Link>
                <a href={settings.whatsapp || '#'} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                  WhatsApp Us
                </a>
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
