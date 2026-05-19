'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContactSubmissions, deleteContactSubmission } from '@/lib/firestore';

export default function AdminContactsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getContactSubmissions();
      setSubmissions(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this submission?')) return;
    try {
      await deleteContactSubmission(id);
      await load();
    } catch (err) { console.error(err); }
  }

  function formatDate(ts) {
    if (!ts) return '—';
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    }
    if (typeof ts === 'string') return ts;
    return '—';
  }

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Contact Submissions
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Contact Submissions ({submissions.length})</h2>
        </div>

        {loading ? (
          <div className="admin-empty">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="admin-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '.8rem' }}>📬</div>
            <p>No contact submissions yet.</p>
            <p style={{ marginTop: '.4rem', fontSize: '.8rem' }}>Submissions from the contact form will appear here.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Service</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <>
                  <tr
                    key={sub.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                  >
                    <td style={{ fontSize: '.78rem', color: '#5a627d', whiteSpace: 'nowrap' }}>
                      {formatDate(sub.createdAt)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{sub.name || '—'}</td>
                    <td>
                      {sub.phone
                        ? <a href={`tel:${sub.phone.replace(/\s/g, '')}`} style={{ color: '#2B47E5', fontWeight: 600 }}>{sub.phone}</a>
                        : '—'
                      }
                    </td>
                    <td>
                      {sub.email
                        ? <a href={`mailto:${sub.email}`} style={{ color: '#2B47E5' }}>{sub.email}</a>
                        : '—'
                      }
                    </td>
                    <td>
                      {sub.service
                        ? <span className="admin-badge blue">{sub.service}</span>
                        : '—'
                      }
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: '.85rem', color: '#5a627d' }}>
                          {sub.message || '—'}
                        </span>
                        {sub.message && (
                          <svg
                            width="14" height="14"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            style={{ transform: expanded === sub.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0, color: '#8a90a8' }}
                          >
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={e => handleDelete(e, sub.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expanded === sub.id && (
                    <tr key={`${sub.id}-expanded`}>
                      <td colSpan={7} style={{ background: '#F7F3EC', padding: '1.2rem 1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a90a8', marginBottom: '.3rem' }}>Full Name</div>
                            <div style={{ fontWeight: 600 }}>{sub.name || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a90a8', marginBottom: '.3rem' }}>Phone</div>
                            <div>{sub.phone || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a90a8', marginBottom: '.3rem' }}>Email</div>
                            <div>{sub.email || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a90a8', marginBottom: '.3rem' }}>Service Requested</div>
                            <div>{sub.service || '—'}</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a90a8', marginBottom: '.5rem' }}>Full Message</div>
                          <div style={{ background: '#fff', border: '1px solid rgba(10,18,53,.08)', borderRadius: '10px', padding: '1rem', fontSize: '.88rem', color: '#4a5370', lineHeight: 1.75 }}>
                            {sub.message || 'No message provided.'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
