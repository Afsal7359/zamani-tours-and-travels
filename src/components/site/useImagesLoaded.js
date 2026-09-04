'use client';
import { useEffect, useState } from 'react';

/**
 * Returns `true` once eager <img> elements are ready or immediately after a quick check.
 * Maximum wait is capped at 150ms to ensure 0 perceived page-load lag.
 */
export default function useImagesLoaded(active) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
    };

    const imgs = Array.from(document.querySelectorAll('img')).filter(
      img => img.loading !== 'lazy'
    );

    if (imgs.length === 0 || imgs.every(img => img.complete)) {
      finish();
      return;
    }

    let remaining = imgs.length;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) finish();
    };

    const cleanups = [];
    imgs.forEach(img => {
      if (img.complete) {
        tick();
      } else {
        const onDone = () => tick();
        img.addEventListener('load', onDone);
        img.addEventListener('error', onDone);
        cleanups.push(() => {
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
        });
      }
    });

    // Never block longer than 150ms
    const timer = setTimeout(finish, 150);

    return () => {
      clearTimeout(timer);
      cleanups.forEach(fn => fn());
    };
  }, [active]);

  return ready;
}
