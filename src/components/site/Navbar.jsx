'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/firestore';
import { defaultSiteSettings } from '@/lib/defaultData';

export default function Navbar({ activePage }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSiteSettings);

  useEffect(() => {
    getSiteSettings().then(s => { if (s) setSettings(s); }).catch(() => {});
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 50;
          setScrolled(prev => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('mobile-menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const logoUrl = settings.logoUrl || defaultSiteSettings.logoUrl;
  const brandName = settings.brandName || defaultSiteSettings.brandName;
  const brandSubtitle = settings.brandSubtitle || defaultSiteSettings.brandSubtitle;
  const showBrandText = settings.showBrandText !== false;
  const phone = settings.phone1 || defaultSiteSettings.phone1;
  const whatsappUrl = (settings.whatsapp && !settings.whatsapp.includes('8592002549'))
    ? settings.whatsapp
    : 'https://wa.me/918592042002';

  const links = [
    { href: '/', label: 'Home', key: 'home' },
    { href: '/about', label: 'About', key: 'about' },
    { href: '/services', label: 'Services', key: 'services' },
    { href: '/packages', label: 'Packages', key: 'packages' },
    { href: '/process', label: 'Process', key: 'process' },
    { href: '/blog', label: 'Blog', key: 'blog' },
    { href: '/contact', label: 'Contact', key: 'contact' },
  ];

  return (
    <>
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <Link href="/" className="brand" aria-label="Zamani Tours & Travels">
            <div className="brand-mark">
              <img
                src={settings.logoUrl && !settings.logoUrl.endsWith('zamani-logo-white.png') ? settings.logoUrl : '/images/zamaniLogo.png'}
                alt={brandName}
                onError={e => { e.currentTarget.src = '/images/zamaniLogo.png'; }}
              />
            </div>
          </Link>

          <ul className="nav-links">
            {links.map(link => (
              <li key={link.key}>
                <Link href={link.href} className={activePage === link.key ? 'active' : ''}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            <a className="phone" href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
            <Link href="/contact" className="btn btn-primary">
              Get Started
              <span className="arr">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M8 2H3M8 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
          </div>

          <button
            className={`menu-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ─── Backdrop overlay for mobile menu ─── */}
      <div
        className={`mobile-menu-backdrop${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ─── Enhanced Mobile Menu Drawer ─── */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-head">
          <Link href="/" className="mob-brand" onClick={() => setMenuOpen(false)}>
            <img
              src="/images/zamaniLogo.png"
              alt={brandName}
            />
            <div className="mob-brand-text">
              <span className="mob-brand-name">Zamani</span>
              <span className="mob-brand-sub">Tours & Travels</span>
            </div>
          </Link>
          <button
            className="mob-close-btn"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="mob-nav-links">
          {links.map((link, idx) => {
            const isActive = activePage === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`mob-nav-item${isActive ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <span className="mob-nav-label">{link.label}</span>
                {isActive ? (
                  <span className="mob-active-dot" />
                ) : (
                  <svg className="mob-nav-arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mob-menu-footer">
          <div className="mob-cta-group">
            <Link
              href="/contact"
              className="btn btn-primary mob-btn-full"
              onClick={() => setMenuOpen(false)}
            >
              Plan Your Journey
              <span className="arr">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M8 2H3M8 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mob-btn-wa"
            >
              <svg width="18" height="18" viewBox="0 0 36 36" fill="currentColor">
                <path d="M18 4C10.27 4 4 10.27 4 18c0 2.76.8 5.33 2.18 7.5L4 32l6.73-2.14C12.83 31.18 15.34 32 18 32c7.73 0 14-6.27 14-14S25.73 4 18 4z" fill="#25D366"/>
                <path d="M24.2 21.6c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.08-.13-.27-.2-.57-.35z" fill="#FFFFFF"/>
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <div className="mob-phone-card">
            <span className="mob-phone-lbl">Direct Call Desk</span>
            <a className="mob-phone-num" href={`tel:${phone.replace(/\s/g, '')}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              {phone}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
