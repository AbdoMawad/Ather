/**
 * build-quran.mjs
 * ---------------------------------------------------------------------------
 * يحوّل ملفات نصّ القرآن الخام (المستوردة حرفيًا من مشروع Tanzil — https://tanzil.net)
 * إلى ملفات JSON تُستخدم داخل التطبيق.
 *
 * قواعد صارمة يلتزم بها هذا السكربت:
 *  1) المصدر الوحيد للنص هو الملف الخام `assets/quran/quran-*.txt`.
 *  2) لا يتم تعديل أي حرف أو حركة أو علامة وقف — النص يُنسخ كما هو تمامًا.
 *  3) بعد التحويل يتم "إعادة بناء" الملف الخام من الـJSON ومقارنته بايت-ببايت
 *     مع الأصل. أي اختلاف يُوقف العملية بخطأ.
 *  4) يتم التحقق من عدد الآيات لكل سورة مقابل البيانات الوصفية (114 سورة / 6236 آية).
 *
 * الاستخدام:  node scripts/build-quran.mjs
 * ---------------------------------------------------------------------------
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const QURAN_DIR = join(ROOT, 'assets', 'quran');
const OUT_DIR = join(ROOT, 'src', 'data');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function fail(msg) {
  console.error('\n❌ [build-quran] ' + msg);
  process.exit(1);
}

/** يقرأ ملف Tanzil الخام ويفصل الترويسة (التعليقات) عن أسطر الآيات */
function readRawTanzil(file) {
  const path = join(QURAN_DIR, file);
  if (!existsSync(path)) {
    fail(
      `الملف القرآني غير موجود: ${path}\n` +
        `   يجب توفير ملف Tanzil الخام (sura|aya|text) قبل البناء.\n` +
        `   لا يتم توليد أي نص قرآني برمجيًا.`
    );
  }
  const buffer = readFileSync(path);
  const raw = buffer.toString('utf8');
  const lines = raw.split('\n');
  const header = [];
  const body = [];
  for (const line of lines) {
    if (line.startsWith('#')) header.push(line);
    else if (line.trim() !== '') body.push(line);
  }
  return { buffer, raw, header, body };
}

/** يفصل الأسطر إلى (سورة، آية، نص) دون أي معالجة للنص */
function parseBody(body, label) {
  const verses = [];
  body.forEach((line, i) => {
    const first = line.indexOf('|');
    const second = line.indexOf('|', first + 1);
    if (first === -1 || second === -1) {
      fail(`[${label}] سطر غير صالح عند الفهرس ${i}: ${JSON.stringify(line.slice(0, 60))}`);
    }
    const sura = Number(line.slice(0, first));
    const ayah = Number(line.slice(first + 1, second));
    const text = line.slice(second + 1);
    if (!Number.isInteger(sura) || !Number.isInteger(ayah)) {
      fail(`[${label}] أرقام غير صالحة عند الفهرس ${i}`);
    }
    if (text.length === 0) fail(`[${label}] نص فارغ عند ${sura}:${ayah}`);
    verses.push({ sura, ayah, text });
  });
  return verses;
}

/** يتحقق من الترتيب والتسلسل الكامل مقابل عدد آيات كل سورة */
function validateSequence(verses, label, counts) {
  let expectedSura = 1;
  let expectedAyah = 1;
  for (const v of verses) {
    if (v.sura !== expectedSura || v.ayah !== expectedAyah) {
      fail(
        `[${label}] تسلسل غير متوقع: حصلنا على ${v.sura}:${v.ayah} ` +
          `بينما المتوقع ${expectedSura}:${expectedAyah}`
      );
    }
    expectedAyah += 1;
    if (expectedAyah > counts[expectedSura - 1]) {
      expectedSura += 1;
      expectedAyah = 1;
    }
  }
  if (expectedSura !== 115 || expectedAyah !== 1) {
    fail(`[${label}] التسلسل لم ينتهِ عند آخر آية من سورة الناس`);
  }
}

/** يعيد بناء أسطر الملف الخام من البيانات المحلّلة (للتحقق من عدم التعديل) */
function roundTripCheck(verses, body, label) {
  const rebuilt = verses.map((v) => `${v.sura}|${v.ayah}|${v.text}`);
  if (rebuilt.length !== body.length) {
    fail(`[${label}] عدد الأسطر بعد إعادة البناء (${rebuilt.length}) ≠ الأصل (${body.length})`);
  }
  for (let i = 0; i < body.length; i++) {
    if (rebuilt[i] !== body[i]) {
      fail(`[${label}] اختلاف في السطر ${i} — تم رفض البناء حفاظًا على سلامة النص`);
    }
  }
}

/** يبني بنية JSON مضغوطة: كل سورة + مصفوفة نصوص آياتها بالترتيب */
function toSurahStructure(verses) {
  const surahs = [];
  let current = null;
  for (const v of verses) {
    if (!current || current.n !== v.sura) {
      current = { n: v.sura, a: [] };
      surahs.push(current);
    }
    current.a.push(v.text);
  }
  return surahs;
}

