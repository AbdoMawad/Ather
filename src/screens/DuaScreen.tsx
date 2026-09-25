import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStore } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import { Card, IconButton, ScalePressable, Screen, SectionHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { AppFooter } from '../components/AppFooter';
import {
  CornerOrnament,
  GeometricBackdrop,
  OrnamentDivider,
  RubElHizb,
  StarWatermark,
} from '../components/Ornaments';
import { QuranText } from '../components/QuranText';
import { DUA_NOTE, DUA_QURAN, DUA_SUNNAH } from '../lib/adhkar';
import { getAyah, getSurahMeta } from '../lib/quran';
import { copyText, shareText } from '../lib/share';
import { toArabicDigits } from '../lib/arabic';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEDICATION = 'إلى روح أمال محمود النهر — رحمها الله وغفر لها وأسكنها فسيح جناته';

export default function DuaScreen() {
  const navigation = useNavigation<Nav>();
  const { theme, settings, duaToday, duaTotal, incDua } = useStore();
  const [showOriginal, setShowOriginal] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const handleDua = useCallback(() => {
    incDua();
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    scale.setValue(0.9);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.06, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
    glow.setValue(0);
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [glow, incDua, scale, settings.haptics]);

  const quranDuas = useMemo(
    () =>
      DUA_QURAN.map((d) => {
        const a = getAyah(d.sura, d.ayah, settings.script);
        return { ...d, text: a?.text ?? null, name: getSurahMeta(d.sura)?.name ?? '' };
      }),
    [settings.script]
  );

  const missingQuranText = quranDuas.some((d) => !d.text);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ------------------------------------------------------------- الترويسة */}
        <View style={{ padding: spacing.lg }}>
          <View
            style={[
              styles.hero,
              { borderRadius: radius.xl, borderColor: theme.gold, ...shadows.lift(theme) },
            ]}
          >
            <LinearGradient
              colors={theme.name === 'dark' ? ['#101F2A', '#0C1512', '#14231C'] : ['#1D5A6B', '#123F2D', '#0E3324']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <GeometricBackdrop opacity={0.1} color="#C6A15B" size={72} />
            <StarWatermark size={210} color="#C6A15B" opacity={0.1} style={{ position: 'absolute', bottom: -70, right: -60 }} />
            <CornerOrnament size={48} color="rgba(198,161,91,0.5)" style={{ top: 10, right: 10 }} />
            <CornerOrnament size={48} color="rgba(198,161,91,0.5)" rotate={180} style={{ bottom: 10, left: 10 }} />

            <View style={styles.heroInner}>
              <RubElHizb size={26} color="#D9BC7C" />
              <Text style={[styles.heroTitle, { color: '#FBF6E9' }]}>الدعاء لها</Text>
              <Text style={[styles.heroSub, { color: '#E3D6B6' }]}>{DEDICATION}</Text>
              <OrnamentDivider width={180} color="#C6A15B" style={{ marginVertical: spacing.lg }} />

              {/* زر «دعوت لها» */}
              <View style={{ alignItems: 'center' }}>
                <Animated.View
                  style={{
                    borderRadius: 62,
                    opacity: glow,
                    backgroundColor: 'rgba(217,188,124,0.35)',
                    position: 'absolute',
                    width: 148,
                    height: 148,
                    transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.35] }) }],
                  }}
                />
                <ScalePressable onPress={handleDua} accessibilityLabel="دعوت لها" delay={1}>
                  <Animated.View
                    style={[
                      styles.duaBtn,
                      { transform: [{ scale }], borderColor: '#D9BC7C' },
                    ]}
                  >
                    <Icon name="hand-right-outline" size={30} color="#FBF6E9" />
                    <Text style={styles.duaBtnText}>دعوت لها</Text>
                  </Animated.View>
                </ScalePressable>
                <View style={styles.counterRow}>
                  <Text style={[styles.counterBig, { color: '#FBF6E9' }]}>{toArabicDigits(duaToday)}</Text>
                  <Text style={[styles.counterLabel, { color: 'rgba(227,214,182,0.9)' }]}>دعوة اليوم</Text>
                  <View style={[styles.counterSep, { backgroundColor: 'rgba(217,188,124,0.5)' }]} />
                  <Text style={[styles.counterBig, { color: '#FBF6E9' }]}>{toArabicDigits(duaTotal)}</Text>
                  <Text style={[styles.counterLabel, { color: 'rgba(227,214,182,0.9)' }]}>إجمالي الدعوات</Text>
                </View>
                <Text style={[styles.symbolicNote, { color: 'rgba(251,246,233,0.78)' }]}>
                  تفاعل رمزي فقط — لا يعلم عدد الحسنات ولا مقدار الأجر إلا الله سبحانه
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------- تنبيه الأمانة */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Card variant="alt" style={{ paddingVertical: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <Icon name="information-circle-outline" size={18} color={theme.gold} style={{ marginTop: 2 }} />
              <Text style={[styles.noteBody, { color: theme.textSecondary, flex: 1 }]}>{DUA_NOTE}</Text>
            </View>
            <View style={styles.toggleRow}>
              <ScalePressable
                onPress={() => setShowOriginal(false)}
                accessibilityLabel="عرض الدعاء بصيغة المؤنث"
                delay={0.95}
              >
                <View
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: !showOriginal ? theme.primary : theme.surface,
                      borderColor: !showOriginal ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Icon name="female-outline" size={14} color={!showOriginal ? theme.textInverse : theme.textMuted} />
                  <Text style={[styles.toggleText, { color: !showOriginal ? theme.textInverse : theme.textMuted }]}>
                    صيغة المؤنث (لها)
                  </Text>
                </View>
              </ScalePressable>
              <ScalePressable
                onPress={() => setShowOriginal(true)}
                accessibilityLabel="عرض النص الأصلي كما ورد في المصدر"
                delay={0.95}
              >
                <View
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: showOriginal ? theme.primary : theme.surface,
                      borderColor: showOriginal ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Icon name="document-text-outline" size={14} color={showOriginal ? theme.textInverse : theme.textMuted} />
                  <Text style={[styles.toggleText, { color: showOriginal ? theme.textInverse : theme.textMuted }]}>
                    النص الأصلي
                  </Text>
                </View>
              </ScalePressable>
            </View>
          </Card>
        </View>

        {/* --------------------------------------------------- أدعية من السنة */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <SectionHeader
            title="أدعية للميت من السنة"
            subtitle={showOriginal ? 'من حصن المسلم — بالنص الأصلي دون تعديل' : 'من حصن المسلم — بصيغة المؤنث للدعاء لها'}
            icon="book-outline"
          />
          {DUA_SUNNAH.map((section) => (
            <View key={section.id} style={{ marginBottom: spacing.lg }}>
              <View style={styles.subHead}>
                <View style={[styles.subDot, { backgroundColor: theme.gold }]} />
                <Text style={[styles.subTitle, { color: theme.text }]}>{section.title}</Text>
              </View>
              {section.items.map((it) => {
                const shown = showOriginal ? it.text : it.textFeminine ?? it.text;
                return (
                  <DuaCard
                    key={it.id}
                    text={shown}
                    badge={!showOriginal && it.textFeminine && it.textFeminine !== it.text ? 'لها' : undefined}
                    onCopy={async () => {
                      const ok = await copyText(shown);
                      return ok;
                    }}
                    onShare={() => shareText(`${shown}\n\n— أثر أمال · الدعاء لها`, 'أثر أمال — الدعاء لها')}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* ------------------------------------------------- أدعية من القرآن */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <SectionHeader
            title="أدعية من القرآن الكريم"
            subtitle="النص مأخوذ مباشرة من ملف Tanzil — اضغط للانتقال إلى الآية"
            icon="reader-outline"
          />
          {missingQuranText ? (
            <Card variant="alt">
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <Icon name="alert-circle-outline" size={18} color={theme.danger} />
                <Text style={[styles.noteBody, { color: theme.danger, flex: 1 }]}>
                  تعذّر قراءة نص بعض الآيات من ملف القرآن. لا يقوم التطبيق بكتابة أي آية من الذاكرة — يرجى التأكد من وجود
                  ملف Tanzil الخام ثم إعادة بناء البيانات.
                </Text>
              </View>
            </Card>
          ) : null}
          {quranDuas.map((d) =>
            d.text ? (
              <ScalePressable
                key={d.id}
                onPress={() => navigation.navigate('Surah', { sura: d.sura, ayah: d.ayah })}
                accessibilityLabel={`سورة ${d.name} الآية ${d.ayah}`}
                style={{ marginBottom: spacing.sm }}
              >
                <View
                  style={[
                    styles.quranCard,
                    { backgroundColor: theme.surface, borderColor: theme.border, ...shadows.soft(theme) },
                  ]}
                >
                  <View style={styles.quranHead}>
                    <View style={[styles.refPill, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.refText, { color: theme.primary }]}>
                        سورة {d.name} · {toArabicDigits(d.ayah)}
                      </Text>
                    </View>
                    <Text style={[styles.quranNote, { color: theme.textMuted }]} numberOfLines={1}>
                      {d.note}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Icon name="chevron-back" size={15} color={theme.textMuted} />
                  </View>
                  <QuranText
                    text={d.text}
                    size={Math.min(settings.quranFontSize, 22)}
                    script={settings.script}
                    selectable={false}
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              </ScalePressable>
            ) : null
          )}
        </View>

        {/* ------------------------------------------------------- خاتمة */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Card variant="gold">
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <RubElHizb size={20} color={theme.goldDeep} />
              <Text style={[styles.closing, { color: theme.text }]}>
                اللهم اغفر لها وارحمها، وعافها واعفُ عنها، وأكرم نزلها، ووسّع مدخلها، واجعل قبرها روضةً من رياض الجنة.
              </Text>
            </View>
          </Card>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <AppFooter compact />
        </View>
      </ScrollView>
    </Screen>
  );
}

function DuaCard({
  text,
  badge,
  onCopy,
  onShare,
}: {
  text: string;
  badge?: string;
  onCopy: () => Promise<boolean>;
  onShare: () => Promise<unknown>;
}) {
  const { theme } = useStore();
  const [copied, setCopied] = useState(false);
  return (
    <View
      style={[
        styles.duaCard,
        { backgroundColor: theme.surface, borderColor: theme.border, ...shadows.soft(theme) },
      ]}
    >
      {badge ? (
        <View style={[styles.femBadge, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
          <Icon name="female-outline" size={11} color={theme.goldDeep} />
          <Text style={[styles.femBadgeText, { color: theme.goldDeep }]}>{badge}</Text>
        </View>
      ) : null}
      <Text style={[styles.duaText, { color: theme.text }]} selectable>
        {text}
      </Text>
      <View style={[styles.duaActions, { borderTopColor: theme.border }]}>
        <ScalePressable
          onPress={async () => {
            const ok = await onCopy();
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }
          }}
          accessibilityLabel="نسخ الدعاء"
          delay={0.94}
        >
          <View style={[styles.miniBtn, { backgroundColor: theme.surfaceAlt }]}>
            <Icon name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? theme.success : theme.textSecondary} />
            <Text style={[styles.miniBtnText, { color: theme.textSecondary }]}>{copied ? 'تم النسخ' : 'نسخ'}</Text>
          </View>
        </ScalePressable>
        <ScalePressable onPress={() => onShare()} accessibilityLabel="مشاركة الدعاء" delay={0.94}>
          <View style={[styles.miniBtn, { backgroundColor: theme.surfaceAlt }]}>
            <Icon name="share-social-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.miniBtnText, { color: theme.textSecondary }]}>مشاركة</Text>
          </View>
        </ScalePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, overflow: 'hidden' },
  heroInner: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  heroTitle: { fontFamily: fonts.display, fontSize: 34, letterSpacing: 0.6 },
  heroSub: { fontFamily: fonts.naskh, fontSize: 15.5, textAlign: 'center', marginTop: 6, lineHeight: 27, maxWidth: 420 },
  duaBtn: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1.6,
    backgroundColor: 'rgba(251,246,233,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  duaBtnText: { fontFamily: fonts.uiBlack, fontSize: 16, color: '#FBF6E9' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg },
  counterBig: { fontFamily: fonts.uiBlack, fontSize: 18 },
  counterLabel: { fontFamily: fonts.ui, fontSize: 11.5 },
  counterSep: { width: 1, height: 16, marginHorizontal: 6 },
  symbolicNote: { fontFamily: fonts.ui, fontSize: 11, textAlign: 'center', marginTop: spacing.md, lineHeight: 18, maxWidth: 320 },
  noteBody: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 21 },
  subHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm, marginTop: spacing.sm },
  subDot: { width: 7, height: 7, borderRadius: 4 },
  subTitle: { fontFamily: fonts.uiBlack, fontSize: 14.5 },
  duaCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.sm },
  duaText: { fontFamily: fonts.naskh, fontSize: 18, lineHeight: 34, textAlign: 'justify', writingDirection: 'rtl' },
  duaActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1 },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  miniBtnText: { fontFamily: fonts.uiBold, fontSize: 11.5 },
  quranCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  quranHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refPill: { paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: radius.pill },
  refText: { fontFamily: fonts.uiBlack, fontSize: 11 },
  quranNote: { fontFamily: fonts.ui, fontSize: 11.5 },
  closing: { fontFamily: fonts.naskh, fontSize: 17, lineHeight: 32, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  toggleText: { fontFamily: fonts.uiBold, fontSize: 12 },
  femBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  femBadgeText: { fontFamily: fonts.uiBlack, fontSize: 10.5 },
});
