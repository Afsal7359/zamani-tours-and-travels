'use client';
import { useEffect, useState } from 'react';

/**
 * Returns `true` once every eager (non-lazy) <img> on the page has finished
 * loading. Pass `active` = true after page data has loaded and the content
 * (with its <img> tags) has rendered — until then the hook stays idle.
 *
 * Lazy images (loading="lazy") are intentionally ignored so the loader is not
 * held open by below-the-fold images that only load on scroll. A safety
 * timeout guarantees the page is never blocked indefinitely.
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

    if (imgs.length === 0) {
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

    // Never hold the loader for more than 8s, even on slow connections.
    const timer = setTimeout(finish, 8000);

    return () => {
      clearTimeout(timer);
      cleanups.forEach(fn => fn());
    };
  }, [active]);

  return ready;
}
