import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Company, CompanyStats } from '../types';
import { fetchCompanyStats } from '../lib/ratings';
import { Translations } from '../i18n/strings';

function ResultScore({ company, t }: { company: Company; t: Translations }) {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  useEffect(() => { void fetchCompanyStats(company).then(setStats); }, [company]);
  if (!stats) return <ActivityIndicator size="small" color="#174C3D" />;
  if (!stats.count) return <Text style={styles.noReviews}>Pas encore d’avis</Text>;
  return (
    <View style={styles.scoreBlock}>
      <Text style={styles.scoreValue}>{stats.overall.toFixed(1)}</Text>
      <Text style={styles.scoreCount}>{stats.count} {t.reviews.toLowerCase()}</Text>
    </View>
  );
}

export function SearchResultsScreen({ query, city, results, t, onBack, onCompany }: {
  query: string;
  city: string;
  results: Company[];
  t: Translations;
  onBack: () => void;
  onCompany: (company: Company) => void;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.62} accessibilityLabel="Retour">
          <Text style={styles.backGlyph}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NoteJob</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.eyebrow}>ENTREPRISES · {city.toUpperCase()}</Text>
        <Text numberOfLines={2} style={styles.query}>{query}</Text>
        <Text style={styles.meta}>{results.length} {results.length === 1 ? t.workplaceSingular : t.establishments}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t.noMatchingWorkplaceTitle}</Text>
            <Text style={styles.emptyText}>{t.noMatchingWorkplaceBody}</Text>
            <TouchableOpacity onPress={onBack} style={styles.emptyButton}><Text style={styles.emptyButtonText}>{t.newSearch}</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {results.slice(0, 20).map((item) => (
              <TouchableOpacity key={item.siret} onPress={() => onCompany(item)} activeOpacity={0.66} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text numberOfLines={2} style={styles.rowName}>{item.name}</Text>
                  <Text numberOfLines={2} style={styles.rowAddress}>{[item.address, item.postalCode, item.city].filter(Boolean).join(' · ')}</Text>
                </View>
                <ResultScore company={item} t={t} />
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EC' },
  header: { height: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 38, height: 38, alignItems: 'flex-start', justifyContent: 'center' },
  backGlyph: { fontSize: 36, lineHeight: 38, marginTop: -4, color: '#173C32', fontWeight: '300' },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2, color: '#39423E' },
  headerSpacer: { width: 38, height: 38 },
  summary: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 22 },
  eyebrow: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2, color: '#174C3D' },
  query: { marginTop: 8, fontSize: 35, lineHeight: 39, letterSpacing: -1.2, fontWeight: '800', color: '#171B19' },
  meta: { marginTop: 8, fontSize: 13.5, color: '#747771' },
  listContent: { paddingBottom: 34 },
  list: { paddingHorizontal: 24, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D9D5CE' },
  row: { minHeight: 98, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D9D5CE', paddingVertical: 17 },
  rowCopy: { flex: 1, paddingRight: 16 },
  rowName: { fontSize: 18.5, lineHeight: 23, fontWeight: '700', letterSpacing: -0.25, color: '#1C211F' },
  rowAddress: { marginTop: 6, fontSize: 12.5, lineHeight: 18, color: '#747771' },
  scoreBlock: { alignItems: 'flex-end', minWidth: 66 },
  scoreValue: { fontSize: 22, lineHeight: 24, fontWeight: '800', letterSpacing: -0.5, color: '#174C3D' },
  scoreCount: { marginTop: 3, fontSize: 10.5, color: '#898B86' },
  noReviews: { maxWidth: 76, textAlign: 'right', fontSize: 11.5, lineHeight: 15, color: '#8A8C87' },
  chevron: { marginLeft: 11, fontSize: 27, lineHeight: 30, fontWeight: '300', color: '#969892' },
  empty: { paddingHorizontal: 24, paddingVertical: 44, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D9D5CE' },
  emptyTitle: { fontSize: 25, lineHeight: 30, fontWeight: '800', color: '#1C211F' },
  emptyText: { marginTop: 10, fontSize: 15, lineHeight: 22, color: '#6C706B' },
  emptyButton: { marginTop: 26, height: 50, borderRadius: 14, backgroundColor: '#174C3D', alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15.5 },
});
