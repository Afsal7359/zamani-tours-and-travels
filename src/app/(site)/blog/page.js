'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { getBlogPosts, getSiteSettings } from '@/lib/firestore';
import LoadingScreen from '@/components/site/LoadingScreen';
import useImagesLoaded from '@/components/site/useImagesLoaded';

const CATEGORIES = ['All', 'Umrah', 'Visa Guides', 'Destinations', 'GCC Work', 'Forex'];

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, s] = await Promise.all([getBlogPosts(), getSiteSettings()]);
        if (p) setPosts(p);
        if (s) setSettings(s);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      io.observe(el);
    });
    return () => io.disconnect();
  }, [posts, activeCategory, loading]);

  const imagesReady = useImagesLoaded(!loading);

  if (loading) return <LoadingScreen />;

  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  const featuredPost = filteredPosts.find(p => p.featured) || filteredPosts[0];
  const sidebarPosts = filteredPosts.filter(p => p !== featuredPost).slice(0, 4);
  const gridPosts = filteredPosts.filter(p => p !== featuredPost && !sidebarPosts.includes(p));

  return (
    <>
      {!imagesReady && <LoadingScreen />}
      <Navbar activePage="blog" />

      {/* ─── Page Hero ─────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="page-hero-bg">
          <img src={settings?.bannerBlog} alt="Travel Blog" />
        </div>
        <div className="page-hero-content container">
          <span className="eyebrow light">Travel Blog</span>
          <h1>Guides, tips &<br /><em>travel stories.</em></h1>
          <p>Expert advice on visas, destinations, Umrah, forex, and everything in between.</p>
        </div>
      </section>

      {/* ─── Blog Section ──────────────────────────────────────────────── */}
      <section className="blog-section">
        <div className="container">
          <div className="blog-head">
            <span className="eyebrow royal">Latest Articles</span>
            <h2>Stories &amp; guides for<br /><em>every traveller.</em></h2>
            <p>From visa checklists to destination guides — our experts share everything you need to know.</p>
          </div>

          {/* Filter */}
          <div className="blog-filter">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured + Sidebar */}
          {filteredPosts.length > 0 && (
            <div className="blog-layout reveal">
              {featuredPost && (
                <div className="blog-featured">
                  <div className="feat-img">
                    <img src={featuredPost.image} alt={featuredPost.title} />
                  </div>
                  <div className="feat-body">
                    <div className="cat">{featuredPost.category}</div>
                    <h2>{featuredPost.title}</h2>
                    <p>{featuredPost.excerpt}</p>
                    <div className="meta">
                      <span>{featuredPost.date}</span>
                      <span>{featuredPost.readTime} read</span>
                    </div>
                    <Link href="/contact" className="read-more">
                      Read Article
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              )}

              <div className="blog-sidebar">
                {sidebarPosts.map((post, i) => (
                  <div className="side-post" key={post.id || i}>
                    <div className="sp-img">
                      <img src={post.image} alt={post.title} />
                    </div>
                    <div className="sp-body">
                      <div className="sp-cat">{post.category}</div>
                      <h4>{post.title}</h4>
                      <div className="sp-meta">{post.date} · {post.readTime} read</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid */}
          {gridPosts.length > 0 && (
            <div className="blog-grid-section">
              <h2>More Articles</h2>
              <div className="blog-grid">
                {gridPosts.map((post, i) => (
                  <div className="blog-card reveal" key={post.id || i}>
                    <div className="bc-img">
                      <img src={post.image} alt={post.title} />
                    </div>
                    <div className="bc-body">
                      <div className="bc-cat">{post.category}</div>
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      <div className="bc-meta">
                        <span>{post.date}</span>
                        <span>{post.readTime} read</span>
                      </div>
                      <Link href="/contact" className="read-more">
                        Read More
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredPosts.length === 0 && (
            <div className="admin-empty" style={{ padding: '4rem 2rem' }}>
              <p>No articles found for this category yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="cta">
        <div className="container">
          <div className="cta-inner">
            <div className="reveal">
              <span className="eyebrow light">Plan Your Trip</span>
              <h2>Ready to turn<br /><em>reading into travelling?</em></h2>
              <p>Our advisors can help you plan exactly the journey you've been reading about.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary">Talk to an Advisor</Link>
                <Link href="/services" className="btn btn-ghost">Explore Services</Link>
              </div>
            </div>
            <div className="cta-right reveal">
              <div className="phone-block">
                <span>Call us directly</span>
                <a href={`tel:${(settings?.phone1).replace(/\s/g, '')}`}>{settings?.phone1}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer settings={settings} />
    </>
  );
}
