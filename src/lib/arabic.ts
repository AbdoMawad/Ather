/**
 * أدوات معالجة النص العربي.
 *
 * ⚠️ مهم جدًا: التطبيع (normalization) يُستخدم **فقط** لأغراض البحث والمطابقة،
 * ولا يُستخدم أبدًا لعرض النص. النص المعروض للمستخدم هو دائمًا النص الأصلي
 * الوارد من ملف Tanzil دون أي تغيير.
 */

/** الحركات وعلامات الضبط التي تُتجاهل عند البحث فقط */
const DIACRITIC_RANGES: Array<[number, number]> = [
  [0x0610, 0x061a], // علامات القرآن
  [0x064b, 0x065f], // الحركات والتنوين
  [0x0670, 0x0670], // ألف الخنجرية
  [0x06d6, 0x06ed], // علامات الوقف
  [0x0640, 0x0640], // التطويل
  [0x08e3, 0x08ff],
  [0x0d6d, 0x0d7f],
];

const CHAR_MAP: Record<string, string> = {
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ٱ: 'ا',
  ٲ: 'ا',
  ٳ: 'ا',
  ى: 'ي',
  ي: 'ي',
  ئ: 'ي',
  ؤ: 'و',
  ة: 'ه',
  ۀ: 'ه',
  ٮ: 'ب',
  ٯ: 'ق',
  ݣ: 'ك',
  گ: 'ك',
  ڭ: 'ك',
};

function isDiacritic(code: number): boolean {
  for (const [a, b] of DIACRITIC_RANGES) if (code >= a && code <= b) return true;
  return false;
}

export interface NormalizedText {
  /** النص المطبَّع (للبحث فقط) */
  norm: string;
  /** map[i] = فهرس الحرف الأصلي المقابل لـ norm[i] */
  map: number[];
}

/** يطبّع النص للبحث مع الاحتفاظ بخريطة الرجوع إلى النص الأصلي */
export function normalizeArabic(input: string): NormalizedText {
  let norm = '';
  const map: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const code = input.charCodeAt(i);
    if (isDiacritic(code)) continue;
    const rep = CHAR_MAP[ch];
    if (rep === undefined) {
      if (ch === ' ' || ch === '\u00A0') {
        if (norm.length && norm[norm.length - 1] !== ' ') {
          norm += ' ';
          map.push(i);
        }
        continue;
      }
      norm += ch;
      map.push(i);
      continue;
    }
    norm += rep;
    map.push(i);
  }
  return { norm: norm.trim(), map };
}

/** تطبيع سريع للاستعلام (بدون خريطة) */
export function normalizeQuery(input: string): string {
  return normalizeArabic(input).norm.replace(/\s+/g, ' ').trim();
}

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** يحوّل رقمًا إلى أرقام عربية مشرقية (لأرقام الآيات والسور) */
export function toArabicDigits(n: number | string): string {
  return String(n)
    .split('')
    .map((c) => (c >= '0' && c <= '9' ? AR_DIGITS[Number(c)] : c))
    .join('');
}

/**
 * يجد مواضع تطابق الاستعلام داخل النص الأصلي (مع تجاهل التشكيل) ويعيدها
 * كفترات على النص الأصلي — تُستخدم لتظليل نتائج البحث دون تعديل النص.
 */
export function findMatches(original: string, query: string): Array<{ start: number; end: number }> {
  const q = normalizeQuery(query);
  if (!q) return [];
  const { norm, map } = normalizeArabic(original);
  const out: Array<{ start: number; end: number }> = [];
  let from = 0;
  // حماية من الحلقات الطويلة
  let guard = 0;
  while (guard++ < 200) {
    const idx = norm.indexOf(q, from);
    if (idx === -1) break;
    const startOrig = map[idx] ?? 0;
    const endOrig = (map[idx + q.length - 1] ?? startOrig) + 1;
    out.push({ start: startOrig, end: endOrig });
    from = idx + q.length;
  }
  return out;
}

/** يقصّ النص حول أول تطابق لعرضه كملخّص في نتائج البحث */
export function snippetAround(original: string, query: string, radius = 90): string {
  const m = findMatches(original, query);
  if (m.length === 0) return original.length > radius * 2 ? original.slice(0, radius * 2) + '…' : original;
  const center = m[0].start;
  const start = Math.max(0, center - radius);
  const end = Math.min(original.length, center + radius);
  return (start > 0 ? '…' : '') + original.slice(start, end) + (end < original.length ? '…' : '');
}
