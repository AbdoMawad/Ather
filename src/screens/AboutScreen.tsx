import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { fonts, radius, spacing } from '../theme';
import { Card, IconButton, ScalePressable } from '../components/ui';
import { Icon } from '../components/Icon';
import { OrnamentDivider, RubElHizb } from '../components/Ornaments';
import { AppFooter } from '../components/AppFooter';
import { ADHKAR_SOURCES } from '../lib/adhkar';
import { QURAN_MANIFEST } from '../lib/quran';
import { openExternal } from '../lib/web';
import { toArabicDigits } from '../lib/arabic';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AboutScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { theme } = useStore();

  const uthmani = QURAN_MANIFEST.texts?.uthmani;
  const simple = QURAN_MANIFEST.texts?.simple;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <IconButton name="chevron-forward" onPress={() => navigation.goBack()} accessibilityLabel="رجوع" />
          <Text style={[styles.title, { color: theme.text }]}>المصادر والأمانة</Text>
          <View style={{ width: 42 }} />
        </View>
        <OrnamentDivider width={170} color={theme.ornament} style={{ marginBottom: spacing.lg }} />

        {/* ------------------------------------------------------ عن الموقع */}
        <Card variant="alt">
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <RubElHizb size={24} color={theme.gold} />
            <Text style={[styles.h1, { color: theme.text }]}>أثر أمال</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              صدقة جارية عن روح أمال محمود النهر — رحمها الله وغفر لها. موقع لقراءة القرآن الكريم والأذكار والدعاء لها،
              بلا صورة شخصية، وبلا إعلانات، وبلا تسجيل حساب، وبلا اشتراكات أو مدفوعات.
            </Text>
          </View>
        </Card>

        {/* ------------------------------------------------------ مصدر القرآن */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle icon="book-outline" title="مصدر نص القرآن الكريم" />
          <Card>
            <View style={{ gap: spacing.md }}>
              <View style={styles.kvRow}>
                <Text style={[styles.k, { color: theme.textMuted }]}>المشروع</Text>
                <Text style={[styles.v, { color: theme.text }]}>{QURAN_MANIFEST.source.project}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={[styles.k, { color: theme.textMuted }]}>الرابط</Text>
                <ScalePressable onPress={() => openExternal(QURAN_MANIFEST.source.url)} accessibilityLabel="فتح موقع Tanzil">
                  <Text style={[styles.link, { color: theme.primary }]}>{QURAN_MANIFEST.source.url}</Text>
                </ScalePressable>
              </View>
              <View style={styles.kvRow}>
                <Text style={[styles.k, { color: theme.textMuted }]}>عدد السور</Text>
                <Text style={[styles.v, { color: theme.text }]}>{toArabicDigits(QURAN_MANIFEST.totalSurahs)}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={[styles.k, { color: theme.textMuted }]}>عدد الآيات</Text>
                <Text style={[styles.v, { color: theme.text }]}>{toArabicDigits(QURAN_MANIFEST.totalVerses)}</Text>
              </View>
              <OrnamentDivider width={160} color={theme.ornament} />
              <Text style={[styles.body, { color: theme.textSecondary }]}>{QURAN_MANIFEST.source.licenseSummary}</Text>
            </View>
          </Card>
        </View>

        {/* ------------------------------------------------------ أمانة النص */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle icon="shield-checkmark-outline" title="أمانة النص القرآني" />
          <Card>
            <View style={{ gap: spacing.sm }}>
              <Bullet text="المصدر الوحيد لنص القرآن في هذا التطبيق هو ملف Tanzil الخام المرفق مع المشروع في المسار assets/quran/." />
              <Bullet text="لم يقم أي نموذج ذكاء اصطناعي بكتابة أو توليد أو إعادة صياغة أي آية — لا من الذاكرة ولا من أي مصدر آخر." />
              <Bullet text="يحوّل سكربت scripts/build-quran.mjs الملف الخام إلى بنية JSON برمجيًا دون تعديل أي حرف أو حركة أو علامة وقف." />
              <Bullet text="بعد التحويل يُعاد بناء الملف الخام من البيانات ويُقارن بايت-ببايت مع الأصل؛ وأي اختلاف يُوقف البناء بخطأ." />
              <Bullet text="إن غاب الملف أو تعذّرت قراءته، يُظهر التطبيق خطأً واضحًا ويطلب الملف بدل اختراع النص." />
              <Bullet text="أرقام الآيات وأسماء السور بيانات وصفية للعرض فقط، وليست جزءًا من النص القرآني." />
              <Bullet text="البسملة تُعرض ضمن الآية الأولى كما هي في ملف Tanzil، دون فصل أو دمج." />
            </View>
          </Card>
        </View>

        {/* ------------------------------------------------------ التحقق */}
        {uthmani || simple ? (
          <View style={{ marginTop: spacing.xl }}>
            <SectionTitle icon="finger-print-outline" title="بصمات التحقق (SHA-256)" />
            <Card>
              {[uthmani, simple].filter(Boolean).map((t) => (
                <View key={t!.rawFile} style={[styles.hashBlock, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={[styles.hashLabel, { color: theme.text }]}>{t!.label}</Text>
                  <Text style={[styles.hashMeta, { color: theme.textMuted }]}>
                    {t!.rawFile} · {toArabicDigits(t!.verses)} آية · {toArabicDigits(t!.surahs)} سورة
                  </Text>
                  <Text style={[styles.hashMeta, { color: theme.textMuted }]}>
                    تحقق إعادة البناء بايت-ببايت: {t!.roundTripVerified ? 'ناجح ✓' : '—'}
                  </Text>
                  <Text selectable style={[styles.hash, { color: theme.textSecondary }]}>
                    {t!.rawSha256}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {/* ------------------------------------------------------ شروط الاستخدام */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle icon="document-text-outline" title="ترويسة الترخيص الأصلية من Tanzil" />
          <Card variant="alt">
            <View style={{ gap: 4 }}>
              {QURAN_MANIFEST.licenseHeader
                .filter((l) => l.trim().length > 0)
                .map((line, i) => (
                  <Text key={i} selectable style={[styles.licenseLine, { color: theme.textSecondary }]}>
                    {line}
                  </Text>
                ))}
            </View>
          </Card>
        </View>

        {/* ------------------------------------------------------ مصادر الأذكار */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle icon="leaf-outline" title="مصادر الأذكار والأدعية" />
          <Card>
            <View style={{ gap: spacing.md }}>
              {ADHKAR_SOURCES.map((s) => (
                <View key={s.data}>
                  <Text style={[styles.v, { color: theme.text }]}>{s.name}</Text>
                  <ScalePressable onPress={() => openExternal(s.data)} accessibilityLabel={`فتح ${s.name}`}>
                    <Text style={[styles.link, { color: theme.primary, marginTop: 3 }]}>{s.data}</Text>
                  </ScalePressable>
                  <Text style={[styles.hashMeta, { color: theme.textMuted, marginTop: 3 }]}>
                    الترخيص: {s.license} · تُعرض النصوص كما هي دون تعديل
                  </Text>
                </View>
              ))}
              <OrnamentDivider width={160} color={theme.ornament} />
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                الأدعية القرآنية في صفحة «الدعاء لها» تُجلب مباشرة من ملف القرآن عبر مرجع (سورة:آية)، ولا يُكتب أي نص منها
                يدويًا.
              </Text>
            </View>
          </Card>
        </View>

        {/* ------------------------------------------------------ الخطوط */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle icon="color-palette-outline" title="الخطوط" />
          <Card>
            <View style={{ gap: spacing.sm }}>
              <Bullet text="Amiri / Amiri Quran — خط نسخ مخصص للمصحف، من مشروع Amiri (ترخيص SIL Open Font License)." />
              <Bullet text="Tajawal — خط واجهة عربي حديث (ترخيص SIL Open Font License)." />
              <Bullet text="نص الترخيص مرفق في assets/fonts/OFL.txt." />
            </View>
          </Card>
        </View>

        {/* ------------------------------------------------------ الخصوصية */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle icon="lock-closed-outline" title="الخصوصية والعمل دون اتصال" />
          <Card>
            <View style={{ gap: spacing.sm }}>
              <Bullet text="لا يجمع التطبيق أي بيانات شخصية، ولا يستخدم أي أداة تتبع أو تحليلات." />
              <Bullet text="لا تسجيل دخول ولا حسابات ولا خوادم — كل البيانات محفوظة محليًا على جهازك." />
              <Bullet text="لا إعلانات ولا اشتراكات ولا مدفوعات إطلاقًا." />
              <Bullet text="نص القرآن والأذكار مضمّنان داخل التطبيق، فيعملان دون اتصال بعد التحميل الأول." />
              <Bullet text="قابل للتثبيت كتطبيق ويب تقدّمي (PWA) على الشاشة الرئيسية." />
            </View>
          </Card>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Card variant="gold">
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <Icon name="heart" size={20} color={theme.goldDeep} />
              <Text style={[styles.body, { color: theme.text, textAlign: 'center' }]}>
                اللهم اجعل هذا العمل في ميزان حسناتها، ونورًا لها في قبرها، وأنسًا لها في وحشتها.
              </Text>
            </View>
          </Card>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <AppFooter compact />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  const { theme } = useStore();
  return (
    <View style={styles.sectionHead}>
      <View style={[styles.sectionIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} size={15} color={theme.primary} />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  const { theme } = useStore();
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <View style={[styles.dot, { backgroundColor: theme.gold, marginTop: 7 }]} />
      <Text style={[styles.body, { color: theme.textSecondary, flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontFamily: fonts.uiBlack, fontSize: 20, flex: 1, textAlign: 'center' },
  h1: { fontFamily: fonts.display, fontSize: 26 },
  body: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 23 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm, paddingHorizontal: 4 },
  sectionIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: fonts.uiBlack, fontSize: 14.5 },
  kvRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  k: { fontFamily: fonts.ui, fontSize: 12.5 },
  v: { fontFamily: fonts.uiBold, fontSize: 13 },
  link: { fontFamily: fonts.uiBold, fontSize: 12.5, textDecorationLine: 'underline' },
  hashBlock: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm, gap: 3 },
  hashLabel: { fontFamily: fonts.uiBlack, fontSize: 13 },
  hashMeta: { fontFamily: fonts.ui, fontSize: 11, lineHeight: 17 },
  hash: { fontFamily: 'monospace', fontSize: 10, lineHeight: 16, marginTop: 4 },
  licenseLine: { fontFamily: 'monospace', fontSize: 10.5, lineHeight: 17 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
