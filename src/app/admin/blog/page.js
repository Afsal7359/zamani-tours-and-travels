'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBlogPosts, saveBlogPost, deleteBlogPost } from '@/lib/firestore';
import ImageUpload from '@/components/admin/ImageUpload';
import { useUpload } from '@/components/admin/UploadContext';

const CATEGORIES = ['Visa Guides', 'Umrah', 'Destinations', 'Forex', 'GCC Work'];
const emptyForm = { title: '', excerpt: '', content: '', image: '', category: 'Visa Guides', date: '', readTime: '', featured: false };

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { isUploading } = useUpload();

  async function load() {
    setLoading(true);
    try {
      const data = await getBlogPosts();
      setPosts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openModal(item = null) {
    if (item) {
      setEditItem(item);
      setForm({ ...emptyForm, ...item });
    } else {
      setEditItem(null);
      setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    }
    setModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBlogPost(editItem?.id || null, { ...form, featured: !!form.featured });
      setModal(false);
      await load();
    } catch (err) { console.error(err); alert('Error saving.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this blog post?')) return;
    try { await deleteBlogPost(id); await load(); }
    catch (e) { console.error(e); }
  }

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin">Dashboard</Link> / Blog Posts
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Blog Posts ({posts.length})</h2>
          <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Post
          </button>
        </div>

        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="admin-empty">No blog posts yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => (
                <tr key={post.id || post.slug || post.title || idx}>
                  <td><img src={post.image} className="thumb" alt={post.title} /></td>
                  <td style={{ fontWeight: 600, maxWidth: '220px' }}>{post.title}</td>
                  <td><span className="admin-badge blue">{post.category}</span></td>
                  <td style={{ color: '#5a627d', fontSize: '.82rem' }}>{post.date}</td>
                  <td>
                    {post.featured
                      ? <span className="admin-badge green">Featured</span>
                      : <span className="admin-badge" style={{ background: '#f1f5f9', color: '#8a90a8' }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => openModal(post)}>Edit</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(post.id || post.slug || post.title)}>Delete</button>
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
            <h3>{editItem ? 'Edit Blog Post' : 'Add Blog Post'}</h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label>Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="admin-form-group">
                <label>Excerpt</label>
                <textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={3} required />
              </div>
              <div className="admin-form-group">
                <label>Full Content</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5} />
              </div>
              <ImageUpload
                label="Cover Image"
                value={form.image}
                onChange={val => setForm(p => ({ ...p, image: val }))}
              />
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Read Time (e.g. 5 min)</label>
                  <input value={form.readTime} onChange={e => setForm(p => ({ ...p, readTime: e.target.value }))} placeholder="5 min" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Date (YYYY-MM-DD)</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', paddingTop: '1.4rem' }}>
                  <input
                    type="checkbox"
                    id="featured"
                    checked={!!form.featured}
                    onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="featured" style={{ marginBottom: 0, cursor: 'pointer' }}>Featured Post</label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || isUploading}>
                  {isUploading ? 'Uploading image…' : saving ? 'Saving...' : 'Save Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
