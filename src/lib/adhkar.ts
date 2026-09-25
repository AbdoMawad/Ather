import adhkarData from '../data/adhkar.json';
import duasData from '../data/duas.json';

export interface AdhkarItem {
  id: string;
  text: string;
  /** صيغة المؤنث (لأدعية الميت فقط) — النص الأصلي يبقى في `text` */
  textFeminine?: string;
  count: number;
  countLabel?: string;
  virtue?: string;
  reference?: string;
  category: string;
}

export interface AdhkarGroup {
  id: string;
  title: string;
  hint: string;
  icon: string;
  accent: string;
  items: AdhkarItem[];
}

export interface DuaSection {
  id: string;
  title: string;
  items: AdhkarItem[];
}

export interface QuranDuaRef {
  id: string;
  sura: number;
  ayah: number;
  note: string;
}

export const ADHKAR_GROUPS = (adhkarData as unknown as { groups: AdhkarGroup[] }).groups;
export const ADHKAR_SOURCES = (adhkarData as unknown as { sources: Array<{ name: string; data: string; license: string }> }).sources;

export const DUA_FOR_NAME = (duasData as unknown as { forName: string }).forName;
export const DUA_NOTE = (duasData as unknown as { note: string }).note;
export const DUA_SUNNAH = (duasData as unknown as { sunnah: DuaSection[] }).sunnah;
export const DUA_QURAN = (duasData as unknown as { quran: QuranDuaRef[] }).quran;

export function getGroup(id: string): AdhkarGroup | undefined {
  return ADHKAR_GROUPS.find((g) => g.id === id);
}

export const AR_COUNT_LABEL: Record<number, string> = {
  1: 'مرة واحدة',
  3: '٣ مرات',
  4: '٤ مرات',
  7: '٧ مرات',
  10: '١٠ مرات',
  33: '٣٣ مرة',
  100: '١٠٠ مرة',
};

export function countLabel(n: number): string {
  return AR_COUNT_LABEL[n] ?? `${n} مرة`;
}

export function totalAdhkarItems(): number {
  return ADHKAR_GROUPS.reduce((s, g) => s + g.items.length, 0);
}
