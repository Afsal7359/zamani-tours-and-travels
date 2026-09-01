'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/firestore';
import { defaultSiteSettings } from '@/lib/defaultData';

export default function BottomBar() {
  const [settings, setSettings] = useState(defaultSiteSettings);

  useEffect(() => {
    getSiteSettings().then(s => { if (s) setSettings(s); }).catch(() => {});
  }, []);

  const rawPhone = settings.phone1 || defaultSiteSettings.phone1;
  const callHref = `tel:${rawPhone.replace(/\s/g, '')}`;
  const waHref = (settings.whatsapp && !settings.whatsapp.includes('8592002549')) 
    ? settings.whatsapp 
    : 'https://wa.me/918592042002';

  return (
    <aside className="floating-action-dock-wrapper" aria-label="Quick Actions">
      <div className="floating-action-dock">
        {/* ─── CALL BUTTON ─── */}
        <a href={callHref} className="dock-item dock-call" aria-label={`Call us at ${rawPhone}`}>
          <div className="dock-btn-circle call-circle">
            <svg className="dock-icon" width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </div>
          <span className="dock-label">CALL</span>
        </a>

        {/* ─── WHATSAPP BUTTON (ELEVATED HERO) ─── */}
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="dock-item dock-whatsapp" aria-label="Chat on WhatsApp">
          <div className="dock-btn-circle whatsapp-circle">
            <div className="whatsapp-badge-inner">
              <svg className="dock-icon-wa" width="34" height="34" viewBox="0 0 36 36">
                <path d="M18 4C10.27 4 4 10.27 4 18c0 2.76.8 5.33 2.18 7.5L4 32l6.73-2.14C12.83 31.18 15.34 32 18 32c7.73 0 14-6.27 14-14S25.73 4 18 4z" fill="#FFFFFF"/>
                <path d="M24.2 21.6c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.08-.13-.27-.2-.57-.35z" fill="#25D366"/>
              </svg>
            </div>
          </div>
          <span className="dock-label dock-label-hero">WHATSAPP</span>
        </a>

        {/* ─── ENQUIRE BUTTON ─── */}
        <Link href="/contact" className="dock-item dock-enquire" aria-label="Enquire with Zamani">
          <div className="dock-btn-circle enquire-circle">
            <svg className="dock-icon" width="26" height="26" viewBox="0 0 28 28">
              <path d="M14 3C7.92 3 3 7.48 3 13c0 2.2.8 4.23 2.15 5.86L3 25l6.32-2.08C10.82 23.57 12.37 24 14 24c6.08 0 11-4.48 11-11S20.08 3 14 3z" fill="#FFFFFF"/>
              <circle cx="9.5" cy="13" r="1.8" fill="#C9A961"/>
              <circle cx="14" cy="13" r="1.8" fill="#C9A961"/>
              <circle cx="18.5" cy="13" r="1.8" fill="#C9A961"/>
            </svg>
          </div>
          <span className="dock-label">ENQUIRE</span>
        </Link>
      </div>
    </aside>
  );
}
