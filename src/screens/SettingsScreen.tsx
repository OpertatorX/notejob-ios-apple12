import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Brand } from '../components/Brand';
import { Language, Translations } from '../i18n/strings';
import { supabaseConfigured } from '../lib/supabase';
import { LegalPage } from './LegalScreen';

export function SettingsScreen({ t, language, onLanguage, onBack, onLegal, onFavorites }: {
  t: Translations;
  language: Language;
  onLanguage: (l: Language) => void;
  onBack: () => void;
  onLegal: (page: LegalPage) => void;
  onFavorites: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <Brand size={30} />
        <TouchableOpacity onPress={onBack} style={styles.close}><Text style={styles.closeText}>×</Text></TouchableOpacity>
      </View>
      <Text style={styles.eyebrow}>NOTEJOB / PROFIL</Text>
      <Text style={styles.title}>{t.settings}</Text>
      <Text style={styles.subtitle}>{t.anonymous}</Text>

      <Text style={styles.label}>{language === 'fr' ? 'VOTRE NOTEJOB' : 'YOUR NOTEJOB'}</Text>
      <TouchableOpacity onPress={onFavorites} style={styles.row}><Text style={styles.rowText}>{language === 'fr' ? 'Favoris' : 'Favorites'}</Text><Text style={styles.arrow}>›</Text></TouchableOpacity>

      <Text style={styles.label}>{t.language.toUpperCase()}</Text>
      <TouchableOpacity onPress={() => onLanguage('fr')} style={styles.row}><Text style={styles.rowText}>{t.french}</Text><Text style={styles.check}>{language === 'fr' ? '●' : '○'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => onLanguage('en')} style={styles.row}><Text style={styles.rowText}>{t.english}</Text><Text style={styles.check}>{language === 'en' ? '●' : '○'}</Text></TouchableOpacity>

      <Text style={styles.label}>{t.information.toUpperCase()}</Text>
      <TouchableOpacity onPress={() => onLegal('privacy')} style={styles.row}><Text style={styles.rowText}>{t.privacy}</Text><Text style={styles.arrow}>›</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => onLegal('terms')} style={styles.row}><Text style={styles.rowText}>{t.terms}</Text><Text style={styles.arrow}>›</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => onLegal('support')} style={styles.row}><Text style={styles.rowText}>{t.support}</Text><Text style={styles.arrow}>›</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => onLegal('safety')} style={styles.row}><Text style={styles.rowText}>{language === 'fr' ? 'Sécurité & contact' : 'Safety & contact'}</Text><Text style={styles.arrow}>›</Text></TouchableOpacity>

      <Text style={styles.label}>{t.backend.toUpperCase()}</Text>
      <View style={styles.statusCard}>
        <View style={[styles.dot, supabaseConfigured ? styles.dotOk : styles.dotWarn]} />
        <Text style={styles.body}>{supabaseConfigured ? t.cloudMode : t.localMode}</Text>
      </View>
      <Text style={styles.source}>{t.source}</Text>
      <Text style={styles.version}>NoteJob · 1.0.0</Text>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7EFE4' },
  screen: { flex: 1, backgroundColor: '#F7EFE4' },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 50 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { marginTop: -2, fontSize: 27, fontWeight: '300', color: '#111510' },
  eyebrow: { marginTop: 36, fontSize: 10.5, letterSpacing: 2, fontWeight: '800', color: '#5F635C' },
  title: { marginTop: 8, fontSize: 39, lineHeight: 43, letterSpacing: -1.2, fontWeight: '800', color: '#111510' },
  subtitle: { marginTop: 12, fontSize: 14.5, lineHeight: 21, color: '#71746D' },
  label: { marginTop: 37, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D2CFC7', fontSize: 10.5, fontWeight: '900', letterSpacing: 1.5, color: '#686C64' },
  row: { height: 61, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D8D5CD' },
  rowText: { fontSize: 16.5, fontWeight: '600', color: '#111510' },
  check: { fontSize: 18, color: '#174C3D' },
  arrow: { fontSize: 28, color: '#174C3D', fontWeight: '300' },
  statusCard: { marginTop: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 6, marginRight: 10 },
  dotOk: { backgroundColor: '#174C3D' },
  dotWarn: { backgroundColor: '#B86A42' },
  body: { flex: 1, fontSize: 13.5, lineHeight: 20, color: '#565B54' },
  source: { marginTop: 13, fontSize: 12.5, lineHeight: 18, color: '#82857E' },
  version: { marginTop: 40, fontSize: 12, color: '#92948E' },
});
