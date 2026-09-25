import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../state/store';
import { fonts, QURAN_FONT_MAX, QURAN_FONT_MIN, radius, shadows, spacing } from '../theme';
import { Button, Card, IconButton, ProgressBar, ScalePressable, Sheet, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { AyahBadge, CornerOrnament, GeometricBackdrop, OrnamentDivider, RubElHizb } from '../components/Ornaments';
import { SurahNumberBadge } from '../components/SurahNumberBadge';
import { QuranText, quranFont } from '../components/QuranText';
import { getAyah, getSurahAyahs, getSurahMeta, QURAN_MANIFEST, type Ayah } from '../lib/quran';
import { copyText, shareText, surahLink } from '../lib/share';
import { clearDeepLink, openExternal, writeDeepLink } from '../lib/web';
import { toArabicDigits } from '../lib/arabic';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'Surah'>;

export default function SurahScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const {
    theme,
    settings,
    setSettings,
    setLastRead,
    isBookmarked,
    toggleBookmark,
    logAyahsRead,
    markSurahCompleted,
  } = useStore();

  const sura = Math.min(114, Math.max(1, route.params?.sura ?? 1));
  const initialAyah = route.params?.ayah;
  const meta = getSurahMeta(sura);

  const ayahs = useMemo<Ayah[]>(() => getSurahAyahs(sura, settings.script), [sura, settings.script]);
  const [selected, setSelected] = useState<Ayah | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  const viewed = useRef<Set<number>>(new Set());
  const logged = useRef(0);
  const listRef = useRef<FlatList<Ayah>>(null);
  const scrollRef = useRef<ScrollView>(null);
  const completedRef = useRef(false);
  const contentHeight = useRef(1);

  // خطأ صريح إذا لم يتوفر النص (لا يتم توليد أي بديل)
  const missing = ayahs.length === 0 || !meta;

  useEffect(() => {
    viewed.current = new Set();
    logged.current = 0;
    completedRef.current = false;
    setProgress(0);
    writeDeepLink(sura, initialAyah);
    return () => {
      clearDeepLink();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sura]);

  useEffect(() => {
    if (missing) return;
    navigation.setOptions?.({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing]);

  const flushViewed = useCallback(() => {
    const delta = viewed.current.size - logged.current;
    if (delta > 0) {
      logged.current = viewed.current.size;
      logAyahsRead(sura, delta);
    }
  }, [logAyahsRead, sura]);

  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;
      let maxAyah = 0;
      for (const v of viewableItems) {
        const a = v.item as Ayah | undefined;
        if (!a) continue;
        viewed.current.add(a.ayah);
        if (a.ayah > maxAyah) maxAyah = a.ayah;
      }
      flushViewed();
      const pct = (maxAyah / Math.max(1, ayahs.length)) * 100;
      setProgress(pct);
      const first = viewableItems[0]?.item as Ayah | undefined;
      if (first) setLastRead(sura, first.ayah, pct);
      if (maxAyah >= ayahs.length && !completedRef.current) {
        completedRef.current = true;
        markSurahCompleted(sura);
        toast.show(`أتممت سورة ${meta?.name ?? ''} — الحمد لله`, 'checkmark-done');
      }
    },
    [ayahs.length, flushViewed, markSurahCompleted, meta?.name, setLastRead, sura, toast]
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55, minimumViewTime: 220 }).current;

  const openAyah = useCallback((a: Ayah) => {
    setSelected(a);
    setSheetOpen(true);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!selected) return;
    const ok = await copyText(`${selected.text}  ﴿سورة ${meta?.name} : ${selected.ayah}﴾`);
    setSheetOpen(false);
    toast.show(ok ? 'تم نسخ الآية' : 'تعذّر النسخ', ok ? 'copy-outline' : 'alert-circle-outline');
  }, [meta?.name, selected, setSheetOpen, toast]);

  const handleShare = useCallback(async () => {
    if (!selected) return;
    const link = surahLink(sura, selected.ayah);
    const msg = `${selected.text}\n\n﴿سورة ${meta?.name} — الآية ${toArabicDigits(selected.ayah)}﴾\n${link}\n\nأثر أمال · صدقة جارية عن روح أمال محمود النهر`;
    setSheetOpen(false);
    const res = await shareText(msg, 'أثر أمال — القرآن الكريم');
    toast.show(
      res === 'shared' ? 'تمت المشاركة' : res === 'copied' ? 'تم نسخ النص للمشاركة' : 'تعذّرت المشاركة',
      res === 'failed' ? 'alert-circle-outline' : 'share-social-outline'
    );
  }, [meta?.name, selected, setSheetOpen, sura, toast]);

  const handleBookmark = useCallback(() => {
    if (!selected) return;
    const added = toggleBookmark(selected.sura, selected.ayah);
    setSheetOpen(false);
    toast.show(added ? 'تم حفظ العلامة المرجعية' : 'تم إزالة العلامة', added ? 'bookmark' : 'bookmark-outline');
  }, [selected, setSheetOpen, toast, toggleBookmark]);

  const handleSetLastRead = useCallback(() => {
    if (!selected) return;
    setLastRead(sura, selected.ayah, (selected.ayah / ayahs.length) * 100);
    setSheetOpen(false);
    toast.show('تم تعيينها كآخر موضع قراءة', 'locate-outline');
  }, [ayahs.length, selected, setLastRead, setSheetOpen, sura, toast]);

  const shareSurah = useCallback(async () => {
    const link = surahLink(sura);
    const msg = `سورة ${meta?.name}\n${link}\n\nأثر أمال · صدقة جارية عن روح أمال محمود النهر`;
    const res = await shareText(msg, 'أثر أمال — القرآن الكريم');
    toast.show(res === 'failed' ? 'تعذّرت المشاركة' : 'تمت مشاركة رابط السورة', 'link-outline');
  }, [meta?.name, sura, toast]);

  const goSurah = useCallback(
    (n: number) => {
      if (n < 1 || n > 114) return;
      navigation.replace('Surah', { sura: n });
    },
    [navigation]
  );

  const fontSize = settings.quranFontSize;

  // -------------------------------------------------------------------------
  // ترويسة مخصّصة
  // -------------------------------------------------------------------------
  const header = (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.headerBg,
          borderBottomColor: theme.border,
          paddingTop: insets.top + 6,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <IconButton name="chevron-forward" onPress={() => navigation.goBack()} accessibilityLabel="رجوع" size={22} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {meta ? meta.fullName : 'القرآن الكريم'}
          </Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]} numberOfLines={1}>
            {meta ? `${meta.revelation} · ${toArabicDigits(meta.ayahs)} آية` : ''}
          </Text>
        </View>
        <IconButton
          name="options-outline"
          onPress={() => setShowControls((v) => !v)}
          accessibilityLabel="خيارات العرض"
          active={showControls}
          size={20}
        />
      </View>

      {showControls ? (
        <View style={[styles.controls, { borderTopColor: theme.border }]}>
          <View style={styles.controlGroup}>
            <Text style={[styles.controlLabel, { color: theme.textMuted }]}>حجم الخط</Text>
            <View style={styles.controlRow}>
              <IconButton
                name="remove"
                size={18}
                accessibilityLabel="تصغير الخط"
                onPress={() => setSettings({ quranFontSize: Math.max(QURAN_FONT_MIN, fontSize - 2) })}
              />
              <Text style={[styles.controlValue, { color: theme.text }]}>{toArabicDigits(fontSize)}</Text>
              <IconButton
                name="add"
                size={18}
                accessibilityLabel="تكبير الخط"
                onPress={() => setSettings({ quranFontSize: Math.min(QURAN_FONT_MAX, fontSize + 2) })}
              />
            </View>
          </View>
          <View style={[styles.controlDivider, { backgroundColor: theme.border }]} />
          <View style={styles.controlGroup}>
            <Text style={[styles.controlLabel, { color: theme.textMuted }]}>الرسم</Text>
            <View style={styles.controlRow}>
              <ScalePressable
                onPress={() => setSettings({ script: 'uthmani' })}
                accessibilityLabel="الرسم العثماني"
                delay={0.94}
              >
                <View
                  style={[
                    styles.segBtn,
                    {
                      backgroundColor: settings.script === 'uthmani' ? theme.primarySoft : theme.surfaceAlt,
                      borderColor: settings.script === 'uthmani' ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      { color: settings.script === 'uthmani' ? theme.primary : theme.textMuted },
                    ]}
                  >
                    عثماني
                  </Text>
                </View>
              </ScalePressable>
              <ScalePressable
                onPress={() => setSettings({ script: 'simple' })}
                accessibilityLabel="الرسم الإملائي"
                delay={0.94}
              >
                <View
                  style={[
                    styles.segBtn,
                    {
                      backgroundColor: settings.script === 'simple' ? theme.primarySoft : theme.surfaceAlt,
                      borderColor: settings.script === 'simple' ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      { color: settings.script === 'simple' ? theme.primary : theme.textMuted },
                    ]}
                  >
                    إملائي
                  </Text>
                </View>
              </ScalePressable>
            </View>
          </View>
          <View style={[styles.controlDivider, { backgroundColor: theme.border }]} />
          <View style={styles.controlGroup}>
            <Text style={[styles.controlLabel, { color: theme.textMuted }]}>العرض</Text>
            <View style={styles.controlRow}>
              <IconButton
                name="list-outline"
                size={18}
                accessibilityLabel="عرض آية آية"
                active={settings.readingMode === 'ayah'}
                onPress={() => setSettings({ readingMode: 'ayah' })}
              />
              <IconButton
                name="document-text-outline"
                size={18}
                accessibilityLabel="عرض متصل"
                active={settings.readingMode === 'continuous'}
                onPress={() => setSettings({ readingMode: 'continuous' })}
              />
              <IconButton name="share-social-outline" size={18} accessibilityLabel="مشاركة رابط السورة" onPress={shareSurah} />
            </View>
          </View>
        </View>
      ) : null}

      <ProgressBar percent={progress} height={3} style={{ borderRadius: 0 }} animated={false} />
    </View>
  );

  // -------------------------------------------------------------------------
  // لافتة السورة
  // -------------------------------------------------------------------------
  const surahBanner = (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
      <View
        style={[
          styles.banner,
          { borderColor: theme.gold, ...shadows.soft(theme) },
        ]}
      >
        <LinearGradient
          colors={
            theme.name === 'dark'
              ? ['#1B2C24', '#131E19']
              : ['#FBF6E9', '#F2EBDD']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <GeometricBackdrop opacity={0.09} color={theme.gold} size={54} />
        <CornerOrnament size={40} color={theme.ornamentSoft} style={{ top: 6, right: 6 }} />
        <CornerOrnament size={40} color={theme.ornamentSoft} rotate={180} style={{ bottom: 6, left: 6 }} />
        <SurahNumberBadge n={sura} size={44} filled />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.bannerName, { color: theme.text }]}>{meta?.fullName}</Text>
          <OrnamentDivider width={130} color={theme.gold} style={{ marginVertical: 5 }} />
          <Text style={[styles.bannerMeta, { color: theme.textMuted }]}>
            {meta?.revelation} · {toArabicDigits(meta?.ayahs ?? 0)} آية · {meta?.englishName}
          </Text>
        </View>
        <RubElHizb size={26} color={theme.gold} />
      </View>
      <OrnamentDivider width={200} color={theme.ornament} style={{ marginVertical: spacing.lg }} />
      <Text style={[styles.integrityNote, { color: theme.textMuted }]}>
        النص معروض حرفيًا كما في ملف{' '}
        <Text style={[styles.linkInline, { color: theme.primary }]} onPress={() => openExternal(QURAN_MANIFEST.source.url)}>
          Tanzil
        </Text>{' '}
        ({settings.script === 'uthmani' ? 'الرسم العثماني' : 'الرسم الإملائي'}) — أرقام الآيات إضافة عرضية وليست جزءًا من النص.
      </Text>
    </View>
  );

  const navFooter = (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl }}>
      <View style={styles.navRow}>
        <Button
          title={sura > 1 ? `السورة السابقة` : undefined}
          icon="chevron-forward"
          variant="outline"
          disabled={sura <= 1}
          onPress={() => goSurah(sura - 1)}
          style={{ flex: 1 }}
          size="sm"
        />
        <Button
          title="الفهرس"
          icon="grid-outline"
          variant="soft"
          onPress={() => navigation.goBack()}
          size="sm"
        />
        <Button
          title={sura < 114 ? `السورة التالية` : undefined}
          iconRight="chevron-back"
          variant="outline"
          disabled={sura >= 114}
          onPress={() => goSurah(sura + 1)}
          style={{ flex: 1 }}
          size="sm"
        />
      </View>
      <Text style={[styles.footerNote, { color: theme.textMuted }]}>
        اللهم اجعل ما نقرأه نورًا لها ورفعةً في درجاتها
      </Text>
    </View>
  );

  // -------------------------------------------------------------------------
  // العرض
  // -------------------------------------------------------------------------
  if (missing) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {header}
        <View style={styles.errorWrap}>
          <Icon name="alert-circle-outline" size={40} color={theme.danger} />
          <Text style={[styles.errorTitle, { color: theme.danger }]}>تعذّر تحميل نص القرآن</Text>
          <Text style={[styles.errorBody, { color: theme.textSecondary }]}>
            لم يتم العثور على بيانات السورة {toArabicDigits(sura)} في ملف النص القرآني المرفق مع المشروع.
            {'\n\n'}
            حرصًا على سلامة النص لا يقوم التطبيق بتوليد أو كتابة أي آية من الذاكرة.
            {'\n\n'}
            يرجى توفير ملف Tanzil الخام في المسار:{'\n'}
            <Text style={{ fontFamily: fonts.uiBold, color: theme.text }}>
              assets/quran/quran-{settings.script}.txt
            </Text>
            {'\n'}ثم تشغيل: <Text style={{ fontFamily: fonts.uiBold, color: theme.text }}>node scripts/build-quran.mjs</Text>
          </Text>
          <View style={{ marginTop: spacing.xl, flexDirection: 'row', gap: spacing.sm }}>
            <Button title="الفهرس" variant="outline" icon="list-outline" onPress={() => navigation.goBack()} />
            <Button title="تفاصيل المصدر" icon="information-circle-outline" onPress={() => navigation.navigate('About')} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {header}

      {settings.readingMode === 'ayah' ? (
        <FlatList
          ref={listRef}
          data={ayahs}
          keyExtractor={(a) => `${a.sura}:${a.ayah}`}
          ListHeaderComponent={surahBanner}
          ListFooterComponent={navFooter}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={8}
          windowSize={7}
          maxToRenderPerBatch={8}
          removeClippedSubviews={Platform.OS === 'android'}
          initialScrollIndex={
            initialAyah && initialAyah > 1 && initialAyah <= ayahs.length ? initialAyah - 1 : undefined
          }
          getItemLayout={undefined}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <AyahCard
              ayah={item}
              size={fontSize}
              script={settings.script}
              bookmarked={isBookmarked(item.sura, item.ayah)}
              isTarget={initialAyah === item.ayah}
              onPress={() => openAyah(item)}
            />
          )}
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            const h = Math.max(1, e.nativeEvent.contentSize.height - e.nativeEvent.layoutMeasurement.height);
            const pct = Math.max(0, Math.min(100, (y / h) * 100));
            setProgress(pct);
            const idx = Math.max(1, Math.min(ayahs.length, Math.round((pct / 100) * ayahs.length) + 1));
            setLastRead(sura, idx, pct);
            if (pct > 96 && !completedRef.current) {
              completedRef.current = true;
              markSurahCompleted(sura);
              ayahs.forEach((a) => viewed.current.add(a.ayah));
              flushViewed();
              toast.show(`أتممت سورة ${meta?.name ?? ''} — الحمد لله`, 'checkmark-done');
            }
          }}
          scrollEventThrottle={120}
          onContentSizeChange={(w, h) => {
            contentHeight.current = h;
            if (initialAyah && initialAyah > 1) {
              const approx = ((initialAyah - 1) / ayahs.length) * h;
              scrollRef.current?.scrollTo({ y: approx, animated: false });
            }
          }}
        >
          {surahBanner}
          <View style={{ paddingHorizontal: spacing.xl }}>
            <Text
              style={{
                fontFamily: quranFont(settings.script),
                fontSize,
                lineHeight: Math.round(fontSize * 2.1),
                color: theme.text,
                textAlign: 'justify',
                writingDirection: 'rtl',
              }}
              selectable
            >
              {ayahs.map((a) => (
                <Text key={`${a.sura}:${a.ayah}`} onPress={() => openAyah(a)}>
                  {a.text}
                  <Text
                    style={{
                      color: theme.gold,
                      fontSize: Math.round(fontSize * 0.62),
                      fontFamily: fonts.uiBold,
                    }}
                  >
                    {' ﴿'}
                    {toArabicDigits(a.ayah)}
                    {'﴾ '}
                  </Text>
                </Text>
              ))}
            </Text>
          </View>
          {navFooter}
        </ScrollView>
      )}

      {/* ------------------------------------------------------- إجراءات الآية */}
      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={selected ? `سورة ${meta?.name} · الآية ${toArabicDigits(selected.ayah)}` : ''}
      >
        {selected ? (
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.sheetAyah,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <QuranText
                text={selected.text}
                size={Math.min(fontSize, 24)}
                script={settings.script}
                selectable
              />
            </View>
            <View style={styles.sheetActions}>
              <SheetAction icon="copy-outline" label="نسخ الآية" onPress={handleCopy} />
              <SheetAction icon="share-social-outline" label="مشاركة" onPress={handleShare} />
              <SheetAction
                icon={isBookmarked(selected.sura, selected.ayah) ? 'bookmark' : 'bookmark-outline'}
                label={isBookmarked(selected.sura, selected.ayah) ? 'إزالة العلامة' : 'حفظ علامة'}
                onPress={handleBookmark}
              />
              <SheetAction icon="locate-outline" label="آخر موضع قراءة" onPress={handleSetLastRead} />
              <SheetAction
                icon="link-outline"
                label="نسخ رابط الآية"
                onPress={async () => {
                  const ok = await copyText(surahLink(sura, selected.ayah));
                  setSheetOpen(false);
                  toast.show(ok ? 'تم نسخ الرابط' : 'تعذّر النسخ', 'link-outline');
                }}
              />
              <SheetAction
                icon="search-outline"
                label="بحث عن كلمة منها"
                onPress={() => {
                  const words = selected.text.split(/\s+/).filter((w) => w.length > 3);
                  setSheetOpen(false);
                  navigation.navigate('Search', { initial: words[0] ?? '' });
                }}
              />
            </View>
            <Text style={[styles.sheetNote, { color: theme.textMuted }]}>
              النص المعروض هو النص الأصلي من ملف Tanzil دون أي تعديل.
            </Text>
          </ScrollView>
        ) : null}
      </Sheet>
    </View>
  );
}

function SheetAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { theme } = useStore();
  return (
    <ScalePressable onPress={onPress} accessibilityLabel={label} delay={0.94} style={{ flexBasis: '31%' }}>
      <View style={[styles.sheetAction, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Icon name={icon} size={20} color={theme.primary} />
        <Text style={[styles.sheetActionText, { color: theme.textSecondary }]} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </ScalePressable>
  );
}

function AyahCard({
  ayah,
  size,
  script,
  bookmarked,
  isTarget,
  onPress,
}: {
  ayah: Ayah;
  size: number;
  script: 'uthmani' | 'simple';
  bookmarked: boolean;
  isTarget: boolean;
  onPress: () => void;
}) {
  const { theme } = useStore();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`الآية ${ayah.ayah} — اضغط لعرض الخيارات`}
      style={({ pressed }) => [
        styles.ayahWrap,
        {
          backgroundColor: isTarget ? theme.goldSoft : pressed ? theme.surfaceSunken : 'transparent',
          borderColor: isTarget ? theme.gold : 'transparent',
        },
      ]}
    >
      <View style={styles.ayahBody}>
        <QuranText text={ayah.text} size={size} script={script} selectable={false} style={{ flex: 1 }} />
      </View>
      <View style={styles.ayahSide}>
        {bookmarked ? <Icon name="bookmark" size={13} color={theme.gold} /> : null}
        <AyahBadge n={ayah.ayah} size={32} active={isTarget} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: 0,
    zIndex: 5,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingBottom: 8 },
  headerTitle: { fontFamily: fonts.naskhBold, fontSize: 19 },
  headerSub: { fontFamily: fonts.ui, fontSize: 11, marginTop: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  controlGroup: { flex: 1, alignItems: 'center', gap: 4 },
  controlLabel: { fontFamily: fonts.ui, fontSize: 10.5 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  controlValue: { fontFamily: fonts.uiBlack, fontSize: 14, minWidth: 26, textAlign: 'center' },
  controlDivider: { width: 1, alignSelf: 'stretch', marginVertical: 4 },
  segBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  segBtnText: { fontFamily: fonts.uiBold, fontSize: 11.5 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bannerName: { fontFamily: fonts.naskhBold, fontSize: 22 },
  bannerMeta: { fontFamily: fonts.ui, fontSize: 11.5, marginTop: 2 },
  integrityNote: { fontFamily: fonts.ui, fontSize: 11, lineHeight: 18, textAlign: 'center' },
  linkInline: { fontFamily: fonts.uiBold, textDecorationLine: 'underline' },
  ayahWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  ayahBody: { flex: 1 },
  ayahSide: { alignItems: 'center', gap: 6, paddingTop: 4 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  footerNote: { fontFamily: fonts.naskh, fontSize: 14, textAlign: 'center', marginTop: spacing.lg, lineHeight: 24 },
  sheetAyah: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.lg },
  sheetActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  sheetAction: {
    flex: 1,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  sheetActionText: { fontFamily: fonts.uiMedium, fontSize: 11.5, textAlign: 'center' },
  sheetNote: { fontFamily: fonts.ui, fontSize: 11, textAlign: 'center', marginTop: spacing.lg, lineHeight: 17 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  errorTitle: { fontFamily: fonts.uiBlack, fontSize: 18, marginTop: spacing.md },
  errorBody: { fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 24, textAlign: 'center', marginTop: spacing.md },
});
