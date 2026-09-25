/**
 * build-content.mjs
 * ---------------------------------------------------------------------------
 * يبني بيانات الأذكار والأدعية من مصادر مفتوحة موثوقة (لا يتم توليد أي نص ديني):
 *   • حصن المسلم (بنية JSON منظّمة) — assets/adhkar/hisn-almuslim-ar.json
 *     المصدر: https://github.com/YousefAsalya/Islamic-Pro-azkar-API (MIT)
 *   • قاعدة أذكار الصباح والمساء — assets/adhkar/morning-evening-ar.json
 *     المصدر: https://github.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB
 *
 * النصوص تُنسخ حرفيًا دون أي تعديل. كل ما يفعله السكربت هو:
 *   - اختيار التصنيفات وترتيبها
 *   - ربط كل ذكر بمعرّف ثابت وعدد التكرار كما ورد في المصدر
 *   - التحقق من سلامة المراجع القرآنية للأدعية (الموقع فقط، النص يأتي من ملف القرآن)
 *
 * الاستخدام: node scripts/build-content.mjs
 * ---------------------------------------------------------------------------
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'src', 'data');

const fail = (m) => {
  console.error('\n❌ [build-content] ' + m);
  process.exit(1);
};
const load = (p) => {
  const full = join(ROOT, p);
  if (!existsSync(full)) fail('ملف غير موجود: ' + full);
  return JSON.parse(readFileSync(full, 'utf8'));
};

const hisn = load('assets/adhkar/hisn-almuslim-ar.json');
const morningEvening = load('assets/adhkar/morning-evening-ar.json');
const quran = load('src/data/quran-uthmani.json');

// ---------------------------------------------------------------------------
// فهرسة حصن المسلم حسب رقم الباب
// ---------------------------------------------------------------------------
const byId = new Map();
for (const cat of hisn) {
  if (!cat || typeof cat.id !== 'number' || !Array.isArray(cat.array)) {
    fail('بنية غير متوقعة في حصن المسلم');
  }
  byId.set(cat.id, cat);
}

const norm = (s) =>
  s
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u06E5\u06E6]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه');

/** يجلب أذكار باب من حصن المسلم مع معرّفات ثابتة */
function hisnItems(catId, prefix) {
  const cat = byId.get(catId);
  if (!cat) fail(`باب حصن المسلم رقم ${catId} غير موجود`);
  return cat.array.map((it, i) => {
    if (!it || typeof it.text !== 'string' || it.text.trim().length === 0) {
      fail(`ذكر فارغ في الباب ${catId} عند الفهرس ${i}`);
    }
    const count = Number.isFinite(it.count) && it.count > 0 ? it.count : 1;
    return {
      id: `${prefix}-${catId}-${i + 1}`,
      text: it.text,
      count,
      category: cat.category,
    };
  });
}

// ---------------------------------------------------------------------------
// أذكار الصباح والمساء (مصدر منظّم فيه عدد التكرار والفضل والتخريج)
// ---------------------------------------------------------------------------
function countLabel(n) {
  if (n === 1) return 'مرة واحدة';
  if (n <= 10) return `${n} مرات`;
  if (n === 100) return '١٠٠ مرة';
  return `${n} مرة`;
}

function seenItems(type, prefix) {
  return morningEvening
    .filter((x) => x.type === type || x.type === 2)
    .sort((a, b) => a.order - b.order)
    .map((x, i) => {
      if (!x.content || typeof x.content !== 'string') fail('ذكر صباح/مساء غير صالح');
      return {
        id: `${prefix}-${x.order}`,
        text: x.content,
        count: Number.isFinite(x.count) && x.count > 0 ? x.count : 1,
        countLabel: x.count_description || countLabel(x.count || 1),
        virtue: x.fadl || '',
        reference: x.source || '',
        category: 'أذكار الصباح والمساء',
      };
    });
}

