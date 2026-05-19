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
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const logoUrl = settings.logoUrl || defaultSiteSettings.logoUrl;
  const brandName = settings.brandName || defaultSiteSettings.brandName;
  const brandSubtitle = settings.brandSubtitle || defaultSiteSettings.brandSubtitle;
  const showBrandText = settings.showBrandText !== false;
  const phone = settings.phone1 || defaultSiteSettings.phone1;

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
          <Link href="/" className="brand">
            <div className="brand-mark">
              <img
                src={logoUrl}
                alt={brandName}
                onError={e => { e.currentTarget.src = '/images/zamaniLogo.svg'; }}
              />
            </div>
            {showBrandText && (
              <div className="brand-text">
                <strong>{brandName}</strong>
                <span>{brandSubtitle}</span>
              </div>
            )}
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
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <nav>
          {links.map(link => (
            <Link key={link.key} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mob-cta">
          <Link href="/contact" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
            Get Started
          </Link>
        </div>
        <p className="mob-phone">
          <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
        </p>
      </div>
    </>
  );
}
