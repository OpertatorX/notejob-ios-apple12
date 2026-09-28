import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function ScoreBar({ label, value }: { label: string; value: number; icon?: string }) {
  const width = `${Math.max(0, Math.min(100, (value / 5) * 100))}%` as `${number}%`;
  return (
    <View style={styles.row}>
      <View style={styles.topline}>
        <Text numberOfLines={2} style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value ? value.toFixed(1) : '—'}</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10 },
  topline: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  label: { flex: 1, paddingRight: 18, fontSize: 14.5, lineHeight: 18, fontWeight: '600', color: '#2A332E' },
  value: { width: 38, textAlign: 'right', fontSize: 13.5, fontWeight: '800', color: '#174C3D' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#E3DDD4', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: '#315F50' },
});
