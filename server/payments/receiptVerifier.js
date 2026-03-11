import { createGooglePlayVerifier } from './googlePlayVerifier.js';

const PRODUCT_BUNDLE_MAP = {
  yeopjeon_3_bundle: {
    productId: 'yeopjeon_3_bundle',
    coinAmount: 3,
    priceKrw: 500,
  },
};

const createReceiptError = (code, message) => {
  const error = new Error(message || code);
  error.code = code;
  return error;
};

export function createReceiptVerifier(config) {
  const googlePlayVerifier = createGooglePlayVerifier(config);

  return {
    async verifyProductPurchase(request) {
      const bundle = PRODUCT_BUNDLE_MAP[request.bundleId];
      if (!bundle) {
        throw createReceiptError('INVALID_BUNDLE', 'Requested bundle is not recognized.');
      }

      if (request.productId !== bundle.productId) {
        throw createReceiptError('BUNDLE_PRODUCT_MISMATCH', 'Bundle and product id do not match.');
      }

      const verification = await googlePlayVerifier.verifyProductPurchase({
        productId: request.productId,
        purchaseToken: request.purchaseToken,
        packageNameOverride: request.packageName,
      });

      return {
        provider: verification.provider,
        bundleId: request.bundleId,
        productId: request.productId,
        coinAmount: bundle.coinAmount,
        priceKrw: bundle.priceKrw,
        externalPurchaseId: verification.externalPurchaseId,
        orderId: verification.orderId,
        purchaseToken: verification.purchaseToken,
        metadata: {
          packageName: verification.packageName,
          purchaseTime: verification.purchaseTime,
          acknowledged: verification.acknowledged,
          purchaseState: verification.purchaseState,
          acknowledgementState: verification.acknowledgementState,
          raw: verification.raw,
        },
      };
    },
  };
}
