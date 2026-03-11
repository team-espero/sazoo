import { createSign } from 'node:crypto';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

const toBase64Url = (value) =>
  Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const normalizePrivateKey = (value) => String(value || '').replace(/\\n/g, '\n');

const createGoogleError = (code, message) => {
  const error = new Error(message || code);
  error.code = code;
  return error;
};

const createServiceAccountAssertion = ({ clientEmail, privateKey }) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + 3600,
  };

  const unsigned = `${toBase64Url(header)}.${toBase64Url(payload)}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(normalizePrivateKey(privateKey), 'base64url');
  return `${unsigned}.${signature}`;
};

export function createGooglePlayVerifier(config) {
  const packageName = config.googlePlayPackageName || 'com.sazoo.app';
  const clientEmail = config.googlePlayServiceAccountEmail || '';
  const privateKey = config.googlePlayServiceAccountPrivateKey || '';

  const ensureConfigured = () => {
    if (!clientEmail || !privateKey) {
      throw createGoogleError(
        'PURCHASE_VERIFICATION_NOT_CONFIGURED',
        'Google Play purchase verification credentials are not configured.',
      );
    }
  };

  const getAccessToken = async () => {
    ensureConfigured();
    const assertion = createServiceAccountAssertion({ clientEmail, privateKey });
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!response.ok) {
      throw createGoogleError(
        'PURCHASE_VERIFICATION_FAILED',
        `Failed to fetch Google OAuth token (${response.status}).`,
      );
    }

    const payload = await response.json();
    if (!payload?.access_token) {
      throw createGoogleError('PURCHASE_VERIFICATION_FAILED', 'Google OAuth token response was empty.');
    }

    return payload.access_token;
  };

  const acknowledgePurchase = async ({ accessToken, targetPackageName, productId, purchaseToken }) => {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(targetPackageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ developerPayload: 'sazoo_wallet_verify' }),
    });

    if (!response.ok) {
      throw createGoogleError(
        'PURCHASE_ACKNOWLEDGE_FAILED',
        `Failed to acknowledge Google Play purchase (${response.status}).`,
      );
    }
  };

  return {
    async verifyProductPurchase({ productId, purchaseToken, packageNameOverride }) {
      const accessToken = await getAccessToken();
      const targetPackageName = packageNameOverride || packageName;
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(targetPackageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 404) {
        throw createGoogleError('INVALID_RECEIPT', 'Google Play purchase token is invalid or expired.');
      }

      if (!response.ok) {
        throw createGoogleError(
          'PURCHASE_VERIFICATION_FAILED',
          `Google Play verification request failed (${response.status}).`,
        );
      }

      const payload = await response.json();
      const purchaseState = Number(payload?.purchaseState ?? -1);
      const acknowledgementState = Number(payload?.acknowledgementState ?? 0);
      const isValid = purchaseState === 0;

      if (!isValid) {
        throw createGoogleError('INVALID_RECEIPT', 'Google Play purchase state is not purchased.');
      }

      let acknowledged = acknowledgementState === 1;
      if (!acknowledged) {
        await acknowledgePurchase({
          accessToken,
          targetPackageName,
          productId,
          purchaseToken,
        });
        acknowledged = true;
      }

      return {
        provider: 'google_play',
        packageName: targetPackageName,
        productId,
        purchaseToken,
        externalPurchaseId: payload?.orderId || purchaseToken,
        orderId: payload?.orderId || null,
        purchaseTime: payload?.purchaseTimeMillis
          ? new Date(Number(payload.purchaseTimeMillis)).toISOString()
          : null,
        purchaseState,
        acknowledgementState,
        acknowledged,
        raw: payload,
      };
    },
  };
}
