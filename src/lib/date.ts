/** أدوات التاريخ (ميلادي + هجري تقريبي عبر Intl) */

/** مفتاح اليوم المحلي — يُستخدم لإعادة ضبط العدّادات يوميًا */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export function gregorianLabel(d: Date = new Date()): string {
  return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** التاريخ الهجري عبر Intl (متوفر في المتصفحات الحديثة وNode) */
export function hijriLabel(d: Date = new Date()): string {
  try {
    const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = fmt.formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const day = get('day');
    const month = get('month').replace(/\u066d/g, '').trim();
    const year = get('year').replace(/[^\d٠-٩]/g, '');
    if (!day || !month) return '';
    return `${day} ${month} ${year} هـ`;
  } catch {
    return '';
  }
}

/** عدد الأيام بين مفتاحين (تقريبي بالأيام التقويمية) */
export function daysBetween(aKey: string, bKey: string): number {
  const a = new Date(aKey + 'T00:00:00');
  const b = new Date(bKey + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** هل اليوم هو الجمعة؟ */
export function isFriday(d: Date = new Date()): boolean {
  return d.getDay() === 5;
}

/** تحية حسب الوقت */
export function timeGreeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'طابت ليلتك بذكر الله';
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'مساء الخير';
  if (h < 20) return 'مساء الخير';
  return 'مساء الخير';
}

/** آخر N مفاتيح أيام (بترتيب تصاعدي) */
export function lastNDays(n: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(addDays(from, -i)));
  return out;
}