// ---------------------------------------------------------------------------
// تعريف مجموعات الأذكار
// ---------------------------------------------------------------------------
const ADHKAR_GROUPS = [
  {
    id: 'morning',
    title: 'أذكار الصباح',
    hint: 'من الفجر إلى الشروق',
    icon: 'sunny-outline',
    accent: 'gold',
    items: seenItems(0, 'm'),
  },
  {
    id: 'evening',
    title: 'أذكار المساء',
    hint: 'من العصر إلى المغرب',
    icon: 'moon-outline',
    accent: 'green',
    items: seenItems(1, 'e'),
  },
  {
    id: 'after-prayer',
    title: 'أذكار بعد الصلاة',
    hint: 'عقب السلام من كل صلاة',
    icon: 'mosque',
    accent: 'green',
    items: hisnItems(25, 'ap'),
  },
  {
    id: 'sleep',
    title: 'أذكار النوم',
    hint: 'ما يُقال عند النوم وأثناء الليل',
    icon: 'bed-outline',
    accent: 'indigo',
    items: [
      ...hisnItems(28, 'sl'),
      ...hisnItems(29, 'sl'),
      ...hisnItems(30, 'sl'),
      ...hisnItems(31, 'sl'),
    ],
  },
  {
    id: 'waking',
    title: 'أذكار الاستيقاظ',
    hint: 'عند الاستيقاظ من النوم',
    icon: 'alarm-outline',
    accent: 'gold',
    items: hisnItems(1, 'wk'),
  },
  {
    id: 'istighfar',
    title: 'الاستغفار والتوبة',
    hint: 'صيغ الاستغفار الثابتة',
    icon: 'sparkles-outline',
    accent: 'green',
    items: hisnItems(129, 'ist'),
  },
  {
    id: 'tasbih',
    title: 'التسبيح والتهليل',
    hint: 'فضل التسبيح والتحميد والتكبير',
    icon: 'infinite-outline',
    accent: 'teal',
    items: [...hisnItems(130, 'tsb'), ...hisnItems(131, 'tsb')],
  },
  {
    id: 'salah-on-prophet',
    title: 'الصلاة على النبي ﷺ',
    hint: 'فضلها وصيغها',
    icon: 'star-outline',
    accent: 'gold',
    items: hisnItems(107, 'sal'),
  },
  {
    id: 'travel',
    title: 'أذكار السفر',
    hint: 'الركوب والسفر والرجوع',
    icon: 'airplane-outline',
    accent: 'teal',
    items: [
      ...hisnItems(95, 'trv'),
      ...hisnItems(96, 'trv'),
      ...hisnItems(97, 'trv'),
      ...hisnItems(98, 'trv'),
      ...hisnItems(100, 'trv'),
      ...hisnItems(101, 'trv'),
      ...hisnItems(102, 'trv'),
      ...hisnItems(103, 'trv'),
      ...hisnItems(104, 'trv'),
      ...hisnItems(105, 'trv'),
    ],
  },
  {
    id: 'daily',
    title: 'أذكار يومية',
    hint: 'الوضوء والمنزل والمسجد والطعام',
    icon: 'leaf-outline',
    accent: 'green',
    items: [
      ...hisnItems(8, 'dly'),
      ...hisnItems(9, 'dly'),
      ...hisnItems(10, 'dly'),
      ...hisnItems(11, 'dly'),
      ...hisnItems(12, 'dly'),
      ...hisnItems(13, 'dly'),
      ...hisnItems(14, 'dly'),
      ...hisnItems(69, 'dly'),
      ...hisnItems(70, 'dly'),
      ...hisnItems(85, 'dly'),
    ],
  },
  {
    id: 'distress',
    title: 'الهمّ والكرب',
    hint: 'أدعية تفريج الهم والكرب',
    icon: 'heart-outline',
    accent: 'indigo',
    items: [...hisnItems(34, 'dis'), ...hisnItems(35, 'dis'), ...hisnItems(43, 'dis')],
  },
  {
    id: 'protection',
    title: 'الحصن والحماية',
    hint: 'الاستعاذة والوقاية',
    icon: 'shield-checkmark-outline',
    accent: 'green',
    items: [
      ...hisnItems(48, 'prt'),
      ...hisnItems(88, 'prt'),
      ...hisnItems(45, 'prt'),
      ...hisnItems(128, 'prt'),
      ...hisnItems(126, 'prt'),
    ],
  },
];

