'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getServices, saveService, deleteService } from '@/lib/firestore';
import ImageUpload from '@/components/admin/ImageUpload';
import { useUpload } from '@/components/admin/UploadContext';

const iconTypes = ['plane', 'passport', 'stamp', 'mosque', 'suitcase', 'id', 'document', 'shield', 'work', 'temple', 'forex'];
function toSlug(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const emptyForm = {
  order: 1,
  num: '',
  title: '',
  slug: '',
  description: '',
  longDescription: '',
  highlights: '',
  image: '',
  images: [],
  tags: '',
  iconType: 'plane',
  faqs: [],
};

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { isUploading } = useUpload();

  async function load() {
    setLoading(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openModal(item = null) {
    if (item) {
      setEditItem(item);
      setForm({
        ...item,
        slug: item.slug || toSlug(item.title || ''),
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
        highlights: Array.isArray(item.highlights) ? item.highlights.join('\n') : (item.highlights || ''),
        images: Array.isArray(item.images) ? item.images : [],
        faqs: Array.isArray(item.faqs) ? item.faqs : [],
        longDescription: item.longDescription || '',
      });
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
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        highlights: form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
        images: form.images.filter(Boolean),
      };
      await saveService(editItem?.id || null, data);
      setModal(false);
      await load();
    } catch (err) { console.error(err); alert('Error saving.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      await load();
    } catch (e) { console.error(e); }
  }

  function addFaq() {
    setForm(p => ({ ...p, faqs: [...p.faqs, { q: '', a: '' }] }));
  }

  function updateFaq(i, field, val) {
    setForm(p => {
      const faqs = [...p.faqs];
      faqs[i] = { ...faqs[i], [field]: val };
      return { ...p, faqs };
    });
  }

  function removeFaq(i) {
    setForm(p => ({ ...p, faqs: p.faqs.filter((_, idx) => idx !== i) }));
  }

  function addExtraImage() {
    setForm(p => ({ ...p, images: [...p.images, ''] }));
  }

  function updateExtraImage(i, val) {
    setForm(p => {
      const images = [...p.images];
      images[i] = val;
      return { ...p, images };
    });
  }

  function removeExtraImage(i) {
    setForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
  }

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Services
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>All Services ({services.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Service
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="admin-empty">No services yet. Click "Add Service" to get started.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Num</th>
                <th>Title</th>
                <th>Tags</th>
                <th>Icon</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(svc => (
                <tr key={svc.id}>
                  <td>
                    <img src={svc.image} className="thumb" alt={svc.title} />
                  </td>
                  <td style={{ fontWeight: 700, color: '#8a90a8' }}>{svc.num}</td>
                  <td style={{ fontWeight: 600 }}>{svc.title}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                      {(svc.tags || []).slice(0, 2).map((tag, i) => (
                        <span className="admin-tag" key={i}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: '#5a627d', fontSize: '.8rem' }}>{svc.iconType}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => openModal(svc)}>Edit</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(svc.id)}>Delete</button>
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
          <div className="admin-modal" style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{editItem ? 'Edit Service' : 'Add Service'}</h3>
            <form onSubmit={handleSave}>

              {/* Basic info */}
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
                <input
                  value={form.title}
                  onChange={e => {
                    const title = e.target.value;
                    setForm(p => ({ ...p, title, slug: p.slug || toSlug(title) }));
                  }}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>URL Slug (used in page URL, e.g. "flight-tickets")</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(p => ({ ...p, slug: toSlug(e.target.value) }))}
                  placeholder="flight-tickets"
                  required
                />
                <small style={{ color: '#8a90a8', fontSize: '.75rem' }}>
                  Page URL: /services/{form.slug || 'your-slug'}
                </small>
              </div>
              <div className="admin-form-group">
                <label>Short Description (card preview)</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={3} />
              </div>
              <div className="admin-form-group">
                <label>Long Description (detail page — separate paragraphs with a blank line)</label>
                <textarea
                  value={form.longDescription}
                  onChange={e => setForm(p => ({ ...p, longDescription: e.target.value }))}
                  rows={8}
                  placeholder="First paragraph...&#10;&#10;Second paragraph...&#10;&#10;Third paragraph..."
                />
              </div>

              {/* Main image */}
              <ImageUpload
                label="Main Card Image"
                value={form.image}
                onChange={val => setForm(p => ({ ...p, image: val }))}
              />

              {/* Extra images */}
              <div className="admin-form-group" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                  <label style={{ margin: 0 }}>Additional Images (gallery on detail page)</label>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={addExtraImage} style={{ padding: '.3rem .8rem', fontSize: '.75rem' }}>
                    + Add Image
                  </button>
                </div>
                {form.images.map((img, i) => (
                  <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: '#f7f8fc', borderRadius: 8, position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => removeExtraImage(i)}
                      style={{ position: 'absolute', top: '.5rem', right: '.5rem', background: '#fee', border: '1px solid #fcc', borderRadius: 4, padding: '.2rem .5rem', cursor: 'pointer', fontSize: '.75rem', color: '#c33' }}
                    >
                      Remove
                    </button>
                    <ImageUpload
                      label={`Gallery Image ${i + 1}`}
                      value={img}
                      onChange={val => updateExtraImage(i, val)}
                    />
                  </div>
                ))}
                {form.images.length === 0 && (
                  <p style={{ color: '#8a90a8', fontSize: '.8rem', margin: 0 }}>No additional images. Click "+ Add Image" to add gallery images.</p>
                )}
              </div>

              {/* Tags & icon */}
              <div className="admin-form-group">
                <label>Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="Domestic, International, Group" />
              </div>
              <div className="admin-form-group">
                <label>Icon Type</label>
                <select value={form.iconType} onChange={e => setForm(p => ({ ...p, iconType: e.target.value }))}>
                  {iconTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Highlights */}
              <div className="admin-form-group">
                <label>Highlights — one per line (shown as checklist on detail page)</label>
                <textarea
                  value={form.highlights}
                  onChange={e => setForm(p => ({ ...p, highlights: e.target.value }))}
                  rows={5}
                  placeholder="All major domestic & international airlines&#10;Group booking specialists&#10;Flexible date comparison"
                />
              </div>

              {/* FAQs */}
              <div className="admin-form-group" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                  <label style={{ margin: 0 }}>FAQs</label>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={addFaq} style={{ padding: '.3rem .8rem', fontSize: '.75rem' }}>
                    + Add FAQ
                  </button>
                </div>
                {form.faqs.map((faq, i) => (
                  <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: '#f7f8fc', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '.8rem', color: '#5a627d' }}>FAQ {i + 1}</span>
                      <button type="button" onClick={() => removeFaq(i)} style={{ background: 'none', border: 'none', color: '#c33', cursor: 'pointer', fontSize: '.8rem' }}>Remove</button>
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: '.5rem' }}>
                      <label>Question</label>
                      <input value={faq.q} onChange={e => updateFaq(i, 'q', e.target.value)} placeholder="Question..." />
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label>Answer</label>
                      <textarea value={faq.a} onChange={e => updateFaq(i, 'a', e.target.value)} rows={3} placeholder="Answer..." />
                    </div>
                  </div>
                ))}
                {form.faqs.length === 0 && (
                  <p style={{ color: '#8a90a8', fontSize: '.8rem', margin: 0 }}>No FAQs yet. Click "+ Add FAQ" to add questions.</p>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || isUploading}>
                  {isUploading ? 'Uploading image…' : saving ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
