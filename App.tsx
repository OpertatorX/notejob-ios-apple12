import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchResultsScreen } from './src/screens/SearchResultsScreen';
import { CompanyScreen } from './src/screens/CompanyScreen';
import { RateScreen } from './src/screens/RateScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { LegalPage, LegalScreen } from './src/screens/LegalScreen';
import { Brand } from './src/components/Brand';
import { Company } from './src/types';
import { Language, strings } from './src/i18n/strings';
import { initializeAds } from './src/lib/ads';

export type Route =
  | { name: 'home' }
  | { name: 'results'; query: string; city: string; results: Company[] }
  | { name: 'company'; company: Company; previous?: { query: string; city: string; results: Company[] } }
  | { name: 'rate'; company: Company; previous?: { query: string; city: string; results: Company[] } }
  | { name: 'favorites' }
  | { name: 'settings' }
  | { name: 'legal'; page: LegalPage };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [language, setLanguage] = useState<Language>('fr');
  const [ready, setReady] = useState(false);
  const t = useMemo(() => strings[language], [language]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('notejob.language');
        if (saved === 'fr' || saved === 'en') setLanguage(saved);
        await initializeAds();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const changeLanguage = async (next: Language) => {
    setLanguage(next);
    await AsyncStorage.setItem('notejob.language', next);
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4EBDD" />
        <Brand size={38} />
        <ActivityIndicator color="#174C3D" style={{ marginTop: 20 }} />
      </View>
    );
  }

  const previous = route.name === 'company' || route.name === 'rate' ? route.previous : undefined;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EC" />
      {route.name === 'home' && (
        <HomeScreen
          t={t}
          language={language}
          onResults={({ query, city, results }) => setRoute({ name: 'results', query, city, results })}
          onCompany={(company) => setRoute({ name: 'company', company })}
          onSettings={() => setRoute({ name: 'settings' })}
        />
      )}
      {route.name === 'results' && (
        <SearchResultsScreen
          query={route.query}
          city={route.city}
          results={route.results}
          t={t}
          onBack={() => setRoute({ name: 'home' })}
          onCompany={(company) => setRoute({ name: 'company', company, previous: { query: route.query, city: route.city, results: route.results } })}
        />
      )}
      {route.name === 'company' && (
        <CompanyScreen
          company={route.company}
          t={t}
          language={language}
          onBack={() => previous ? setRoute({ name: 'results', ...previous }) : setRoute({ name: 'home' })}
          onRate={() => setRoute({ name: 'rate', company: route.company, previous })}
          onSafety={() => setRoute({ name: 'legal', page: 'safety' })}
        />
      )}
      {route.name === 'rate' && (
        <RateScreen
          company={route.company}
          t={t}
          language={language}
          onClose={() => setRoute({ name: 'company', company: route.company, previous })}
          onDone={() => setRoute({ name: 'company', company: route.company, previous })}
        />
      )}
      {route.name === 'favorites' && (
        <FavoritesScreen
          onCompany={(company) => setRoute({ name: 'company', company })}
          onHome={() => setRoute({ name: 'home' })}
          onSearch={() => setRoute({ name: 'home' })}
          onProfile={() => setRoute({ name: 'settings' })}
        />
      )}
      {route.name === 'settings' && (
        <SettingsScreen
          t={t}
          language={language}
          onLanguage={changeLanguage}
          onBack={() => setRoute({ name: 'home' })}
          onFavorites={() => setRoute({ name: 'favorites' })}
          onLegal={(page) => setRoute({ name: 'legal', page })}
        />
      )}
      {route.name === 'legal' && (
        <LegalScreen page={route.page} language={language} t={t} onBack={() => setRoute({ name: 'settings' })} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3EC' },
});