// ---------------------------------------------------------------------------
// أدعية للميت — نصوص السنة كما وردت في حصن المسلم (بدون أي تعديل)
// ---------------------------------------------------------------------------
const DECEASED_SUNNAH = [
  { cat: 53, label: 'دعاء من أُصيب بمصيبة' },
  { cat: 54, label: 'الدعاء عند إغماض الميت' },
  { cat: 55, label: 'الدعاء للميت في الصلاة عليه' },
  { cat: 57, label: 'دعاء التعزية' },
  { cat: 58, label: 'الدعاء عند إدخال الميت القبر' },
  { cat: 59, label: 'الدعاء بعد دفن الميت' },
  { cat: 60, label: 'دعاء زيارة القبور' },
];

// ---------------------------------------------------------------------------
// صيغة المؤنث — تحويل ميكانيكي محدود وموثّق لضمائر المذكر الغائب العائدة على
// الميت فقط. النص الأصلي يُحفظ كما هو في `text`، والصيغة المؤنثة في `textFeminine`.
// كل قاعدة تُتحقّق عند البناء: إن لم تُطابق أي نص فإن البناء يتوقف (حماية من الأخطاء).
// ---------------------------------------------------------------------------
const FEMININE_RULES = [
  ['لِفُلاَنٍ (بِاسْمِهِ)', 'لِفُلاَنَةٍ (بِاسْمِهَا)'],
  ['وَارْفَعْ دَرَجَتَهُ', 'وَارْفَعْ دَرَجَتَهَا'],
  ['وَاخْلُفْهُ فِي عَقِبِهِ', 'وَاخْلُفْهَا فِي عَقِبِهَا'],
  ['وَاغْفِرْ لَنَا وَلَهُ', 'وَاغْفِرْ لَنَا وَلَهَا'],
  ['وَافْسَحْ لَهُ فِي قَبْرِهِ', 'وَافْسَحْ لَهَا فِي قَبْرِهَا'],
  ['وَنَوِّرْ لَهُ فِيهِ', 'وَنَوِّرْ لَهَا فِيهَا'],
  [
    'اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ، وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ',
    'اغْفِرْ لَهَا وَارْحَمْهَا، وَعَافِهَا، وَاعْفُ عَنْهَا، وَأَكْرِمْ نُزُلَهَا، وَوَسِّعْ مُدْخَلَهَا، وَاغْسِلْهَا',
  ],
  ['وَنَقِّهِ مِنَ الْخَطَايَا', 'وَنَقِّهَا مِنَ الْخَطَايَا'],
  [
    'وَأَبْدِلْهُ دَاراً خَيْراً مِنْ دَارِهِ، وَأَهْلاً خَيْراً مِنْ أَهْلِهِ، وَزَوْجَاً خَيْراً مِنْ زَوْجِهِ، وَأَدْخِلْهُ الْجَنَّةَ، وَأَعِذْهُ',
    'وَأَبْدِلْهَا دَاراً خَيْراً مِنْ دَارِهَا، وَأَهْلاً خَيْراً مِنْ أَهْلِهَا، وَزَوْجَاً خَيْراً مِنْ زَوْجِهَا، وَأَدْخِلْهَا الْجَنَّةَ، وَأَعِذْهَا',
  ],
  ['فُلاَنَ بْنَ فُلاَنٍ', 'فُلاَنَةَ بِنْتَ فُلاَنَةٍ'],
  ['فَقِهِ مِنْ فِتْنَةِ الْقَبْرِ', 'فَقِهَا مِنْ فِتْنَةِ الْقَبْرِ'],
  ['فَاغْفِرْ لَهُ وَارْحَمْهُ إِنَّكَ', 'فَاغْفِرْ لَهَا وَارْحَمْهَا إِنَّكَ'],
  ['عَبْدُكَ وَابْنُ أَمَتِكَ احْتَاجَ', 'أَمَتُكَ وَبِنْتُ أَمَتِكَ احْتَاجَتْ'],
  ['عَنْ عَذَابِهِ', 'عَنْ عَذَابِهَا'],
  ['إِنْ كَانَ مُحْسِناً فَزِدْ فِي حَسَنَاتِهِ', 'إِنْ كَانَتْ مُحْسِنَةً فَزِدْ فِي حَسَنَاتِهَا'],
  ['وَإِنْ كَانَ مُسِيئاً فَتَجَاوَزْ عَنْهُ', 'وَإِنْ كَانَتْ مُسِيئَةً فَتَجَاوَزْ عَنْهَا'],
  ['لاَ تَحْرِمْنَا أَجْرَهُ، وَلاَ تُضِلَّنَا بَعْدَهُ', 'لاَ تَحْرِمْنَا أَجْرَهَا، وَلاَ تُضِلَّنَا بَعْدَهَا'],
  ['اللَّهُمَّ اغْفِرْ لَهُ، اللَّهُمَّ ثَبِّتْهُ', 'اللَّهُمَّ اغْفِرْ لَهَا، اللَّهُمَّ ثَبِّتْهَا'],
  ['وَغَفَرَ لِمَيِّتِكَ', 'وَغَفَرَ لِمَيِّتَتِكَ'],
];

