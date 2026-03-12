import { Capacitor } from '@capacitor/core';
import {
  DEFAULT_REMOTE_ASSET_BASE_URL,
  isOffloadedNativeAssetPath,
  normalizeAssetPath,
} from '../config/assetDelivery.js';
import { clientEnv } from '../config/env';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const isNativeRuntime = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const getRemoteAssetBaseUrl = () =>
  trimTrailingSlash(clientEnv.remoteAssetBaseUrl || DEFAULT_REMOTE_ASSET_BASE_URL);

export const resolveRuntimeAssetUrl = (assetPath: string) => {
  if (!assetPath || ABSOLUTE_URL_PATTERN.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = normalizeAssetPath(assetPath);
  if (!normalizedPath) {
    return assetPath;
  }

  if (!isNativeRuntime() || !isOffloadedNativeAssetPath(normalizedPath)) {
    return normalizedPath;
  }

  return `${getRemoteAssetBaseUrl()}${normalizedPath}`;
};

export const shouldPreloadAssetNow = (assetPath: string) =>
  !isNativeRuntime() || !isOffloadedNativeAssetPath(assetPath);
