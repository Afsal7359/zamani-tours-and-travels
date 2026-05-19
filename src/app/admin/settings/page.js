'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSiteSettings, saveSiteSettings } from '@/lib/firestore';
import { defaultSiteSettings } from '@/lib/defaultData';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AdminSettingsPage() {
  const [form, setForm] = useState(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSiteSettings();
        if (data) setForm({ ...defaultSiteSettings, ...data });
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
      await saveSiteSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); alert('Error saving.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="admin-empty">Loading settings...</div>;

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Site Settings
      </div>

      <form onSubmit={handleSave}>
        {/* Phone Numbers */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>Phone Numbers</h2></div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Phone 1 (Primary)</label>
              <input name="phone1" value={form.phone1 || ''} onChange={handleChange} placeholder="859 2002 549" />
            </div>
            <div className="admin-form-group">
              <label>Phone 2</label>
              <input name="phone2" value={form.phone2 || ''} onChange={handleChange} placeholder="859 2002 584" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Phone 3</label>
              <input name="phone3" value={form.phone3 || ''} onChange={handleChange} placeholder="859 2002 529" />
            </div>
            <div className="admin-form-group">
              <label>Phone 4</label>
              <input name="phone4" value={form.phone4 || ''} onChange={handleChange} placeholder="859 2042 002" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>Contact Information</h2></div>
          <div className="admin-form-group">
            <label>Email Address</label>
            <input name="email" type="email" value={form.email || ''} onChange={handleChange} placeholder="info@zamanitours.com" />
          </div>
          <div className="admin-form-group">
            <label>Office Address</label>
            <input name="address" value={form.address || ''} onChange={handleChange} placeholder="Kerala, India" />
          </div>
          <div className="admin-form-group">
            <label>Location / City</label>
            <input name="location" value={form.location || ''} onChange={handleChange} placeholder="Malappuram, Kerala" />
          </div>
          <div className="admin-form-group">
            <label>Google Maps Embed URL</label>
            <input
              name="mapUrl"
              value={form.mapUrl || ''}
              onChange={handleChange}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <small style={{ color: '#8a90a8', fontSize: '.75rem' }}>
              Go to Google Maps → Share → Embed a map → copy the src URL from the iframe code
            </small>
          </div>
          <ImageUpload
            label="Site Logo"
            value={form.logoUrl || ''}
            onChange={val => setForm(prev => ({ ...prev, logoUrl: val }))}
          />
          {form.logoUrl && (
            <div style={{ marginTop: '.5rem', padding: '.6rem 1rem', background: '#0A1235', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '.6rem' }}>
              <img src={form.logoUrl} alt="Logo preview" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)' }}>Preview on dark navbar</span>
            </div>
          )}
        </div>

        {/* Brand Text */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>Brand Name &amp; Text</h2></div>
          <p style={{ fontSize: '.82rem', color: '#5a627d', marginBottom: '1.2rem' }}>
            The name and tagline shown next to the logo in the navbar and footer.
          </p>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Brand Name</label>
              <input name="brandName" value={form.brandName || ''} onChange={handleChange} placeholder="Zamani" />
            </div>
            <div className="admin-form-group">
              <label>Brand Subtitle / Tagline</label>
              <input name="brandSubtitle" value={form.brandSubtitle || ''} onChange={handleChange} placeholder="Tours &amp; Travels" />
            </div>
          </div>
          <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginTop: '.4rem' }}>
            <input
              type="checkbox"
              id="showBrandText"
              checked={form.showBrandText !== false}
              onChange={e => setForm(prev => ({ ...prev, showBrandText: e.target.checked }))}
              style={{ width: 'auto', accentColor: '#2B47E5', cursor: 'pointer' }}
            />
            <label htmlFor="showBrandText" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '.88rem' }}>
              Show brand text next to logo
            </label>
          </div>
          {form.logoUrl && (
            <div style={{ marginTop: '1.2rem', padding: '.8rem 1.2rem', background: '#0A1235', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '.7rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={form.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              {form.showBrandText !== false && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ color: '#fff', fontSize: '.88rem' }}>{form.brandName || 'Zamani'}</strong>
                  <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.72rem' }}>{form.brandSubtitle || 'Tours & Travels'}</span>
                </div>
              )}
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', marginLeft: '.4rem' }}>Live navbar preview</span>
            </div>
          )}
        </div>

        {/* Social Media */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>Social Media Links</h2></div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Instagram URL</label>
              <input name="instagram" value={form.instagram || ''} onChange={handleChange} placeholder="https://instagram.com/..." />
            </div>
            <div className="admin-form-group">
              <label>Facebook URL</label>
              <input name="facebook" value={form.facebook || ''} onChange={handleChange} placeholder="https://facebook.com/..." />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>WhatsApp URL (wa.me link)</label>
              <input name="whatsapp" value={form.whatsapp || ''} onChange={handleChange} placeholder="https://wa.me/91..." />
            </div>
            <div className="admin-form-group">
              <label>LinkedIn URL</label>
              <input name="linkedin" value={form.linkedin || ''} onChange={handleChange} placeholder="https://linkedin.com/..." />
            </div>
          </div>
        </div>

        {/* Page Hero Banners */}
        <div className="admin-card">
          <div className="admin-card-head"><h2>Page Hero Banners</h2></div>
          <p style={{ fontSize: '.82rem', color: '#5a627d', marginBottom: '1.4rem' }}>
            Change the background image shown on each page's hero/banner section.
          </p>
          <div className="admin-form-row">
            <ImageUpload
              label="Services Page Banner"
              value={form.bannerServices || ''}
              onChange={val => setForm(prev => ({ ...prev, bannerServices: val }))}
            />
            <ImageUpload
              label="Blog Page Banner"
              value={form.bannerBlog || ''}
              onChange={val => setForm(prev => ({ ...prev, bannerBlog: val }))}
            />
          </div>
          <div className="admin-form-row">
            <ImageUpload
              label="How It Works Page Banner"
              value={form.bannerProcess || ''}
              onChange={val => setForm(prev => ({ ...prev, bannerProcess: val }))}
            />
            <ImageUpload
              label="Contact Page Banner"
              value={form.bannerContact || ''}
              onChange={val => setForm(prev => ({ ...prev, bannerContact: val }))}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '.88rem' }}>✓ Settings saved successfully</span>}
        </div>
      </form>
    </>
  );
}
