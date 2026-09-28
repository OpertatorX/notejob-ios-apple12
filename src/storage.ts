import Storage from 'expo-sqlite/kv-store';
import type { AppData } from './types';
import { initialData, sanitizeLoadedData } from './domain';

const KEY = 'oxinvoice.appdata.v1';
let writeQueue: Promise<void> = Promise.resolve();

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await Storage.getItem(KEY);
    if (!raw) return initialData();
    return sanitizeLoadedData(JSON.parse(raw));
  } catch {
    return initialData();
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  const payload = JSON.stringify(data);
  writeQueue = writeQueue.catch(() => undefined).then(() => Storage.setItem(KEY, payload));
  await writeQueue;
}

export async function clearAppData(): Promise<void> {
  writeQueue = writeQueue.catch(() => undefined).then(() => Storage.removeItem(KEY));
  await writeQueue;
}
