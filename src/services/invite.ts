import { KEYS, storage } from './storage';

export type InviteTargetTab = 'home' | 'chat' | 'calendar' | 'miniapps' | 'profile';
export type InviteRouteKind = 'invite' | 'compare' | 'fortune';

export type InvitePayload = {
  version: 1;
  inviteId: string;
  source: 'daily_fortune';
  targetTab: InviteTargetTab;
  inviterName: string;
  previewTitle: string;
  previewSummary: string;
  comparisonSummary: string;
  createdAt: string;
};

const INVITE_QUERY_KEY = 'invite';
const DEFAULT_INVITE_ROUTE: InviteRouteKind = 'compare';
const INVITE_ROUTE_KINDS = new Set<InviteRouteKind>(['invite', 'compare', 'fortune']);

const encodeBase64Url = (value: string) =>
  btoa(unescape(encodeURIComponent(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return decodeURIComponent(escape(atob(`${normalized}${padding}`)));
};

const isInviteTargetTab = (value: string): value is InviteTargetTab =>
  ['home', 'chat', 'calendar', 'miniapps', 'profile'].includes(value);

const isInvitePayload = (value: unknown): value is InvitePayload => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<InvitePayload>;
  return (
    payload.version === 1
    && typeof payload.inviteId === 'string'
    && payload.source === 'daily_fortune'
    && typeof payload.inviterName === 'string'
    && typeof payload.previewTitle === 'string'
    && typeof payload.previewSummary === 'string'
    && typeof payload.comparisonSummary === 'string'
    && typeof payload.createdAt === 'string'
    && typeof payload.targetTab === 'string'
    && isInviteTargetTab(payload.targetTab)
  );
};

export const createInvitePayload = (partial: Omit<InvitePayload, 'version' | 'inviteId' | 'createdAt'>): InvitePayload => ({
  version: 1,
  inviteId: `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date().toISOString(),
  ...partial,
});

export const serializeInvitePayload = (payload: InvitePayload) => encodeBase64Url(JSON.stringify(payload));

export const parseInviteToken = (token: string): InvitePayload | null => {
  try {
    const parsed = JSON.parse(decodeBase64Url(token));
    return isInvitePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const buildInviteLink = (payload: InvitePayload, baseHref?: string) => {
  const resolvedBase = baseHref || (typeof window !== 'undefined' ? window.location.origin : 'https://sazoo.app');
  const url = new URL(resolvedBase);
  url.pathname = `/${DEFAULT_INVITE_ROUTE}/${serializeInvitePayload(payload)}`;
  url.search = '';
  return url.toString();
};

export const persistPendingInvite = (payload: InvitePayload) => {
  storage.set(KEYS.PENDING_INVITE, payload);
};

export const getPendingInvite = () => storage.get(KEYS.PENDING_INVITE, null) as InvitePayload | null;

export const clearPendingInvite = () => {
  storage.remove(KEYS.PENDING_INVITE);
};

export const resolveInviteTargetTab = (payload: InvitePayload | null | undefined): InviteTargetTab =>
  payload?.targetTab && isInviteTargetTab(payload.targetTab) ? payload.targetTab : 'chat';

const extractInviteTokenFromPath = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const [routeKind, token] = segments;
  if (!INVITE_ROUTE_KINDS.has(routeKind as InviteRouteKind) || !token) {
    return null;
  }

  return {
    routeKind: routeKind as InviteRouteKind,
    token,
  };
};

export const captureInviteFromLocation = (href = typeof window !== 'undefined' ? window.location.href : '') => {
  if (!href) return null;

  const url = new URL(href);
  const routeMatch = extractInviteTokenFromPath(url.pathname);
  const token = routeMatch?.token || url.searchParams.get(INVITE_QUERY_KEY);
  if (!token) return null;

  const payload = parseInviteToken(token);
  if (!payload) return null;

  persistPendingInvite(payload);
  if (routeMatch) {
    url.pathname = '/';
  } else {
    url.searchParams.delete(INVITE_QUERY_KEY);
  }

  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  return payload;
};
