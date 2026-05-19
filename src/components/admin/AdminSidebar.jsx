'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getSiteSettings } from '@/lib/firestore';

const navItems = [
  {
    section: 'CONTENT',
    links: [
      { href: '/admin', label: 'Dashboard', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      )},
      { href: '/admin/home', label: 'Home Content', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      )},
      { href: '/admin/about', label: 'About Content', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      )},
      { href: '/admin/services', label: 'Services', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M18.66 12H21M19.07 19.07l-1.41-1.41M12 18.66V21M4.93 19.07l1.41-1.41M3 12h2.34M4.93 4.93l1.41 1.41M12 3v2.34"/></svg>
      )},
      { href: '/admin/process', label: 'Process Steps', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      )},
    ],
  },
  {
    section: 'MARKETING',
    links: [
      { href: '/admin/blog', label: 'Blog Posts', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      )},
      { href: '/admin/destinations', label: 'Destinations', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/></svg>
      )},
      { href: '/admin/testimonials', label: 'Testimonials', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      )},
    ],
  },
  {
    section: 'BUSINESS',
    links: [
      { href: '/admin/contacts', label: 'Contact Submissions', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      )},
      { href: '/admin/settings', label: 'Site Settings', icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M18.66 12H21M19.07 19.07l-1.41-1.41M12 18.66V21M4.93 19.07l1.41-1.41M3 12h2.34M4.93 4.93l1.41 1.41M12 3v2.34"/></svg>
      )},
    ],
  },
];

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState('/images/zamaniLogo.svg');

  useEffect(() => {
    getSiteSettings().then(s => { if (s?.logoUrl) setLogoUrl(s.logoUrl); }).catch(() => {});
  }, []);

  async function handleLogout() {
    await signOut(getFirebaseAuth());
    router.push('/admin/login');
  }

  function isActive(href) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <aside className="admin-sidebar">
      <div className="logo">
        <img
          src={logoUrl}
          alt="Zamani"
          onError={e => { e.currentTarget.src = '/images/zamaniLogo.svg'; }}
        />
      </div>

      <nav className="admin-nav">
        {navItems.map(group => (
          <div className="admin-nav-section" key={group.section}>
            <span className="section-label">{group.section}</span>
            {group.links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`admin-nav-link${isActive(link.href) ? ' active' : ''}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="admin-nav-section" style={{ marginTop: '1rem' }}>
          <span className="section-label">SITE</span>
          <Link href="/" className="admin-nav-link" target="_blank">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            View Live Site
          </Link>
        </div>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="user-email">{user?.email || 'Admin'}</div>
        <button onClick={handleLogout}>Sign Out</button>
      </div>
    </aside>
  );
}
