'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPackages, savePackage, deletePackage } from '@/lib/firestore';
import ImageUpload from '@/components/admin/ImageUpload';

function toSlug(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const emptyForm = {
  order: 1,
  title: '',
  slug: '',
  location: '',
  duration: '',
  price: '',
  priceNote: 'per person',
  badge: '',
  description: '',
  longDescription: '',
  image: '',
  images: [],
  highlights: '',
  inclusions: '',
  exclusions: '',
  itinerary: [],
  tags: '',
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getPackages();
      setPackages(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openModal(item = null) {
    if (item) {
      setEditItem(item);
      setForm({
        ...emptyForm,
        ...item,
        slug: item.slug || toSlug(item.title || ''),
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
        highlights: Array.isArray(item.highlights) ? item.highlights.join('\n') : (item.highlights || ''),
        inclusions: Array.isArray(item.inclusions) ? item.inclusions.join('\n') : (item.inclusions || ''),
        exclusions: Array.isArray(item.exclusions) ? item.exclusions.join('\n') : (item.exclusions || ''),
        images: Array.isArray(item.images) ? item.images : [],
        itinerary: Array.isArray(item.itinerary) ? item.itinerary : [],
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
        inclusions: form.inclusions.split('\n').map(s => s.trim()).filter(Boolean),
        exclusions: form.exclusions.split('\n').map(s => s.trim()).filter(Boolean),
        images: form.images.filter(Boolean),
        itinerary: form.itinerary
          .map(s => ({ day: s.day || '', title: s.title || '', description: s.description || '' }))
          .filter(s => s.title || s.description),
      };
      await savePackage(editItem?.id || null, data);
      setModal(false);
      await load();
    } catch (err) { console.error(err); alert('Error saving.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this package?')) return;
    try {
      await deletePackage(id);
      await load();
    } catch (e) { console.error(e); }
  }

  function addItin() {
    setForm(p => ({ ...p, itinerary: [...p.itinerary, { day: `Day ${p.itinerary.length + 1}`, title: '', description: '' }] }));
  }

  function updateItin(i, field, val) {
    setForm(p => {
      const itinerary = [...p.itinerary];
      itinerary[i] = { ...itinerary[i], [field]: val };
      return { ...p, itinerary };
    });
  }

  function removeItin(i) {
    setForm(p => ({ ...p, itinerary: p.itinerary.filter((_, idx) => idx !== i) }));
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
        <Link href="/admin">Dashboard</Link> / Packages
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Tour Packages ({packages.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Package
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="admin-empty">No packages yet. Click "Add Package" to get started.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Location</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.id}>
                  <td>
                    <img src={pkg.image} className="thumb" alt={pkg.title} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{pkg.title}</td>
                  <td style={{ color: '#5a627d', fontSize: '.82rem' }}>{pkg.location}</td>
                  <td style={{ color: '#5a627d', fontSize: '.82rem' }}>{pkg.duration}</td>
                  <td style={{ color: '#5a627d', fontSize: '.82rem' }}>{pkg.price}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => openModal(pkg)}>Edit</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(pkg.id)}>Delete</button>
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
            <h3>{editItem ? 'Edit Package' : 'Add Package'}</h3>
            <form onSubmit={handleSave}>

              {/* Basic info */}
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))} required />
                </div>
                <div className="admin-form-group">
                  <label>Badge (optional, e.g. "Bestseller")</label>
                  <input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} placeholder="Bestseller" />
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
                <label>URL Slug (used in page URL, e.g. "lakshadweep")</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(p => ({ ...p, slug: toSlug(e.target.value) }))}
                  placeholder="lakshadweep"
                  required
                />
                <small style={{ color: '#8a90a8', fontSize: '.75rem' }}>
                  Page URL: /packages/{form.slug || 'your-slug'}
                </small>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Location</label>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Wayanad, Kerala" />
                </div>
                <div className="admin-form-group">
                  <label>Duration</label>
                  <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="3 Days / 2 Nights" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Price</label>
                  <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="From ₹15,999" />
                </div>
                <div className="admin-form-group">
                  <label>Price Note</label>
                  <input value={form.priceNote} onChange={e => setForm(p => ({ ...p, priceNote: e.target.value }))} placeholder="per person" />
                </div>
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

              {/* Tags */}
              <div className="admin-form-group">
                <label>Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="Beach, Island, Family" />
              </div>

              {/* Highlights */}
              <div className="admin-form-group">
                <label>Trip Highlights — one per line (shown as checklist on detail page)</label>
                <textarea
                  value={form.highlights}
                  onChange={e => setForm(p => ({ ...p, highlights: e.target.value }))}
                  rows={5}
                  placeholder="Snorkelling over living coral reefs&#10;Sunset cruise across the Arabian Sea&#10;Beach-side stay with fresh seafood"
                />
              </div>

              {/* Inclusions / Exclusions */}
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Inclusions — one per line</label>
                  <textarea
                    value={form.inclusions}
                    onChange={e => setForm(p => ({ ...p, inclusions: e.target.value }))}
                    rows={5}
                    placeholder="Return airfare&#10;Accommodation&#10;Daily breakfast"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Exclusions — one per line</label>
                  <textarea
                    value={form.exclusions}
                    onChange={e => setForm(p => ({ ...p, exclusions: e.target.value }))}
                    rows={5}
                    placeholder="Lunch and personal expenses&#10;Travel insurance"
                  />
                </div>
              </div>

              {/* Itinerary */}
              <div className="admin-form-group" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                  <label style={{ margin: 0 }}>Day-by-Day Itinerary</label>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={addItin} style={{ padding: '.3rem .8rem', fontSize: '.75rem' }}>
                    + Add Day
                  </button>
                </div>
                {form.itinerary.map((step, i) => (
                  <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: '#f7f8fc', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '.8rem', color: '#5a627d' }}>Day {i + 1}</span>
                      <button type="button" onClick={() => removeItin(i)} style={{ background: 'none', border: 'none', color: '#c33', cursor: 'pointer', fontSize: '.8rem' }}>Remove</button>
                    </div>
                    <div className="admin-form-row">
                      <div className="admin-form-group" style={{ marginBottom: '.5rem' }}>
                        <label>Day Label</label>
                        <input value={step.day} onChange={e => updateItin(i, 'day', e.target.value)} placeholder="Day 1" />
                      </div>
                      <div className="admin-form-group" style={{ marginBottom: '.5rem' }}>
                        <label>Title</label>
                        <input value={step.title} onChange={e => updateItin(i, 'title', e.target.value)} placeholder="Arrival & check-in" />
                      </div>
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label>Description</label>
                      <textarea value={step.description} onChange={e => updateItin(i, 'description', e.target.value)} rows={3} placeholder="What happens on this day..." />
                    </div>
                  </div>
                ))}
                {form.itinerary.length === 0 && (
                  <p style={{ color: '#8a90a8', fontSize: '.8rem', margin: 0 }}>No itinerary days yet. Click "+ Add Day" to build the trip plan.</p>
                )}
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
