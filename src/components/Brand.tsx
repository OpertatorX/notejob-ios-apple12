import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export function Brand({ size = 30 }: { size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel="NoteJob">
      <Text style={[styles.word, { fontSize: size, lineHeight: size + 4 }]}>Note</Text>
      <Text style={[styles.word, styles.green, { fontSize: size, lineHeight: size + 4 }]}>Job</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  word: { fontFamily: SERIF, fontWeight: '700', color: '#111510', letterSpacing: -1.2 },
  green: { color: '#0A5B43' },
});
