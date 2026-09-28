import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { adsAllowed, BannerAd, BannerAdSize, bannerUnitId } from '../lib/ads';

export function AdBanner() {
  const bannerRef = useRef<any>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bannerKey, setBannerKey] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      try {
        bannerRef.current?.load?.();
      } catch {
        setBannerKey((value) => value + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  if (!adsAllowed() || !visible) return null;

  const adaptiveSize =
    (BannerAdSize as any).LARGE_ANCHORED_ADAPTIVE_BANNER ||
    (BannerAdSize as any).ANCHORED_ADAPTIVE_BANNER ||
    BannerAdSize.BANNER;

  return (
    <View style={styles.shell}>
      <BannerAd
        key={bannerKey}
        ref={bannerRef}
        unitId={bannerUnitId()}
        size={adaptiveSize}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => {
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          setVisible(true);
          console.log('[AdMob][Banner] loaded');
        }}
        onAdImpression={() => console.log('[AdMob][Banner] impression')}
        onAdFailedToLoad={(error) => {
          console.warn('[AdMob][Banner] failed', (error as any)?.code || '', (error as any)?.message || error);
          setVisible(false);
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => {
            setVisible(true);
            setBannerKey((value) => value + 1);
          }, 30000);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#F6F1E9',
  },
});
