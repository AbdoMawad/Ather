import { Platform, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/** ينسخ نصًا إلى الحافظة */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

/** رابط مشاركة السورة (يعمل على الويب) */
export function surahLink(sura: number, ayah?: number): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return ayah ? `أثر أمال — القرآن الكريم، سورة ${sura} الآية ${ayah}` : `أثر أمال — القرآن الكريم، سورة ${sura}`;
  }
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set('surah', String(sura));
  if (ayah) params.set('ayah', String(ayah));
  return `${base}?${params.toString()}`;
}

/** يشارك نصًا عبر واجهة المشاركة الأصلية أو Web Share API */
export async function shareText(message: string, title?: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav && typeof nav.share === 'function') {
        await nav.share({ title, text: message });
        return 'shared';
      }
      const ok = await copyText(message);
      return ok ? 'copied' : 'failed';
    }
    await Share.share({ message, title });
    return 'shared';
  } catch {
    const ok = await copyText(message);
    return ok ? 'copied' : 'failed';
  }
}

export function toastAlert(title: string, message?: string) {
  if (Platform.OS === 'web') return;
  try {
    Alert.alert(title, message);
  } catch {
    /* noop */
  }
}
