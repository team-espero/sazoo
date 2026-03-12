const REMOTE_NATIVE_MEDIA_ASSET_PATHS = [
  '/intro-video.mp4',
  '/checking_saju.mp4',
  '/login_video.mp4',
  '/webp/greeting2.webp',
  '/webp/reading_saju_pink.webp',
  '/webp/idle motion.webp',
];

export const DEFAULT_REMOTE_ASSET_BASE_URL = 'https://sazoo.vercel.app';
export const OFFLOADED_NATIVE_MEDIA_ASSET_PATHS = Object.freeze(
  [...REMOTE_NATIVE_MEDIA_ASSET_PATHS].sort(),
);

const stripQueryAndHash = (value) => value.split('#')[0].split('?')[0];

export const normalizeAssetPath = (assetPath) => {
  if (typeof assetPath !== 'string') {
    return '';
  }

  const trimmed = stripQueryAndHash(assetPath.trim());
  if (!trimmed) {
    return '';
  }

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed);
      return decodeURI(parsed.pathname);
    }
  } catch {
    // Fall through and treat the value as a local asset path.
  }

  const normalized = trimmed
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '/')
    .replace(/\/{2,}/g, '/');

  return decodeURI(normalized.startsWith('/') ? normalized : `/${normalized}`);
};

export const isOffloadedNativeAssetPath = (assetPath) => {
  const normalized = normalizeAssetPath(assetPath);
  if (!normalized) {
    return false;
  }

  return normalized.endsWith('.glb') || OFFLOADED_NATIVE_MEDIA_ASSET_PATHS.includes(normalized);
};
