'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getSiteSettings, saveContactSubmission } from '@/lib/firestore';

export default function ContactPage() {
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const s = await getSiteSettings();
        if (s) setSettings(s);
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  useEffect(() => {
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
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await saveContactSubmission(form);
      setSubmitted(true);
      setForm({ name: '', phone: '', email: '', service: '', message: '' });
    } catch (err) {
      setError('There was an error submitting your message. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <>
      <Navbar activePage="contact" />

      {/* ─── Page Hero ─────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-bg">
          {settings?.bannerContact && <img src={settings.bannerContact} alt="Contact us" />}
        </div>
        <div className="page-hero-content container">
          <span className="eyebrow light">Get in Touch</span>
          <h1>Let's plan your<br /><em>journey together.</em></h1>
          <p>Call, WhatsApp, email, or walk in — we're here for you, however you prefer to reach out.</p>
        </div>
      </section>

      {/* ─── Contact Section ───────────────────────────────────────────── */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info reveal">
              <span className="eyebrow royal">Contact Us</span>
              <h2>We're always<br /><em>available.</em></h2>
              <p>
                Whether it's a quick question about visa requirements or a full pilgrimage package enquiry — we're here to help. Reach out through any channel that works for you.
              </p>

              <div className="contact-channels">
                <div className="channel">
                  <div className="ch-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 8.82a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
                    </svg>
                  </div>
                  <div className="ch-text">
                    <h4>Direct Phone Contacts</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {settings?.phone1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a href={`tel:${settings.phone1.replace(/\s/g, '')}`} style={{ fontWeight: 600, color: 'var(--navy)' }}>
                            {settings.phone1}
                          </a>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', background: 'rgba(37,99,235,0.08)', color: '#1d4ed8', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.02em' }}>
                            {settings?.phone1Label || 'Managing Director'}
                          </span>
                        </div>
                      )}
                      {settings?.phone2 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a href={`tel:${settings.phone2.replace(/\s/g, '')}`} style={{ fontWeight: 600, color: 'var(--navy)' }}>
                            {settings.phone2}
                          </a>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', background: 'rgba(16,185,129,0.08)', color: '#047857', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.02em' }}>
                            {settings?.phone2Label || 'Holidays'}
                          </span>
                        </div>
                      )}
                      {settings?.phone3 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a href={`tel:${settings.phone3.replace(/\s/g, '')}`} style={{ fontWeight: 600, color: 'var(--navy)' }}>
                            {settings.phone3}
                          </a>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', background: 'rgba(139,92,246,0.08)', color: '#6d28d9', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.02em' }}>
                            {settings?.phone3Label || 'Reservation'}
                          </span>
                        </div>
                      )}
                      {settings?.phone4 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a href={`tel:${settings.phone4.replace(/\s/g, '')}`} style={{ fontWeight: 600, color: 'var(--navy)' }}>
                            {settings.phone4}
                          </a>
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem', background: 'rgba(245,158,11,0.08)', color: '#b45309', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.02em' }}>
                            {settings?.phone4Label || 'HR & Job Consulting'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="channel">
                  <div className="ch-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div className="ch-text">
                    <h4>Email</h4>
                    {settings?.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
                  </div>
                </div>

                <div className="channel">
                  <div className="ch-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div className="ch-text">
                    <h4>Office</h4>
                    <p>{settings?.address}</p>
                  </div>
                </div>
              </div>

              <div className="hours-block">
                <h4>Office Hours</h4>
                <p>
                  Monday – Saturday: 9:00 AM – 7:00 PM<br />
                  Sunday: 10:00 AM – 3:00 PM<br />
                  Emergency support: 24/7 via WhatsApp
                </p>
              </div>
            </div>

            {/* ─── Contact Form ─────────────────────────────────────────── */}
            <div className="contact-form-wrap reveal">
              <h3>Send Us a Message</h3>
              <p>Fill in the details below and we'll get back to you within the same working day.</p>

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
                  <h3 style={{ color: '#16a34a', marginBottom: '.5rem' }}>Message Sent!</h3>
                  <p style={{ color: '#5a627d' }}>Thank you for reaching out. We'll be in touch within the same working day.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn btn-outline"
                    style={{ marginTop: '1.5rem' }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+91 ..."
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Service Required *</label>
                    <select name="service" value={form.service} onChange={handleChange} required>
                      <option value="">Select a service...</option>
                      <option>Flight Tickets</option>
                      <option>Visa Services</option>
                      <option>Visa Stamping</option>
                      <option>Umrah Service</option>
                      <option>Holiday Packages</option>
                      <option>Passport Service</option>
                      <option>Certificate Attestation</option>
                      <option>Travel Insurance</option>
                      <option>GCC Job Visa</option>
                      <option>Holyland Services</option>
                      <option>Forex Services</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your requirements — destination, travel dates, number of travellers, etc."
                    />
                  </div>

                  {error && (
                    <p style={{ color: '#dc2626', fontSize: '.85rem', marginBottom: '1rem' }}>{error}</p>
                  )}

                  <button type="submit" className="form-submit" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                  <p className="form-note">We respond to all enquiries within the same working day.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WhatsApp Strip ─────────────────────────────────────────────── */}
      <div className="wa-strip">
        <div className="container">
          <div className="wa-inner">
            <div className="wa-text">
              <h3>Prefer to WhatsApp?</h3>
              <p>Send us a message on WhatsApp and get a response within minutes during office hours.</p>
            </div>
            <a
              href={settings.whatsapp || 'https://wa.me/918592042002'}
              className="wa-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ─── Map Section ───────────────────────────────────────────────── */}
      <section className="map-section">
        <div className="container">
          <h2>Find our<br /><em>office.</em></h2>
          <div className="map-wrap">
            <div className="map-address">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <p>
                {settings?.location && <strong>{settings.location}<br /></strong>}
                {settings?.address}
                {settings?.mapUrl && (
                  <>
                    <br />
                    <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--royal)', fontWeight: '600', fontSize: '.85rem' }}>
                      View on Google Maps →
                    </a>
                  </>
                )}
              </p>
            </div>
            {settings?.mapUrl && (
              <div className="map-embed">
                <iframe
                  src={settings.mapUrl}
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: '12px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </>
  );
}