const ruleHits = new Array(FEMININE_RULES.length).fill(0);

/**
 * ترتيب علامات التشكيل ترتيبًا قانونيًا للمطابقة فقط.
 * الدالة تحافظ على الطول والفهارس (إعادة ترتيب فقط، بلا إضافة أو حذف)،
 * لذلك يمكن استخدام مواضع التطابق على النص الأصلي مباشرة.
 */
const COMBINING_RE = /[\u0300-\u036F\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08E3-\u08FF]/;
function canon(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const base = String.fromCodePoint(s.codePointAt(i));
    let j = i + base.length;
    const marks = [];
    while (j < s.length) {
      const c = String.fromCodePoint(s.codePointAt(j));
      if (!COMBINING_RE.test(c)) break;
      marks.push(c);
      j += c.length;
    }
    marks.sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
    out += base + marks.join('');
    i = j;
  }
  return out;
}

function toFeminine(text) {
  let out = text;
  FEMININE_RULES.forEach(([from, to], idx) => {
    const cf = canon(from);
    let pos = 0;
    for (let guard = 0; guard < 50; guard++) {
      const co = canon(out);
      const at = co.indexOf(cf, pos);
      if (at === -1) break;
      out = out.slice(0, at) + to + out.slice(at + cf.length);
      ruleHits[idx] += 1;
      pos = at + to.length;
    }
  });
  return out;
}

const deceasedSections = DECEASED_SUNNAH.map((s) => ({
  id: `sunna-${s.cat}`,
  title: s.label,
  items: hisnItems(s.cat, 'du').map((it) => ({ ...it, textFeminine: toFeminine(it.text) })),
}));

// تحقق: كل قاعدة يجب أن تُطابق نصًا واحدًا على الأقل
FEMININE_RULES.forEach(([from], i) => {
  if (ruleHits[i] === 0) fail(`قاعدة صيغة المؤنث لم تُطابق أي نص: «${from}»`);
});

// ---------------------------------------------------------------------------
// أدعية من القرآن الكريم — نُسجّل (الموقع) فقط، والنص يُجلب من ملف القرآن
// ---------------------------------------------------------------------------
const QURAN_DUA_REFS = [
  { sura: 2, ayah: 201, note: 'دعاء جامع بخيري الدنيا والآخرة' },
  { sura: 2, ayah: 286, note: 'العفو والمغفرة والرحمة' },
  { sura: 3, ayah: 16, note: 'المغفرة والوقاية من النار' },
  { sura: 3, ayah: 147, note: 'المغفرة والثبات والتوفّي مسلمين' },
  { sura: 3, ayah: 193, note: 'المغفرة والتوفّي مع الأبرار' },
  { sura: 3, ayah: 194, note: 'الوفاء بالوعد ودخول الجنة' },
  { sura: 7, ayah: 151, note: 'المغفرة ودخول الرحمة' },
  { sura: 14, ayah: 41, note: 'الدعاء للوالدين والمؤمنين' },
  { sura: 17, ayah: 24, note: 'الدعاء بالرحمة للوالدين' },
  { sura: 23, ayah: 109, note: 'المغفرة والرحمة' },
  { sura: 23, ayah: 118, note: 'طلب المغفرة والرحمة' },
  { sura: 40, ayah: 7, note: 'دعاء الملائكة للمؤمنين بالمغفرة' },
  { sura: 40, ayah: 8, note: 'دعاء الملائكة بدخول جنات عدن' },
  { sura: 40, ayah: 9, note: 'الوقاية من السيئات ودخول الجنة' },
  { sura: 47, ayah: 19, note: 'الاستغفار للمؤمنين والمؤمنات' },
  { sura: 59, ayah: 10, note: 'الدعاء لمن سبقونا بالإيمان' },
  { sura: 66, ayah: 8, note: 'إتمام النور والمغفرة' },
  { sura: 21, ayah: 87, note: 'دعاء ذي النون' },
  { sura: 2, ayah: 156, note: 'الاسترجاع عند المصيبة' },
];

