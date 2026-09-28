const factory = require('./factory.app.json');
let operatorx = {};
try { operatorx = require('./app.operatorx.json'); } catch {}

const GOOGLE_TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';
const GOOGLE_TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

module.exports = () => {
  const isProd = process.env.EXPO_PUBLIC_APP_ENV === 'production';
  const admob = factory.admob || {};
  const website = factory.website || {};

  if (isProd && factory.monetization === 'admob') {
    const missing = [];
    if (!admob.ios_app_id) missing.push('admob.ios_app_id');
    if (!admob.banner_unit_id) missing.push('admob.banner_unit_id');
    if (!admob.interstitial_unit_id) missing.push('admob.interstitial_unit_id');
    if (!admob.created_before_apple_build) missing.push('admob.created_before_apple_build');
    if (!admob.ump_message_published) missing.push('admob.ump_message_published');
    if (!website.base_url) missing.push('website.base_url');
    if (!website.domain_control_confirmed) missing.push('website.domain_control_confirmed');
    if (!website.deployed) missing.push('website.deployed');
    if (!website.app_ads_verified) missing.push('website.app_ads_verified');
    if (!factory.eas_project_id && !process.env.EAS_PROJECT_ID) missing.push('eas_project_id');
    if (missing.length) throw new Error(`Production blocked by dossier maître: missing ${missing.join(', ')}`);
  }

  const iosAppId = isProd ? admob.ios_app_id : GOOGLE_TEST_IOS_APP_ID;
  const androidAppId = isProd ? (process.env.ADMOB_ANDROID_APP_ID || GOOGLE_TEST_ANDROID_APP_ID) : GOOGLE_TEST_ANDROID_APP_ID;
  const siteUrl = website.base_url || '';

  return {
    expo: {
      name: factory.name || 'NoteJob',
      slug: factory.slug || 'notejob',
      owner: 'operatorx',
      scheme: 'notejob',
      version: factory.version || '1.0.0',
      orientation: 'portrait',
      userInterfaceStyle: 'light',
      icon: './assets/icon.png',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#F8F5ED'
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: factory.bundle_id || 'com.operatorx.notejob',
        buildNumber: String(factory.build_number || 1),
        icon: './assets/icon.png',
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false
        }
      },
      android: { package: 'com.operatorx.notejob' },
      plugins: [
        ['react-native-google-mobile-ads', {
          iosAppId,
          androidAppId,
          delayAppMeasurementInit: true,
          optimizeInitialization: true
        }],
        ['expo-build-properties', {
          android: { extraProguardRules: '-keep class com.google.android.gms.internal.consent_sdk.** { *; }' }
        }]
      ],
      extra: {
        siteUrl,
        eas: { projectId: process.env.EAS_PROJECT_ID || operatorx?.eas?.projectId || factory.eas_project_id || undefined }
      }
    }
  };
};
