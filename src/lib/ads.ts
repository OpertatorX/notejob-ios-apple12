import { Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import factory from '../../factory.app.json';

let canRequest = false;
let initialized = false;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

const admob = factory.admob || {};
const IOS_BANNER_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER || admob.banner_unit_id;
const IOS_INTERSTITIAL_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL || admob.interstitial_unit_id;
const USE_TEST_ADS = process.env.EXPO_PUBLIC_ADMOB_TEST_MODE === 'true' || (typeof __DEV__ !== 'undefined' && __DEV__);

export async function initializeAds() {
  try {
    const consent = await AdsConsent.gatherConsent();
    canRequest = consent.canRequestAds;
  } catch (error) {
    console.warn('[AdMob][UMP] gatherConsent failed', error);
    try {
      const info = await AdsConsent.getConsentInfo();
      canRequest = info.canRequestAds;
    } catch {
      canRequest = false;
    }
  }

  if (canRequest && !initialized) {
    await mobileAds().initialize();
    initialized = true;
    preloadInterstitial();
  }
}

export function adsAllowed() {
  return canRequest && initialized;
}

export function bannerUnitId() {
  if (USE_TEST_ADS) return TestIds.BANNER;
  if (Platform.OS === 'ios' && IOS_BANNER_UNIT_ID) return IOS_BANNER_UNIT_ID;
  return TestIds.BANNER;
}

function preloadInterstitial() {
  if (!adsAllowed()) return;
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  const unitId = USE_TEST_ADS
    ? TestIds.INTERSTITIAL
    : (Platform.OS === 'ios' && IOS_INTERSTITIAL_UNIT_ID ? IOS_INTERSTITIAL_UNIT_ID : TestIds.INTERSTITIAL);

  interstitial = InterstitialAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: true,
  });
  interstitialLoaded = false;
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
    console.log('[AdMob][Interstitial] loaded');
  });
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    interstitialLoaded = false;
    preloadInterstitial();
  });
  interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
    interstitialLoaded = false;
    console.warn('[AdMob][Interstitial] failed', (error as any)?.code || '', (error as any)?.message || error);
    retryTimer = setTimeout(() => preloadInterstitial(), 30000);
  });
  interstitial.load();
}

export async function showInterstitialIfReady() {
  if (!interstitial || !interstitialLoaded) return false;
  try {
    await interstitial.show();
    return true;
  } catch (error) {
    console.warn('[AdMob][Interstitial] show failed', error);
    interstitialLoaded = false;
    preloadInterstitial();
    return false;
  }
}

export { BannerAd, BannerAdSize };
