'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getServices, getBlogPosts, getDestinations, getContactSubmissions } from '@/lib/firestore';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ services: 0, posts: 0, destinations: 0, contacts: 0 });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p, d, c] = await Promise.all([
          getServices(),
          getBlogPosts(),
          getDestinations(),
          getContactSubmissions(),
        ]);
        setStats({
          services: s.length,
          posts: p.length,
          destinations: d.length,
          contacts: c.length,
        });
        setSubmissions(c.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const quickLinks = [
    { href: '/admin/home', label: 'Edit Home Page', desc: 'Hero text, about section, stats' },
    { href: '/admin/about', label: 'Edit About Page', desc: 'Story, values, timeline' },
    { href: '/admin/services', label: 'Manage Services', desc: 'Add, edit or remove services' },
    { href: '/admin/blog', label: 'Manage Blog', desc: 'Publish and manage articles' },
    { href: '/admin/destinations', label: 'Manage Destinations', desc: 'Featured destinations' },
    { href: '/admin/settings', label: 'Site Settings', desc: 'Phone, email, social links' },
  ];

  return (
    <>
      <div className="admin-breadcrumb">Dashboard</div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="num">{loading ? '—' : stats.services}</div>
          <div className="lbl">Services</div>
        </div>
        <div className="admin-stat-card">
          <div className="num">{loading ? '—' : stats.posts}</div>
          <div className="lbl">Blog Posts</div>
        </div>
        <div className="admin-stat-card">
          <div className="num">{loading ? '—' : stats.destinations}</div>
          <div className="lbl">Destinations</div>
        </div>
        <div className="admin-stat-card">
          <div className="num">{loading ? '—' : stats.contacts}</div>
          <div className="lbl">Contact Submissions</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Quick Actions</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {quickLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'block',
                padding: '1.2rem',
                background: '#F7F3EC',
                borderRadius: '12px',
                border: '1px solid rgba(10,18,53,.07)',
                textDecoration: 'none',
                transition: 'background .2s',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0A1235', marginBottom: '.3rem', fontSize: '.9rem' }}>
                {link.label}
              </div>
              <div style={{ fontSize: '.78rem', color: '#5a627d' }}>{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Recent Contact Submissions</h2>
          <Link href="/admin/contacts" className="admin-btn admin-btn-secondary">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="admin-empty">No contact submissions yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>{sub.name || '—'}</td>
                  <td>{sub.phone || '—'}</td>
                  <td>
                    <span className="admin-badge blue">{sub.service || '—'}</span>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub.message || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
