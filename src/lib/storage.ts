import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * طبقة تخزين محلية بسيطة.
 * لا تُجمع أي بيانات شخصية ولا تُرسل إلى أي خادم — كل شيء يبقى على الجهاز.
 */

const PREFIX = '@athar-amal:';

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* تجاهل أخطاء التخزين بهدوء */
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    /* noop */
  }
}

export async function clearAll(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(PREFIX));
    for (const k of mine) await AsyncStorage.removeItem(k);
  } catch {
    /* noop */
  }
}

export const StorageKeys = {
  settings: 'settings',
  lastRead: 'last-read',
  bookmarks: 'bookmarks',
  adhkarDaily: 'adhkar-daily',
  adhkarLifetime: 'adhkar-lifetime',
  wird: 'wird',
  duaCount: 'dua-count',
  readingLog: 'reading-log',
} as const;
