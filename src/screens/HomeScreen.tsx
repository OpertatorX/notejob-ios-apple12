import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Brand } from '../components/Brand';
import { Company } from '../types';
import { Translations, Language } from '../i18n/strings';
import { searchFrenchEstablishments } from '../lib/companySearch';
import { AdBanner } from '../components/AdBanner';

const HERO = require('../../assets/home_hero.jpg');

export function HomeScreen({ t, onResults, onCompany, onSettings }: {
  t: Translations;
  language: Language;
  onResults: (payload: { query: string; city: string; results: Company[] }) => void;
  onCompany: (company: Company) => void;
  onSettings: () => void;
  focusSearch?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<Company[] | null>(null);
  const [resolvedCity, setResolvedCity] = useState('');
  const companyInput = useRef<TextInput>(null);
  const cityInput = useRef<TextInput>(null);
  const searchSequence = useRef(0);
  const canSearch = query.trim().length >= 2 && city.trim().length >= 2;

  const runSearch = async (dismissKeyboard = false) => {
    if (!canSearch) {
      setResults(null);
      return;
    }
    if (dismissKeyboard) Keyboard.dismiss();
    const sequence = ++searchSequence.current;
    setLoading(true);
    setError(false);
    try {
      const next = await searchFrenchEstablishments(query.trim(), city.trim());
      if (sequence !== searchSequence.current) return;
      setResults(next);
      setResolvedCity(city.trim());
    } catch {
      if (sequence !== searchSequence.current) return;
      setError(true);
      setResults(null);
    } finally {
      if (sequence === searchSequence.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!canSearch) {
      searchSequence.current += 1;
      setResults(null);
      setError(false);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => { void runSearch(false); }, 650);
    return () => clearTimeout(timer);
  }, [query, city]);

  const visibleResults = results?.slice(0, 7) || [];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Brand size={32} />
          <TouchableOpacity onPress={onSettings} style={styles.menuButton} activeOpacity={0.62} accessibilityLabel={t.settings}>
            <Text style={styles.menuIcon}>•••</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroShadow}>
          <ImageBackground source={HERO} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
            <View style={styles.heroWash} />
            <View style={styles.heroShade} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Le travail, vu de l’intérieur.</Text>
              <Text style={styles.heroBody}>Cherchez une entreprise et découvrez ce qu’en pensent ceux qui y travaillent.</Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.searchDock}>
          <TouchableOpacity activeOpacity={1} onPress={() => companyInput.current?.focus()} style={styles.fieldRow}>
            <Text style={styles.fieldGlyph}>⌕</Text>
            <View style={styles.fieldCopy}>
              <Text style={styles.fieldLabel}>{t.company}</Text>
              <TextInput
                ref={companyInput}
                value={query}
                onChangeText={setQuery}
                placeholder={t.searchPlaceholderClean}
                placeholderTextColor="#969690"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => cityInput.current?.focus()}
                style={styles.input}
              />
            </View>
            {!!query && <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}><Text style={styles.clear}>×</Text></TouchableOpacity>}
          </TouchableOpacity>

          <View style={styles.fieldDivider} />

          <TouchableOpacity activeOpacity={1} onPress={() => cityInput.current?.focus()} style={styles.fieldRow}>
            <Text style={styles.fieldGlyph}>⌖</Text>
            <View style={styles.fieldCopy}>
              <Text style={styles.fieldLabel}>{t.yourCity}</Text>
              <TextInput
                ref={cityInput}
                value={city}
                onChangeText={setCity}
                placeholder={t.cityPlaceholderClean}
                placeholderTextColor="#969690"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => void runSearch(true)}
                style={styles.input}
              />
            </View>
            {!!city && <TouchableOpacity onPress={() => setCity('')} hitSlop={10}><Text style={styles.clear}>×</Text></TouchableOpacity>}
          </TouchableOpacity>

          <View style={styles.fieldDivider} />

          <TouchableOpacity
            onPress={() => void runSearch(true)}
            disabled={!canSearch || loading}
            activeOpacity={0.82}
            style={[styles.searchButton, (!canSearch || loading) && styles.searchButtonDisabled]}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.searchText}>{t.search}</Text><Text style={styles.searchArrow}>→</Text></>}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{t.searchNoResponseTitle}</Text>
            <Text style={styles.errorText}>{t.searchUnavailable}</Text>
          </View>
        )}

        {results !== null && !error && (
          <View style={styles.inlineSection}>
            <View style={styles.inlineHeader}>
              <Text style={styles.inlineTitle}>{results.length ? 'Entreprises trouvées' : 'Aucun résultat'}</Text>
              {!!results.length && <Text style={styles.inlineCount}>{results.length}</Text>}
            </View>

            {results.length === 0 ? (
              <Text style={styles.emptyText}>{t.noMatchingCompanyBody}</Text>
            ) : (
              <View style={styles.inlineList}>
                {visibleResults.map((item) => (
                  <TouchableOpacity key={item.siret} onPress={() => onCompany(item)} activeOpacity={0.66} style={styles.resultRow}>
                    <View style={styles.resultCopy}>
                      <Text numberOfLines={1} style={styles.resultName}>{item.name}</Text>
                      <Text numberOfLines={2} style={styles.resultAddress}>{[item.address, item.postalCode, item.city].filter(Boolean).join(' · ')}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {results.length > visibleResults.length && (
              <TouchableOpacity onPress={() => onResults({ query: query.trim(), city: resolvedCity || city.trim(), results })} activeOpacity={0.7} style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Voir les {results.length} entreprises</Text>
                <Text style={styles.seeAllArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F1E9' },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 22, paddingTop: 7, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuButton: { minWidth: 38, height: 38, alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 8 },
  menuIcon: { color: '#174C3D', fontSize: 15, letterSpacing: 1.4, fontWeight: '900', marginTop: -4 },
  heroShadow: { marginHorizontal: 18, shadowColor: '#0E3328', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 7 },
  hero: { height: 276, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 21 },
  heroImage: { borderRadius: 21 },
  heroWash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.02)' },
  heroShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 155, backgroundColor: 'rgba(9,28,22,0.39)' },
  heroCopy: { paddingHorizontal: 21, paddingBottom: 22, maxWidth: 345 },
  heroTitle: { fontSize: 31, lineHeight: 34, letterSpacing: -1.05, color: '#FFFFFF', fontWeight: '800' },
  heroBody: { marginTop: 8, maxWidth: 318, fontSize: 14.2, lineHeight: 19.5, color: 'rgba(255,255,255,0.94)', fontWeight: '500' },
  searchDock: { marginHorizontal: 24, paddingTop: 18, paddingBottom: 4 },
  fieldRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center' },
  fieldDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#D6D0C6' },
  fieldGlyph: { width: 30, color: '#174C3D', fontSize: 18, fontWeight: '700' },
  fieldCopy: { flex: 1, paddingVertical: 7 },
  fieldLabel: { fontSize: 9.5, lineHeight: 12, color: '#676D67', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.82 },
  input: { marginTop: 2, paddingVertical: 1, fontSize: 17, color: '#171B19', fontWeight: '500' },
  clear: { fontSize: 22, color: '#AAA59D', paddingHorizontal: 5 },
  searchButton: { height: 50, marginTop: 16, borderRadius: 14, paddingHorizontal: 17, backgroundColor: '#174C3D', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#10372C', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  searchButtonDisabled: { backgroundColor: '#AFBDB7', shadowOpacity: 0 },
  searchText: { fontSize: 15.5, color: '#FFFFFF', fontWeight: '700' },
  searchArrow: { fontSize: 21, color: '#FFFFFF', fontWeight: '400' },
  errorBox: { marginHorizontal: 24, marginTop: 22, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#CDB9AF', paddingTop: 14 },
  errorTitle: { fontWeight: '800', fontSize: 14, color: '#743D2D' },
  errorText: { marginTop: 3, fontSize: 13, lineHeight: 18, color: '#805043' },
  inlineSection: { marginHorizontal: 24, marginTop: 30 },
  inlineHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 9 },
  inlineTitle: { fontSize: 19, lineHeight: 23, color: '#171B19', fontWeight: '800', letterSpacing: -0.3 },
  inlineCount: { fontSize: 12, color: '#7B7E79', fontWeight: '700' },
  inlineList: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D9D4CB' },
  resultRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D9D4CB', paddingVertical: 13 },
  resultCopy: { flex: 1, paddingRight: 14 },
  resultName: { fontSize: 17.5, lineHeight: 21, color: '#1B211E', fontWeight: '700', letterSpacing: -0.2 },
  resultAddress: { marginTop: 5, fontSize: 12.5, lineHeight: 17, color: '#767973' },
  chevron: { fontSize: 28, lineHeight: 30, color: '#91938E', fontWeight: '300' },
  emptyText: { paddingTop: 9, fontSize: 14, lineHeight: 20, color: '#70736D' },
  seeAllButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D9D4CB' },
  seeAllText: { fontSize: 14, color: '#174C3D', fontWeight: '800' },
  seeAllArrow: { fontSize: 20, color: '#174C3D' },
});
