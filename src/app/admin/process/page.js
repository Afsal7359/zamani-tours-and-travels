'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProcessSteps, saveProcessStep, deleteProcessStep } from '@/lib/firestore';

const emptyForm = { order: 1, num: '', title: '', description: '', items: '', image: '', tag: '' };

export default function AdminProcessPage() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getProcessSteps();
      setSteps(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openModal(item = null) {
    if (item) {
      setEditItem(item);
      setForm({ ...item, items: Array.isArray(item.items) ? item.items.join('\n') : '' });
    } else {
      setEditItem(null);
      setForm(emptyForm);
    }
    setModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        order: Number(form.order),
        items: form.items.split('\n').map(s => s.trim()).filter(Boolean),
      };
      await saveProcessStep(editItem?.id || null, data);
      setModal(false);
      await load();
    } catch (err) { console.error(err); alert('Error saving.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this step?')) return;
    try { await deleteProcessStep(id); await load(); }
    catch (e) { console.error(e); }
  }

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Process Steps
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Process Steps ({steps.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Step
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : steps.length === 0 ? (
          <div className="admin-empty">No process steps yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Num</th>
                <th>Title</th>
                <th>Tag</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {steps.map(step => (
                <tr key={step.id}>
                  <td style={{ fontWeight: 700, color: '#8a90a8' }}>{step.order}</td>
                  <td style={{ fontWeight: 700, color: '#2B47E5' }}>{step.num}</td>
                  <td style={{ fontWeight: 600 }}>{step.title}</td>
                  <td><span className="admin-tag">{step.tag}</span></td>
                  <td>{step.image && <img src={step.image} className="thumb" alt={step.title} />}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => openModal(step)}>Edit</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(step.id)}>Delete</button>
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
            <h3>{editItem ? 'Edit Process Step' : 'Add Process Step'}</h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))} required />
                </div>
                <div className="admin-form-group">
                  <label>Number (e.g. 01)</label>
                  <input value={form.num} onChange={e => setForm(p => ({ ...p, num: e.target.value }))} required />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="admin-form-group">
                <label>Bullet Items (one per line)</label>
                <textarea
                  value={form.items}
                  onChange={e => setForm(p => ({ ...p, items: e.target.value }))}
                  rows={4}
                  placeholder="Free consultation&#10;Available by call&#10;We listen first"
                />
              </div>
              <div className="admin-form-group">
                <label>Tag Text (e.g. Free Consultation)</label>
                <input value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label>Image URL</label>
                <input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
                {form.image && <img src={form.image} className="admin-img-preview" alt="Preview" />}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Step'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
