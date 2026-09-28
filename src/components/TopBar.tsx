import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function TopBar({ onSettings }: { onSettings: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.logo}>NoteJob</Text>
      <TouchableOpacity onPress={onSettings} hitSlop={12} style={styles.settings}>
        <Text style={styles.settingsText}>•••</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 27, fontWeight: '900', letterSpacing: -1.2, color: '#151515' },
  settings: { paddingHorizontal: 6, paddingVertical: 4 },
  settingsText: { fontSize: 21, fontWeight: '800', color: '#151515', letterSpacing: 1 },
});
