import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Brand } from '../components/Brand';
import { Company } from '../types';
import { getFavorites } from '../lib/favorites';

export function FavoritesScreen({ onCompany, onHome, onSearch, onProfile }: {
  onCompany: (company: Company) => void;
  onHome: () => void;
  onSearch: () => void;
  onProfile: () => void;
}) {
  const [items, setItems] = useState<Company[]>([]);
  const load = useCallback(() => { getFavorites().then(setItems); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe}>
    <View style={styles.screen}>
      <View style={styles.header}>
        <Brand size={30} />
        <Text style={styles.title}>Vos entreprises enregistrées.</Text>
        <Text style={styles.body}>Retrouvez rapidement les entreprises que vous souhaitez comparer.</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.siret}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucun favori pour le moment.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onCompany(item)} activeOpacity={0.7} style={styles.row}>
            <View style={styles.mark}><Text style={styles.markText}>{item.name.slice(0, 1).toUpperCase()}</Text></View>
            <View style={styles.rowText}>
              <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.city}{item.postalCode ? ` · ${item.postalCode}` : ''}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
      <BottomNav active="favorites" onTab={(tab) => {
        if (tab === 'home') onHome();
        if (tab === 'search') onSearch();
        if (tab === 'profile') onProfile();
      }} />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7EFE4' },
  screen: { flex: 1, backgroundColor: '#F7EFE4' },
  header: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 26 },
  title: { marginTop: 32, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -1.1, color: '#111510' },
  body: { marginTop: 13, fontSize: 15.5, lineHeight: 22, color: '#6C6E68' },
  list: { paddingHorizontal: 24, paddingBottom: 20 },
  empty: { paddingVertical: 36, fontSize: 15, color: '#777A73' },
  row: { minHeight: 78, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D4D2CA', flexDirection: 'row', alignItems: 'center' },
  mark: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#DDEAE1', alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#174C3D', fontSize: 18, fontWeight: '800' },
  rowText: { flex: 1, marginLeft: 13 },
  name: { fontSize: 16, fontWeight: '800', color: '#111510' },
  meta: { marginTop: 4, fontSize: 12.5, color: '#73766F' },
  arrow: { fontSize: 30, color: '#174C3D', fontWeight: '300' },
});
