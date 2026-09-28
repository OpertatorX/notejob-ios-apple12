const fs = require('fs');
const path = require('path');

module.exports = () => {
  const root = __dirname;
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.operatorx.json'), 'utf8'));
  const toolchain = JSON.parse(fs.readFileSync(path.join(root, '.operatorx', 'toolchain.json'), 'utf8'));
  const iapKitKey = process.env.EXPO_PUBLIC_IAPKIT_API_KEY || '';
  const easProjectId = process.env.EAS_PROJECT_ID || app.eas?.projectId || '';
  if (process.env.EXPO_PUBLIC_APP_ENV === 'production' && !iapKitKey) {
    throw new Error('Production IAP verification key missing: EXPO_PUBLIC_IAPKIT_API_KEY');
  }
  if (iapKitKey && !iapKitKey.startsWith('openiap-kit_pk_')) {
    throw new Error('EXPO_PUBLIC_IAPKIT_API_KEY must be an IAPKit publishable key (openiap-kit_pk_), never a secret key.');
  }

  return {
    expo: {
      name: app.name,
      slug: app.slug,
      owner: 'operatorx',
      owner: 'operatorx',
      version: app.version,
      orientation: 'portrait',
      userInterfaceStyle: 'light',
      icon: './assets/icon.png',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#F6F7F8'
      },
      ios: {
        bundleIdentifier: app.bundleId,
        buildNumber: String(app.build),
        supportsTablet: Boolean(app.apple?.ipad),
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
          CFBundleLocalizations: ['fr', 'en'],
          CFBundleDevelopmentRegion: 'en'
        }
      },
      plugins: [
        ['expo-iap', iapKitKey ? { iapkitApiKey: iapKitKey } : {}],
        ['expo-image-picker', {
          photosPermission: 'OX Invoice accesses your photo library only when you choose a business logo.',
          cameraPermission: false,
          microphonePermission: false
        }],
        ['expo-build-properties', { ios: { deploymentTarget: '16.4' } }]
      ],
      extra: {
      eas: {
        projectId: "a8ec463b-a530-41c9-af1f-c5499359f881",
      },
        operatorX: true,
        expoSdk: toolchain.expoSdk,
        eas: easProjectId ? { projectId: easProjectId } : undefined,
        iapkitApiKey: iapKitKey || undefined,
        privacyUrl: app.website?.privacyUrl || '',
        supportUrl: app.website?.supportUrl || '',
        termsUrl: app.website?.termsUrl || '',
        eas: app.eas?.projectId ? { projectId: app.eas.projectId } : undefined
      }
    }
  };
};



