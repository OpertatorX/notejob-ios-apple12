import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Platform, type AppStateStatus } from 'react-native';
import { ErrorCode, finishTransaction, getAvailablePurchases as getAvailablePurchasesDirect, useIAP, verifyPurchaseWithProvider, type Purchase } from 'expo-iap';

export const PRODUCT_IDS = {
  sixMonths: 'com.operatorx.oxinvoice.pro.6months',
  yearly: 'com.operatorx.oxinvoice.pro.yearly',
} as const;

const ALL_PRODUCT_IDS = Object.values(PRODUCT_IDS);

export interface PlanView {
  id: string;
  title: string;
  displayPrice: string;
}

interface PurchaseContextValue {
  connected: boolean;
  verificationConfigured: boolean;
  plans: PlanView[];
  busy: boolean;
  purchase: (id: string) => Promise<void>;
  restore: () => Promise<boolean>;
  refreshEntitlement: () => Promise<boolean>;
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function PurchaseProvider({ children, onEntitlement }: { children: React.ReactNode; onEntitlement: (active: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const iapKitKey = process.env.EXPO_PUBLIC_IAPKIT_API_KEY || '';
  const verificationConfigured = iapKitKey.startsWith('openiap-kit_pk_');

  const verifyStorePurchase = useCallback(async (purchase: Purchase): Promise<boolean> => {
    if (!verificationConfigured || !purchase.purchaseToken || !ALL_PRODUCT_IDS.includes(purchase.productId as typeof ALL_PRODUCT_IDS[number])) return false;
    const result = await verifyPurchaseWithProvider({
      provider: 'iapkit',
      iapkit: Platform.OS === 'ios'
        ? { apiKey: iapKitKey, apple: { jws: purchase.purchaseToken } }
        : { apiKey: iapKitKey, google: { purchaseToken: purchase.purchaseToken } },
    });
    const verified = result.iapkit;
    // The authoritative IAPKit response does not expose productId. The product
    // identity is already bound to the StoreKit JWS we send for verification,
    // and purchase.productId is allow-listed before this call.
    const verifiedProductId = (verified as (typeof verified & { productId?: string | null }))?.productId;
    return Boolean(
      verified?.isValid === true &&
      verified.state === 'entitled' &&
      verified.store === (Platform.OS === 'ios' ? 'apple' : 'google') &&
      (!verifiedProductId || verifiedProductId === purchase.productId)
    );
  }, [iapKitKey, verificationConfigured]);

  const lastVerifiedSuccessAt = useRef(0);

  const {
    connected, subscriptions, fetchProducts, requestPurchase, restorePurchases,
  } = useIAP({
    onPurchaseSuccess: async purchase => {
      setBusy(true);
      try {
        if (!verificationConfigured) throw new Error('Purchase verification is not configured for this build.');
        const verified = await verifyStorePurchase(purchase);
        if (!verified) throw new Error('Purchase verification failed. No access was granted.');
        lastVerifiedSuccessAt.current = Date.now();
        onEntitlement(true);
        await finishTransaction({ purchase, isConsumable: false });
      } catch (error) {
        Alert.alert('OX Invoice Pro', error instanceof Error ? error.message : 'Purchase validation failed.');
      } finally { setBusy(false); }
    },
    onPurchaseError: error => {
      setBusy(false);
      if (error.code === ErrorCode.UserCancelled) return;
      // StoreKit 2 can occasionally emit a transient service error immediately
      // after a verified success. Do not show a false failure banner in that case.
      if (
        error.code === ErrorCode.ServiceError &&
        Date.now() - lastVerifiedSuccessAt.current < 1500
      ) return;
      Alert.alert('OX Invoice Pro', error.message);
    },
  });

  useEffect(() => {
    if (!connected) return;
    void fetchProducts({ skus: ALL_PRODUCT_IDS, type: 'subs' });
  }, [connected, fetchProducts]);

  const refreshEntitlement = useCallback(async () => {
    if (!connected || !verificationConfigured) return false;
    try {
      // On iOS, getAvailablePurchases reads StoreKit 2 current entitlements.
      // We then verify the matching JWS with IAPKit before changing access.
      const purchases = await getAvailablePurchasesDirect({ onlyIncludeActiveItemsIOS: true });
      const candidates = purchases.filter(p => ALL_PRODUCT_IDS.includes(p.productId as typeof ALL_PRODUCT_IDS[number]) && Boolean(p.purchaseToken));
      if (candidates.length === 0) {
        onEntitlement(false);
        return false;
      }
      for (const candidate of candidates) {
        if (await verifyStorePurchase(candidate)) {
          onEntitlement(true);
          return true;
        }
      }
      onEntitlement(false);
      return false;
    } catch {
      // Keep the last locally persisted entitlement during a temporary Store/IAPKit outage.
      return false;
    }
  }, [connected, onEntitlement, verificationConfigured, verifyStorePurchase]);

  useEffect(() => { if (connected) void refreshEntitlement(); }, [connected, refreshEntitlement]);

  useEffect(() => {
    if (!connected) return;
    const sub = AppState.addEventListener('change', (state:AppStateStatus) => {
      if (state === 'active') void refreshEntitlement();
    });
    return () => sub.remove();
  }, [connected, refreshEntitlement]);

  const purchase = useCallback(async (id: string) => {
    if (!verificationConfigured) throw new Error('IAPKit publishable key is missing from this build.');
    if (!ALL_PRODUCT_IDS.includes(id as typeof ALL_PRODUCT_IDS[number])) throw new Error('Unknown subscription product.');
    setBusy(true);
    try {
      await requestPurchase({ request: { apple: { sku: id }, google: { skus: [id] } }, type: 'subs' });
    } catch (error) {
      setBusy(false);
      throw error;
    }
  }, [requestPurchase, verificationConfigured]);

  const restore = useCallback(async () => {
    setBusy(true);
    try {
      // On iOS this performs the native App Store restore/sync first, then we
      // re-read current entitlements and verify them with IAPKit.
      await restorePurchases({ onlyIncludeActiveItemsIOS: true });
      return await refreshEntitlement();
    } finally { setBusy(false); }
  }, [refreshEntitlement, restorePurchases]);

  const plans = useMemo(() => subscriptions
    .filter(p => ALL_PRODUCT_IDS.includes(p.id as typeof ALL_PRODUCT_IDS[number]))
    .map(p => ({ id: p.id, title: p.title, displayPrice: p.displayPrice })), [subscriptions]);

  return <PurchaseContext.Provider value={{ connected, verificationConfigured, plans, busy, purchase, restore, refreshEntitlement }}>{children}</PurchaseContext.Provider>;
}

export function usePurchases(): PurchaseContextValue {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchases must be used inside PurchaseProvider');
  return ctx;
}
