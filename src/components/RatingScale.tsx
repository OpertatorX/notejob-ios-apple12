import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function RatingScale({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => onChange(n)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={`${n} sur 5`}
              style={styles.hit}
            >
              <View style={[styles.dot, active && styles.dotActive]}>
                <Text style={[styles.number, active && styles.numberActive]}>{n}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Très mauvais</Text>
        <Text style={styles.legendText}>Excellent</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hit: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E9E3D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#174C3D',
    shadowColor: '#10372C',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  number: { fontSize: 16, fontWeight: '700', color: '#45504A' },
  numberActive: { color: '#FFFDF9', fontSize: 17, fontWeight: '800' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 2 },
  legendText: { fontSize: 11.5, color: '#85847D' },
});
