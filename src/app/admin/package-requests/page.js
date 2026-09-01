'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getPackageRequests,
  updatePackageRequestStatus,
  deletePackageRequest,
  approveAndPublishPackage,
  getPackages
} from '@/lib/firestore';

function toSlug(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminPackageRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // For publishing review
  const [publishModal, setPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getPackageRequests();
      setRequests(data);
    } catch (e) {
      console.error('Error loading package requests:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = requests.filter(r => {
    if (filterStatus === 'all') return true;
    return (r.status || 'pending') === filterStatus;
  });

  const pendingCount = requests.filter(r => (r.status || 'pending') === 'pending').length;

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

  async function handleStatusChange(id, newStatus) {
    if (!confirm(`Mark this package request as "${newStatus.toUpperCase()}"?`)) return;
    setActionLoading(true);
    try {
      await updatePackageRequestStatus(id, newStatus);
      await load();
      if (selectedReq?.id === id) {
        setSelectedReq(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      console.error(e);
      alert('Error updating status');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this package request permanently?')) return;
    setActionLoading(true);
    try {
      await deletePackageRequest(id);
      setSelectedReq(null);
      await load();
    } catch (e) {
      console.error(e);
      alert('Error deleting package request');
    } finally {
      setActionLoading(false);
    }
  }

  function openPublishReview(req) {
    setPublishForm({
      title: req.title || '',
      slug: toSlug(req.title || ''),
      location: req.location || '',
      duration: req.duration || '',
      price: req.priceAdult || req.price || '',
      priceAdult: req.priceAdult || '',
      priceChild: req.priceChild || '',
      priceNote: req.priceNote || 'per person',
      badge: req.badge || 'Resort Special',
      description: req.description || '',
      longDescription: req.longDescription || '',
      image: req.image || '',
      images: Array.isArray(req.images) ? req.images : [],
      highlights: Array.isArray(req.highlights) ? req.highlights : [],
      inclusions: Array.isArray(req.inclusions) ? req.inclusions : [],
      exclusions: Array.isArray(req.exclusions) ? req.exclusions : [],
      itinerary: Array.isArray(req.itinerary) ? req.itinerary : [],
      order: 10,
      tags: ['Partner Stay', req.location || ''].filter(Boolean),
    });
    setPublishModal(true);
  }

  async function handleApproveAndPublish(e) {
    e.preventDefault();
    if (!publishForm.title) {
      alert('Package title is required.');
      return;
    }
    setActionLoading(true);
    try {
      // Get current package count for default order
      const existing = await getPackages();
      const nextOrder = (existing.length || 0) + 1;

      const finalPackageData = {
        ...publishForm,
        order: Number(publishForm.order) || nextOrder,
        price: publishForm.priceAdult || publishForm.price,
      };

      await approveAndPublishPackage(selectedReq.id, finalPackageData);
      setPublishModal(false);
      setSelectedReq(null);
      await load();
      alert('🎉 Package has been successfully approved and published to the live website!');
    } catch (err) {
      console.error('Error approving package:', err);
      alert('Failed to publish package.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Partner Package Requests
      </div>

      {/* Stats and Filter Header */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A1235', margin: 0 }}>
              Partner Package Submissions ({requests.length})
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#5a627d' }}>
              Review custom resort packages and day-wise itineraries submitted by external partners
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterStatus('all')}
              className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`filter-pill ${filterStatus === 'pending' ? 'active' : ''}`}
            >
              Pending Approval {pendingCount > 0 && <span className="count-badge">{pendingCount}</span>}
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`filter-pill ${filterStatus === 'approved' ? 'active' : ''}`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`filter-pill ${filterStatus === 'rejected' ? 'active' : ''}`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Requests List */}
      <div className="admin-card">
        {loading ? (
          <div className="admin-empty">Loading package requests...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '.8rem' }}>🏝️</div>
            <p>No package requests found in "{filterStatus.toUpperCase()}".</p>
            <p style={{ marginTop: '.4rem', fontSize: '.8rem' }}>
              When resort managers or partners submit itineraries via the website, they will appear here.
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Resort / Partner</th>
                <th>Package Title</th>
                <th>Location & Duration</th>
                <th>Pricing (Adult / Child)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => {
                const isPending = (req.status || 'pending') === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';

                return (
                  <tr
                    key={req.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedReq(req)}
                  >
                    <td style={{ fontSize: '.78rem', color: '#5a627d', whiteSpace: 'nowrap' }}>
                      {formatDate(req.createdAt)}
                    </td>
                    <td>
                      <strong style={{ display: 'block', color: '#0A1235' }}>
                        {req.resortName || req.partnerName || 'Unknown Partner'}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#5a627d' }}>
                        👤 {req.partnerName}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2B47E5', maxWidth: '240px' }}>
                        {req.title}
                      </div>
                      {req.badge && (
                        <span style={{ fontSize: '0.7rem', background: '#eff6ff', color: '#1e40af', padding: '1px 6px', borderRadius: '4px' }}>
                          {req.badge}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>📍 {req.location || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#5a627d' }}>⏱ {req.duration || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.9rem' }}>
                        Adult: ₹{req.priceAdult || req.price || '—'}
                      </div>
                      {req.priceChild && (
                        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                          Child: ₹{req.priceChild}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-chip ${isPending ? 'status-pending' : isApproved ? 'status-approved' : 'status-rejected'}`}
                      >
                        {req.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="admin-btn admin-btn-sm"
                          style={{ background: '#2B47E5', color: '#fff' }}
                          onClick={() => setSelectedReq(req)}
                        >
                          Inspect
                        </button>
                        {isPending && (
                          <button
                            className="admin-btn admin-btn-sm"
                            style={{ background: '#10B981', color: '#fff' }}
                            onClick={() => {
                              setSelectedReq(req);
                              openPublishReview(req);
                            }}
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Detail Modal ──────────────────────────────────────────────── */}
      {selectedReq && (
        <div className="admin-modal-overlay" onClick={() => setSelectedReq(null)}>
          <div className="admin-modal-box" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <span className={`status-chip ${selectedReq.status === 'approved' ? 'status-approved' : selectedReq.status === 'rejected' ? 'status-rejected' : 'status-pending'}`}>
                  {selectedReq.status || 'pending'}
                </span>
                <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
                  {selectedReq.title}
                </h3>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedReq(null)}>✕</button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Partner Quick Contact Strip */}
              <div className="partner-info-strip">
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Resort / Partner Details
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: '#0A1235' }}>
                    {selectedReq.resortName || selectedReq.partnerName}
                  </strong>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                    Contact Person: {selectedReq.partnerName}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  {selectedReq.phone && (
                    <>
                      <a
                        href={`tel:${selectedReq.phone.replace(/\s/g, '')}`}
                        className="admin-btn admin-btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                      >
                        📞 Call {selectedReq.phone}
                      </a>
                      <a
                        href={`https://wa.me/${selectedReq.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedReq.partnerName)},%20regarding%20your%20package%20submission%20"${encodeURIComponent(selectedReq.title)}"%20on%20Zamani%20Tours...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn"
                        style={{ background: '#25D366', color: '#fff', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                      >
                        💬 WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Package Details Grid */}
              <div className="detail-meta-grid">
                <div className="meta-item">
                  <label>Location</label>
                  <span>📍 {selectedReq.location || '—'}</span>
                </div>
                <div className="meta-item">
                  <label>Duration</label>
                  <span>⏱ {selectedReq.duration || '—'}</span>
                </div>
                <div className="meta-item">
                  <label>Adult Rate</label>
                  <span style={{ color: '#059669', fontWeight: 700 }}>₹{selectedReq.priceAdult || selectedReq.price || '—'}</span>
                </div>
                <div className="meta-item">
                  <label>Child Rate</label>
                  <span>{selectedReq.priceChild ? `₹${selectedReq.priceChild}` : 'Not specified'}</span>
                </div>
                <div className="meta-item">
                  <label>Price Note</label>
                  <span>{selectedReq.priceNote || 'per person'}</span>
                </div>
                <div className="meta-item">
                  <label>Submitted On</label>
                  <span>{formatDate(selectedReq.createdAt)}</span>
                </div>
              </div>

              {/* Photos Showcase */}
              <div style={{ marginTop: '1.2rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Cover & Gallery Photos</h4>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {selectedReq.image && (
                    <div style={{ position: 'relative', width: '130px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #2B47E5' }}>
                      <img src={selectedReq.image} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: 2, left: 2, background: '#2B47E5', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>COVER</span>
                    </div>
                  )}
                  {Array.isArray(selectedReq.images) && selectedReq.images.map((img, i) => (
                    <div key={i} style={{ width: '130px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <img src={img} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Day-Wise Itineraries */}
              <div style={{ marginTop: '1.4rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.6rem 0' }}>
                  Day-by-Day Itineraries ({selectedReq.itinerary?.length || 0} Days)
                </h4>
                {Array.isArray(selectedReq.itinerary) && selectedReq.itinerary.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {selectedReq.itinerary.map((itin, idx) => (
                      <div key={idx} className="itin-item-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 700, color: '#2B47E5', fontSize: '0.85rem' }}>
                            {itin.day || `Day ${idx + 1}`}: {itin.title}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                          {itin.description}
                        </p>
                        {itin.image && (
                          <div style={{ marginTop: '0.4rem' }}>
                            <img src={itin.image} alt={itin.title} style={{ height: '60px', borderRadius: '6px', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>No day-wise itinerary details provided.</p>
                )}
              </div>

              {/* Inclusions & Exclusions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.2rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#166534', display: 'block', marginBottom: '0.3rem' }}>✓ Inclusions</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#334155' }}>
                    {Array.isArray(selectedReq.inclusions) && selectedReq.inclusions.length > 0 ? (
                      selectedReq.inclusions.map((inc, i) => <li key={i}>{inc}</li>)
                    ) : (
                      <li>None specified</li>
                    )}
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#991b1b', display: 'block', marginBottom: '0.3rem' }}>✕ Exclusions</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#334155' }}>
                    {Array.isArray(selectedReq.exclusions) && selectedReq.exclusions.length > 0 ? (
                      selectedReq.exclusions.map((exc, i) => <li key={i}>{exc}</li>)
                    ) : (
                      <li>None specified</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="admin-modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="admin-btn"
                style={{ color: '#ef4444', background: '#fee2e2' }}
                onClick={() => handleDelete(selectedReq.id)}
                disabled={actionLoading}
              >
                Delete Request
              </button>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {selectedReq.status !== 'rejected' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => handleStatusChange(selectedReq.id, 'rejected')}
                    disabled={actionLoading}
                  >
                    Reject
                  </button>
                )}

                {selectedReq.status !== 'approved' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    style={{ background: '#10B981', borderColor: '#10B981' }}
                    onClick={() => openPublishReview(selectedReq)}
                    disabled={actionLoading}
                  >
                    🚀 Approve & Publish to Live Packages
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Publish Review Modal ─────────────────────────────────────── */}
      {publishModal && publishForm && (
        <div className="admin-modal-overlay" onClick={() => setPublishModal(false)}>
          <div className="admin-modal-box" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>Review & Confirm Live Publication</h3>
              <button className="admin-modal-close" onClick={() => setPublishModal(false)}>✕</button>
            </div>
            <form onSubmit={handleApproveAndPublish}>
              <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
                  This will publish <strong>"{publishForm.title}"</strong> to the live Tour Packages catalog on Zamani.
                </p>

                <div className="admin-form-group">
                  <label>Package Title</label>
                  <input
                    type="text"
                    required
                    value={publishForm.title}
                    onChange={e => setPublishForm(prev => ({ ...prev, title: e.target.value, slug: toSlug(e.target.value) }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div className="admin-form-group">
                    <label>Destination Location</label>
                    <input
                      type="text"
                      value={publishForm.location}
                      onChange={e => setPublishForm(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={publishForm.duration}
                      onChange={e => setPublishForm(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div className="admin-form-group">
                    <label>Adult Price (₹)</label>
                    <input
                      type="text"
                      required
                      value={publishForm.priceAdult}
                      onChange={e => setPublishForm(prev => ({ ...prev, priceAdult: e.target.value }))}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Child Price (₹)</label>
                    <input
                      type="text"
                      value={publishForm.priceChild}
                      onChange={e => setPublishForm(prev => ({ ...prev, priceChild: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Badge / Tag</label>
                  <input
                    type="text"
                    value={publishForm.badge}
                    onChange={e => setPublishForm(prev => ({ ...prev, badge: e.target.value }))}
                  />
                </div>
              </div>

              <div className="admin-modal-foot">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setPublishModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Publishing...' : '✓ Confirm & Publish Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .filter-pill {
          padding: 0.45rem 0.9rem;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }
        .filter-pill:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .filter-pill.active {
          background: #0A1235;
          color: #fff;
          border-color: #0A1235;
        }
        .count-badge {
          background: #ef4444;
          color: #fff;
          font-size: 0.7rem;
          padding: 1px 6px;
          border-radius: 10px;
        }
        .status-chip {
          display: inline-block;
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: capitalize;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-approved {
          background: #d1fae5;
          color: #065f46;
        }
        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }
        .partner-info-strip {
          background: #f1f5f9;
          border-radius: 10px;
          padding: 0.9rem 1.1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.2rem;
        }
        .detail-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.8rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.9rem;
        }
        .meta-item label {
          display: block;
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }
        .meta-item span {
          font-size: 0.88rem;
          color: #0A1235;
          font-weight: 600;
        }
        .itin-item-box {
          background: #f8fafc;
          border-left: 3px solid #2B47E5;
          padding: 0.7rem 0.9rem;
          border-radius: 0 8px 8px 0;
        }
      `}</style>
    </>
  );
}
