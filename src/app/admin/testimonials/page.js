'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTestimonials, saveTestimonial, deleteTestimonial } from '@/lib/firestore';

const emptyForm = { stars: 5, quote: '', author: '', role: '', initials: '' };

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openModal(item = null) {
    setEditItem(item || null);
    setForm(item ? { ...item } : emptyForm);
    setModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveTestimonial(editItem?.id || null, { ...form, stars: Number(form.stars) });
      setModal(false);
      await load();
    } catch (err) { console.error(err); alert('Error saving.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this testimonial?')) return;
    try { await deleteTestimonial(id); await load(); }
    catch (e) { console.error(e); }
  }

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Testimonials
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Testimonials ({testimonials.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Testimonial
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : testimonials.length === 0 ? (
          <div className="admin-empty">No testimonials yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {testimonials.map((t, idx) => (
              <div key={t.id || t.author || idx} style={{ background: '#F7F3EC', borderRadius: '14px', padding: '1.4rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '.2rem', marginBottom: '.6rem', color: '#C9A961' }}>
                    {Array.from({ length: t.stars || 5 }).map((_, i) => <span key={i}>★</span>)}
                  </div>
                  <p style={{ fontStyle: 'italic', color: '#4a5370', fontSize: '.9rem', marginBottom: '.8rem', lineHeight: 1.65 }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0A1235', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {t.initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#0A1235' }}>{t.author}</div>
                      <div style={{ fontSize: '.75rem', color: '#8a90a8' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                  <button className="admin-btn admin-btn-secondary" onClick={() => openModal(t)}>Edit</button>
                  <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(t.id || t.author || String(idx))}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="admin-modal">
            <h3>{editItem ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label>Stars (1–5)</label>
                <input type="number" min="1" max="5" value={form.stars} onChange={e => setForm(p => ({ ...p, stars: e.target.value }))} required />
              </div>
              <div className="admin-form-group">
                <label>Quote</label>
                <textarea value={form.quote} onChange={e => setForm(p => ({ ...p, quote: e.target.value }))} rows={4} required />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Author Name</label>
                  <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} required />
                </div>
                <div className="admin-form-group">
                  <label>Initials (e.g. FA)</label>
                  <input value={form.initials} onChange={e => setForm(p => ({ ...p, initials: e.target.value }))} maxLength={3} required />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Role / Description (e.g. Umrah Client · 2024)</label>
                <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} required />
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
