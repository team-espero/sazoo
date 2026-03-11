import { useEffect } from 'react';
import { preloadModel } from './HomeScene';

const CRITICAL_IMAGES = [
  '/destiny_check.png',
  '/12.%20Cyber-Bokjumeoni.png',
  '/static_scholar_woman.png',
  '/static_scholar-man.png',
  '/webp/greeting2.webp',
];

const DEFERRED_MEDIA = [
  '/checking_saju.mp4',
  '/webp/reading_saju_pink.webp',
];

const preloadImage = (src: string) => {
  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  img.src = src;
};

const warmMedia = (src: string) => {
  const media = document.createElement('video');
  media.src = src;
  media.preload = 'metadata';
  media.muted = true;
  media.playsInline = true;
  media.load();
};

export default function AssetPreloader() {
  useEffect(() => {
    CRITICAL_IMAGES.forEach(preloadImage);

    const runDeferredPreload = () => {
      DEFERRED_MEDIA.forEach(warmMedia);
      preloadModel('/sazoo_hanok_web_home_1024.glb');
    };

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(runDeferredPreload, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(runDeferredPreload, 600);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
