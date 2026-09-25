/**
 * طبقة الوصول إلى نص القرآن الكريم.
 *
 * ⚠️ المصدر الوحيد للنص هو الملفات المبنية من ملف Tanzil الخام
 * (scripts/build-quran.mjs). لا يتم توليد أو تعديل أي حرف هنا —
 * الوظائف أدناه تقرأ وتُفهرس فقط.
 */

import surahsMeta from '../data/surahs.json';
import uthmaniData from '../data/quran-uthmani.json';
import manifest from '../data/quran-manifest.json';
import { normalizeArabic, normalizeQuery } from './arabic';

export type QuranScript = 'uthmani' | 'simple';

export interface SurahMeta {
  number: number;
  name: string;
  fullName: string;
  englishName: string;
  englishTranslation: string;
  ayahs: number;
  revelation: 'مكية' | 'مدنية' | string;
}

export interface Ayah {
  sura: number;
  ayah: number;
  text: string;
}

interface QuranFile {
  v: number;
  text: string;
  label: string;
  source: string;
  surahs: Array<{ n: number; a: string[] }>;
}

export const SURAH_LIST = surahsMeta as SurahMeta[];
export const QURAN_MANIFEST = manifest as unknown as {
  generatedAt: string;
  source: { project: string; url: string; downloadUrl: string; licenseSummary: string };
  totalSurahs: number;
  totalVerses: number;
  licenseHeader: string[];
  texts: Record<
    string,
    {
      label: string;
      rawFile: string;
      rawSha256: string;
      rawBytes: number;
      jsonFile: string;
      jsonSha256: string;
      verses: number;
      surahs: number;
      roundTripVerified: boolean;
    }
  >;
};

const UTHMANI = uthmaniData as QuranFile;
let SIMPLE: QuranFile | null = null;

/** يُحمّل الرسم الإملائي عند الحاجة فقط */
export function getSimpleData(): QuranFile {
  if (!SIMPLE) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SIMPLE = require('../data/quran-simple.json') as QuranFile;
  }
  return SIMPLE;
}

function fileFor(script: QuranScript): QuranFile {
  return script === 'simple' ? getSimpleData() : UTHMANI;
}

export function getSurahMeta(n: number): SurahMeta | undefined {
  return SURAH_LIST[n - 1];
}

/** نصوص آيات سورة كاملة بالترتيب (بدون أي تعديل) */
export function getSurahAyahs(n: number, script: QuranScript = 'uthmani'): Ayah[] {
  const f = fileFor(script);
  const s = f.surahs[n - 1];
  if (!s || s.n !== n) return [];
  return s.a.map((text, i) => ({ sura: n, ayah: i + 1, text }));
}

export function getAyah(sura: number, ayah: number, script: QuranScript = 'uthmani'): Ayah | null {
  const f = fileFor(script);
  const s = f.surahs[sura - 1];
  if (!s || s.n !== sura) return null;
  const t = s.a[ayah - 1];
  if (typeof t !== 'string') return null;
  return { sura, ayah, text: t };
}

export function totalAyahs(): number {
  return QURAN_MANIFEST.totalVerses;
}

// ---------------------------------------------------------------------------
// البحث
// ---------------------------------------------------------------------------

export interface SearchHit {
  sura: number;
  ayah: number;
  text: string;
}

interface IndexEntry {
  sura: number;
  ayah: number;
  norm: string;
  text: string;
}

const indexCache: Partial<Record<QuranScript, IndexEntry[]>> = {};

/**
 * يبني فهرس البحث (نص مطبَّع للبحث فقط). النص الأصلي يُحفظ كما هو للعرض.
 * البناء كسول: يحدث عند أول عملية بحث.
 */
export function buildSearchIndex(script: QuranScript = 'uthmani'): IndexEntry[] {
  const cached = indexCache[script];
  if (cached) return cached;
  const f = fileFor(script);
  const entries: IndexEntry[] = [];
  for (const s of f.surahs) {
    for (let i = 0; i < s.a.length; i++) {
      const text = s.a[i];
      entries.push({ sura: s.n, ayah: i + 1, norm: normalizeArabic(text).norm, text });
    }
  }
  indexCache[script] = entries;
  return entries;
}

export function searchQuran(query: string, script: QuranScript = 'uthmani', limit = 200): SearchHit[] {
  const q = normalizeQuery(query);
  if (q.length < 2) return [];
  const idx = buildSearchIndex(script);
  const out: SearchHit[] = [];
  const words = q.split(' ').filter(Boolean);
  for (const e of idx) {
    let ok = true;
    for (const w of words) {
      if (!e.norm.includes(w)) {
        ok = false;
        break;
      }
    }
    if (ok) {
      out.push({ sura: e.sura, ayah: e.ayah, text: e.text });
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function searchSurahs(query: string): SurahMeta[] {
  const q = normalizeQuery(query);
  if (!q) return SURAH_LIST;
  return SURAH_LIST.filter(
    (s) =>
      normalizeQuery(s.name).includes(q) ||
      normalizeQuery(s.fullName).includes(q) ||
      s.englishName.toLowerCase().includes(query.toLowerCase()) ||
      String(s.number) === q.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  );
}

/** فهرس السور مع فهرس الآية الأولى لكل سورة (للتمرير السريع) */
export function surahJuzInfo(n: number): { ayahs: number } {
  return { ayahs: SURAH_LIST[n - 1]?.ayahs ?? 0 };
}
