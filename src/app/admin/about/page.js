'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAboutContent, saveAboutContent } from '@/lib/firestore';
import { defaultAboutContent } from '@/lib/defaultData';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AdminAboutPage() {
  const [form, setForm] = useState(defaultAboutContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAboutContent();
        if (data) setForm({ ...defaultAboutContent, ...data });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleValueChange(idx, field, val) {
    setForm(prev => {
      const values = [...(prev.values || [])];
      values[idx] = { ...values[idx], [field]: val };
      return { ...prev, values };
    });
  }

  function addValue() {
    setForm(prev => ({ ...prev, values: [...(prev.values || []), { title: '', description: '' }] }));
  }

  function removeValue(idx) {
    setForm(prev => ({ ...prev, values: prev.values.filter((_, i) => i !== idx) }));
  }

  function handleTimelineChange(idx, field, val) {
    setForm(prev => {
      const timeline = [...(prev.timeline || [])];
      timeline[idx] = { ...timeline[idx], [field]: val };
      return { ...prev, timeline };
    });
  }

  function addTimeline() {
    setForm(prev => ({ ...prev, timeline: [...(prev.timeline || []), { year: '', title: '', description: '' }] }));
  }

  function removeTimeline(idx) {
    setForm(prev => ({ ...prev, timeline: prev.timeline.filter((_, i) => i !== idx) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAboutContent(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); alert('Error saving.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="admin-empty">Loading...</div>;

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / About Content
      </div>

      <form onSubmit={handleSave}>
        {/* Hero */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>Hero Section</h2></div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Hero Title</label>
              <input name="heroTitle" value={form.heroTitle || ''} onChange={handleChange} />
            </div>
            <div className="admin-form-group">
              <label>Hero Title Italic Word</label>
              <input name="heroTitleEm" value={form.heroTitleEm || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Hero Title Suffix</label>
            <input name="heroTitleSuffix" value={form.heroTitleSuffix || ''} onChange={handleChange} />
          </div>
          <div className="admin-form-group">
            <label>Hero Lead Text</label>
            <textarea name="heroLead" value={form.heroLead || ''} onChange={handleChange} rows={2} />
          </div>
          <ImageUpload
            label="Hero Background Image"
            value={form.heroImage || ''}
            onChange={val => setForm(prev => ({ ...prev, heroImage: val }))}
          />
        </div>

        {/* Story */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>Story Section</h2></div>
          <div className="admin-form-group">
            <label>Story Paragraph 1</label>
            <textarea name="storyP1" value={form.storyP1 || ''} onChange={handleChange} rows={3} />
          </div>
          <div className="admin-form-group">
            <label>Story Paragraph 2</label>
            <textarea name="storyP2" value={form.storyP2 || ''} onChange={handleChange} rows={3} />
          </div>
          <div className="admin-form-group">
            <label>Story Paragraph 3</label>
            <textarea name="storyP3" value={form.storyP3 || ''} onChange={handleChange} rows={3} />
          </div>
          <div className="admin-form-row">
            <ImageUpload
              label="Story Image 1 (main)"
              value={form.storyImg1 || ''}
              onChange={val => setForm(prev => ({ ...prev, storyImg1: val }))}
            />
            <ImageUpload
              label="Story Image 2 (accent overlay)"
              value={form.storyImg2 || ''}
              onChange={val => setForm(prev => ({ ...prev, storyImg2: val }))}
            />
          </div>
        </div>

        {/* Values */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2>Values</h2>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={addValue}>
              + Add Value
            </button>
          </div>
          {(form.values || []).map((val, idx) => (
            <div key={idx} style={{ border: '1px solid rgba(10,18,53,.08)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.8rem' }}>
                <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#5a627d' }}>Value {idx + 1}</span>
                <button type="button" className="admin-btn admin-btn-danger" onClick={() => removeValue(idx)} style={{ padding: '.3rem .7rem', fontSize: '.75rem' }}>Remove</button>
              </div>
              <div className="admin-form-group">
                <label>Title</label>
                <input value={val.title} onChange={e => handleValueChange(idx, 'title', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea value={val.description} onChange={e => handleValueChange(idx, 'description', e.target.value)} rows={2} />
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2>Timeline</h2>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={addTimeline}>
              + Add Milestone
            </button>
          </div>
          {(form.timeline || []).map((item, idx) => (
            <div key={idx} style={{ border: '1px solid rgba(10,18,53,.08)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.8rem' }}>
                <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#5a627d' }}>Milestone {idx + 1}</span>
                <button type="button" className="admin-btn admin-btn-danger" onClick={() => removeTimeline(idx)} style={{ padding: '.3rem .7rem', fontSize: '.75rem' }}>Remove</button>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Year</label>
                  <input value={item.year} onChange={e => handleTimelineChange(idx, 'year', e.target.value)} placeholder="2010" />
                </div>
                <div className="admin-form-group">
                  <label>Title</label>
                  <input value={item.title} onChange={e => handleTimelineChange(idx, 'title', e.target.value)} />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea value={item.description} onChange={e => handleTimelineChange(idx, 'description', e.target.value)} rows={2} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '.88rem' }}>✓ Saved successfully</span>}
        </div>
      </form>
    </>
  );
}
