import AsyncStorage from '@react-native-async-storage/async-storage';
import { Company } from '../types';

const KEY = 'notejob.favorites.v1';

export async function getFavorites(): Promise<Company[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function isFavorite(siret: string) {
  const items = await getFavorites();
  return items.some((item) => item.siret === siret);
}

export async function toggleFavorite(company: Company) {
  const items = await getFavorites();
  const exists = items.some((item) => item.siret === company.siret);
  const next = exists ? items.filter((item) => item.siret !== company.siret) : [company, ...items];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return !exists;
}
