'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDestinations, saveDestination, deleteDestination } from '@/lib/firestore';
import ImageUpload from '@/components/admin/ImageUpload';

const emptyForm = { order: 1, name: '', country: '', price: '', image: '', badge: '', showPrice: true };

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getDestinations();
      setDestinations(data);
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
      const data = { ...form, order: Number(form.order) };
      await saveDestination(editItem?.id || null, data);
      setModal(false);
      await load();
    } catch (err) { console.error(err); alert('Error saving.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this destination?')) return;
    try { await deleteDestination(id); await load(); }
    catch (e) { console.error(e); }
  }

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Destinations
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Destinations ({destinations.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Destination
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : destinations.length === 0 ? (
          <div className="admin-empty">No destinations yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Order</th>
                <th>Name</th>
                <th>Country</th>
                <th>Price</th>
                <th>Badge</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map(dest => (
                <tr key={dest.id}>
                  <td><img src={dest.image} className="thumb" alt={dest.name} /></td>
                  <td style={{ color: '#8a90a8', fontWeight: 700 }}>{dest.order}</td>
                  <td style={{ fontWeight: 600 }}>{dest.name}</td>
                  <td style={{ color: '#5a627d' }}>{dest.country}</td>
                  <td style={{ fontWeight: 700, color: '#2B47E5' }}>{dest.price}</td>
                  <td>
                    {dest.badge
                      ? <span className="admin-tag">{dest.badge}</span>
                      : <span style={{ color: '#8a90a8', fontSize: '.8rem' }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => openModal(dest)}>Edit</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(dest.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="admin-modal">
            <h3>{editItem ? 'Edit Destination' : 'Add Destination'}</h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))} required />
                </div>
                <div className="admin-form-group">
                  <label>Badge Text (e.g. Featured, leave empty for none)</label>
                  <input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} placeholder="Featured" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Destination Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="admin-form-group">
                  <label>Country</label>
                  <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} required />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Price (e.g. ₹52,000)</label>
                <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                <input
                  type="checkbox"
                  id="showPrice"
                  checked={form.showPrice !== false}
                  onChange={e => setForm(p => ({ ...p, showPrice: e.target.checked }))}
                  style={{ width: 'auto', accentColor: '#2B47E5', cursor: 'pointer' }}
                />
                <label htmlFor="showPrice" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '.88rem' }}>
                  Show price on website
                </label>
              </div>
              <ImageUpload
                label="Destination Image"
                value={form.image}
                onChange={val => setForm(p => ({ ...p, image: val }))}
              />
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
