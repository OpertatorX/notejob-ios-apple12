import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Tab = 'home' | 'search' | 'favorites' | 'profile';

const tabs: Array<{ key: Tab; icon: string; label: string }> = [
  { key: 'home', icon: '⌂', label: 'Accueil' },
  { key: 'search', icon: '⌕', label: 'Rechercher' },
  { key: 'favorites', icon: '♡', label: 'Favoris' },
  { key: 'profile', icon: '○', label: 'Profil' },
];

export function BottomNav({ active, onTab }: { active: Tab; onTab: (tab: Tab) => void }) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const selected = active === tab.key;
        return (
          <TouchableOpacity key={tab.key} onPress={() => onTab(tab.key)} activeOpacity={0.7} style={styles.item}>
            <Text style={[styles.icon, selected && styles.active]}>{tab.icon}</Text>
            <Text style={[styles.label, selected && styles.active]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 70,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D5CC',
    backgroundColor: '#F8F0E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24, lineHeight: 26, color: '#70736D', fontWeight: '500' },
  label: { marginTop: 3, fontSize: 10.5, fontWeight: '600', color: '#70736D' },
  active: { color: '#174C3D', fontWeight: '800' },
});
