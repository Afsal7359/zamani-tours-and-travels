'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHomeContent, saveHomeContent } from '@/lib/firestore';
import { defaultHomeContent } from '@/lib/defaultData';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AdminHomePage() {
  const [form, setForm] = useState(defaultHomeContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getHomeContent();
        if (data) setForm({ ...defaultHomeContent, ...data });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveHomeContent(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); alert('Error saving. Please try again.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="admin-empty">Loading...</div>;

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Home Content
      </div>

      <form onSubmit={handleSave}>
        {/* Hero Section */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>Hero Section</h2></div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Hero Title</label>
              <input name="heroTitle" value={form.heroTitle || ''} onChange={handleChange} placeholder="Journeys," />
            </div>
            <div className="admin-form-group">
              <label>Hero Title Italic Word</label>
              <input name="heroTitleEm" value={form.heroTitleEm || ''} onChange={handleChange} placeholder="crafted" />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Hero Title Suffix</label>
            <input name="heroTitleSuffix" value={form.heroTitleSuffix || ''} onChange={handleChange} placeholder="with quiet luxury." />
          </div>
          <div className="admin-form-group">
            <label>Hero Lead Text</label>
            <textarea name="heroLead" value={form.heroLead || ''} onChange={handleChange} rows={3} />
          </div>
          <ImageUpload
            label="Hero Background Image"
            value={form.heroImage || ''}
            onChange={val => setForm(prev => ({ ...prev, heroImage: val }))}
          />
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Hero Badge Number</label>
              <input name="heroBadgeNum" value={form.heroBadgeNum || ''} onChange={handleChange} placeholder="15+" />
            </div>
            <div className="admin-form-group">
              <label>Hero Badge Label</label>
              <input name="heroBadgeLabel" value={form.heroBadgeLabel || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Hero Meta Left (e.g. Tours · Visa · Forex)</label>
              <input name="heroMetaLeft" value={form.heroMetaLeft || ''} onChange={handleChange} />
            </div>
            <div className="admin-form-group">
              <label>Hero Meta Trust Text</label>
              <input name="heroMetaTrust" value={form.heroMetaTrust || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Marquee Items (comma-separated)</label>
            <input
              name="marqueeItemsStr"
              value={Array.isArray(form.marqueeItems) ? form.marqueeItems.join(', ') : ''}
              onChange={e => setForm(prev => ({ ...prev, marqueeItems: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="Flight Tickets, Visa Services, ..."
            />
          </div>
        </div>

        {/* About Section */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>About Section</h2></div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>About Title</label>
              <input name="aboutTitle" value={form.aboutTitle || ''} onChange={handleChange} />
            </div>
            <div className="admin-form-group">
              <label>About Title Italic Word</label>
              <input name="aboutTitleEm" value={form.aboutTitleEm || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="admin-form-group">
            <label>About Title Suffix</label>
            <input name="aboutTitleSuffix" value={form.aboutTitleSuffix || ''} onChange={handleChange} />
          </div>
          <div className="admin-form-group">
            <label>About Paragraph 1</label>
            <textarea name="aboutP1" value={form.aboutP1 || ''} onChange={handleChange} rows={3} />
          </div>
          <div className="admin-form-group">
            <label>About Paragraph 2</label>
            <textarea name="aboutP2" value={form.aboutP2 || ''} onChange={handleChange} rows={3} />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Years Stat (e.g. 15+)</label>
              <input name="statYears" value={form.statYears || ''} onChange={handleChange} />
            </div>
            <div className="admin-form-group">
              <label>Clients Stat (e.g. 12K+)</label>
              <input name="statClients" value={form.statClients || ''} onChange={handleChange} />
            </div>
            <div className="admin-form-group">
              <label>Services Stat (e.g. 11)</label>
              <input name="statServices" value={form.statServices || ''} onChange={handleChange} />
            </div>
          </div>
          <ImageUpload
            label="About Image 1 (main)"
            value={form.aboutImg1 || ''}
            onChange={val => setForm(prev => ({ ...prev, aboutImg1: val }))}
          />
          <ImageUpload
            label="About Image 2 (accent overlay)"
            value={form.aboutImg2 || ''}
            onChange={val => setForm(prev => ({ ...prev, aboutImg2: val }))}
          />
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
