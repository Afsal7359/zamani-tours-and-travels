'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import AdminSidebar from '@/components/admin/AdminSidebar';
import '@/app/globals.css';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <html lang="en">
        <body style={{ background: '#050B26', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#fff', fontFamily: 'system-ui, sans-serif' }}>Loading...</div>
        </body>
      </html>
    );
  }

  if (pathname === '/admin/login') {
    return children;
  }

  if (!user) {
    return null;
  }

  const pageTitle = {
    '/admin': 'Dashboard',
    '/admin/home': 'Home Content',
    '/admin/about': 'About Content',
    '/admin/services': 'Services',
    '/admin/process': 'Process Steps',
    '/admin/blog': 'Blog Posts',
    '/admin/destinations': 'Destinations',
    '/admin/testimonials': 'Testimonials',
    '/admin/contacts': 'Contact Submissions',
    '/admin/settings': 'Site Settings',
  }[pathname] || 'Admin Panel';

  return (
    <div className="admin-layout">
      <AdminSidebar user={user} />
      <div className="admin-main">
        <div className="admin-topbar">
          <h1>{pageTitle}</h1>
          <div className="user-info">
            <span style={{ color: '#5a627d' }}>{user.email}</span>
          </div>
        </div>
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