// تحقق صارم: كل مرجع يجب أن يكون موجودًا وأن يحتوي صيغة دعاء
const DUA_KEYWORDS = [
  'ربنا',
  'ربي',
  'رب ',
  'ربِّ',
  'ربَّ',
  'استغفر',
  'إنا لله',
  'لا إله إلا أنت',
  'وقهم',
];
const quranDuas = QURAN_DUA_REFS.map((r) => {
  const sura = quran.surahs[r.sura - 1];
  if (!sura || sura.n !== r.sura) fail(`سورة غير موجودة: ${r.sura}`);
  const text = sura.a[r.ayah - 1];
  if (!text) fail(`آية غير موجودة: ${r.sura}:${r.ayah}`);
  const n = norm(text);
  const ok = DUA_KEYWORDS.some((k) => n.includes(norm(k)));
  if (!ok) {
    fail(`المرجع ${r.sura}:${r.ayah} لا يبدو دعاءً — راجع القائمة`);
  }
  return { id: `q-${r.sura}-${r.ayah}`, sura: r.sura, ayah: r.ayah, note: r.note };
});

// ---------------------------------------------------------------------------
// الكتابة
// ---------------------------------------------------------------------------
const totalAdhkar = ADHKAR_GROUPS.reduce((s, g) => s + g.items.length, 0);
ADHKAR_GROUPS.forEach((g) => {
  if (g.items.length === 0) fail(`مجموعة فارغة: ${g.id}`);
  const ids = new Set(g.items.map((i) => i.id));
  if (ids.size !== g.items.length) fail(`معرّفات مكرّرة في ${g.id}`);
});

const adhkarPayload = {
  v: 1,
  sources: [
    {
      name: 'حصن المسلم — سعيد بن علي بن وهف القحطاني',
      data: 'https://github.com/YousefAsalya/Islamic-Pro-azkar-API',
      license: 'MIT',
    },
    {
      name: 'قاعدة أذكار الصباح والمساء',
      data: 'https://github.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB',
      license: 'MIT',
    },
  ],
  groups: ADHKAR_GROUPS,
};

const duasPayload = {
  v: 1,
  forName: 'أمال محمود النهر',
  note:
    'الأدعية التالية من السنة النبوية ومن القرآن الكريم، وهي معروضة بصيغة المؤنث للدعاء لها — ' +
    'بإمكانك الاطلاع على النص الأصلي كما ورد في المصدر في أي وقت.',
  sunnah: deceasedSections,
  quran: quranDuas,
  sources: adhkarPayload.sources,
};

writeFileSync(join(OUT, 'adhkar.json'), JSON.stringify(adhkarPayload), 'utf8');
writeFileSync(join(OUT, 'duas.json'), JSON.stringify(duasPayload), 'utf8');

console.log(
  `✅ الأذكار: ${ADHKAR_GROUPS.length} مجموعة / ${totalAdhkar} ذكرًا\n` +
    `✅ الدعاء لها: ${deceasedSections.length} أقسام من السنة (${deceasedSections.reduce(
      (s, x) => s + x.items.length,
      0
    )} دعاء) + ${quranDuas.length} دعاءً قرآنيًا (تم التحقق من مراجعها)\n` +
    `🎉 تم بناء بيانات الأذكار والأدعية دون توليد أي نص.`
);