// ---------------------------------------------------------------------------
// البيانات الوصفية للسور (أسماء/عدد آيات/نوع النزول) — ليست نصًا قرآنيًا
// ---------------------------------------------------------------------------
const metaPath = join(QURAN_DIR, 'surah-meta.json');
if (!existsSync(metaPath)) fail('ملف البيانات الوصفية للسور غير موجود: ' + metaPath);
const metaRaw = JSON.parse(readFileSync(metaPath, 'utf8'));
if (metaRaw.code !== 200 || !Array.isArray(metaRaw.data) || metaRaw.data.length !== 114) {
  fail('البيانات الوصفية للسور غير صالحة (يجب أن تحتوي 114 سورة)');
}

const cleanName = (n) => n.replace(/^سُورَةُ\s+/, '').replace(/^سُورَة\s+/, '').trim();

const surahsMeta = metaRaw.data.map((s) => ({
  number: s.number,
  name: cleanName(s.name),
  fullName: s.name,
  englishName: s.englishName,
  englishTranslation: s.englishNameTranslation,
  ayahs: s.numberOfAyahs,
  revelation: s.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
}));

// ---------------------------------------------------------------------------
// المعالجة
// ---------------------------------------------------------------------------
const SOURCES = [
  { key: 'uthmani', file: 'quran-uthmani.txt', label: 'الرسم العثماني (مصحف المدينة)' },
  { key: 'simple', file: 'quran-simple.txt', label: 'الرسم الإملائي المبسّط' },
];

const manifest = {
  generatedAt: new Date().toISOString(),
  generator: 'scripts/build-quran.mjs',
  source: {
    project: 'Tanzil Project',
    url: 'https://tanzil.net/',
    downloadUrl: 'https://tanzil.net/download',
    licenseSummary:
      'نص القرآن الكريم من مشروع Tanzil، ويُسمح بنسخه وتوزيعه دون تعديل في النص نفسه، ' +
      'مع نسبة المصدر إلى Tanzil وعدم استخدام النسخة في أعمال مشتقة تحمل اسم Tanzil. ' +
      'راجع الشروط الكاملة على https://tanzil.net/',
  },
  totalSurahs: 114,
  totalVerses: 6236,
  integrity: {},
  texts: {},
};

for (const src of SOURCES) {
  const { buffer, header, body } = readRawTanzil(src.file);
  const verses = parseBody(body, src.key);

  if (verses.length !== 6236) {
    fail(`[${src.key}] عدد الآيات ${verses.length} ≠ 6236`);
  }
  validateSequence(verses, src.key, surahsMeta.map((m) => m.ayahs));
  roundTripCheck(verses, body, src.key);

  const structure = toSurahStructure(verses);
  if (structure.length !== 114) fail(`[${src.key}] عدد السور ${structure.length} ≠ 114`);

  // مطابقة عدد آيات كل سورة مع البيانات الوصفية
  structure.forEach((s, idx) => {
    const meta = surahsMeta[idx];
    if (meta.number !== s.n) fail(`[${src.key}] ترتيب السور لا يطابق البيانات الوصفية عند ${s.n}`);
    if (meta.ayahs !== s.a.length) {
      fail(`[${src.key}] عدد آيات سورة ${s.n} = ${s.a.length} بينما الوصف ${meta.ayahs}`);
    }
  });

  const payload = {
    v: 1,
    text: src.key,
    label: src.label,
    source: 'Tanzil Project — https://tanzil.net/',
    surahs: structure,
  };

  const outPath = join(OUT_DIR, `quran-${src.key}.json`);
  const out = JSON.stringify(payload);
  writeFileSync(outPath, out, 'utf8');

  manifest.texts[src.key] = {
    label: src.label,
    rawFile: `assets/quran/${src.file}`,
    rawSha256: sha256(buffer),
    rawBytes: buffer.length,
    jsonFile: `src/data/quran-${src.key}.json`,
    jsonSha256: sha256(Buffer.from(out, 'utf8')),
    verses: verses.length,
    surahs: structure.length,
    roundTripVerified: true,
    headerLines: header.length,
  };

  console.log(
    `✅ ${src.label}: ${structure.length} سورة / ${verses.length} آية — ` +
      `تحقق إعادة البناء بايت-ببايت ناجح (sha256 ${sha256(buffer).slice(0, 16)}…)`
  );
}

// ترويسة الترخيص الأصلية من ملف Tanzil (تُعرض داخل التطبيق)
const { header } = readRawTanzil(SOURCES[0].file);
manifest.licenseHeader = header.map((l) => l.replace(/^#\s?/, '').replace(/^={3,}$/, '').trimEnd());

writeFileSync(join(OUT_DIR, 'surahs.json'), JSON.stringify(surahsMeta, null, 0), 'utf8');
writeFileSync(join(OUT_DIR, 'quran-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log('✅ src/data/surahs.json + src/data/quran-manifest.json');
console.log('🎉 تم بناء بيانات القرآن بنجاح دون أي تعديل على النص.');
