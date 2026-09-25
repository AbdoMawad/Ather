import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import { Card, IconButton, ScalePressable, Screen, SectionHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { OrnamentDivider, RubElHizb } from '../components/Ornaments';
import { SurahNumberBadge } from '../components/SurahNumberBadge';
import { QURAN_MANIFEST, SURAH_LIST, getSurahMeta, type SurahMeta } from '../lib/quran';
import { normalizeQuery, toArabicDigits } from '../lib/arabic';
import { openExternal } from '../lib/web';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function QuranScreen() {
  const { theme, lastRead, bookmarks, settings, readingLog, today } = useStore();
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  const readingLogToday = useMemo(
    () => readingLog[today] ?? { ayahs: 0, surahs: [] as number[] },
    [readingLog, today]
  );

  const data = useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return SURAH_LIST;
    const latin = query.trim().toLowerCase();
    return SURAH_LIST.filter(
      (s) =>
        normalizeQuery(s.name).includes(q) ||
        normalizeQuery(s.fullName).includes(q) ||
        s.englishName.toLowerCase().includes(latin) ||
        s.englishTranslation.toLowerCase().includes(latin) ||
        toArabicDigits(s.number) === q ||
        String(s.number) === q
    );
  }, [query]);

  const lastSurah = lastRead ? getSurahMeta(lastRead.sura) : undefined;

  const renderItem = useCallback(
    ({ item }: { item: SurahMeta }) => {
      const bm = bookmarks.filter((b) => b.sura === item.number).length;
      const isLast = lastRead?.sura === item.number;
      const completedToday = readingLogToday.surahs.includes(item.number);
      return (
        <ScalePressable
          onPress={() => navigation.navigate('Surah', { sura: item.number })}
          accessibilityLabel={`سورة ${item.name}، ${item.ayahs} آية، ${item.revelation}`}
          style={{ marginBottom: spacing.sm }}
        >
          <View
            style={[
              styles.surahRow,
              {
                backgroundColor: isLast ? theme.goldSoft : theme.surface,
                borderColor: isLast ? theme.gold : theme.border,
                borderWidth: 1,
                ...shadows.soft(theme),
              },
            ]}
          >
            {/* شارة رقم السورة */}
            <View style={styles.numWrap}>
              <SurahNumberBadge n={item.number} size={50} filled={isLast} />
            </View>

            {/* الاسم والبيانات */}
            <View style={{ flex: 1, paddingHorizontal: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.surahName, { color: theme.text }]} numberOfLines={1}>
                  {item.fullName}
                </Text>
                {completedToday ? (
                  <View style={[styles.doneDot, { backgroundColor: theme.success }]} accessibilityLabel="أتممتها اليوم" />
                ) : null}
                {bm > 0 ? <Icon name="bookmark" size={12} color={theme.gold} /> : null}
              </View>
              <View style={styles.metaRow}>
                <View style={[styles.metaPill, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>{item.revelation}</Text>
                </View>
                <View style={[styles.metaPill, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.metaPillText, { color: theme.textSecondary }]}>
                    {toArabicDigits(item.ayahs)} آية
                  </Text>
                </View>
                <Text style={[styles.enName, { color: theme.textMuted }]} numberOfLines={1}>
                  {item.englishName}
                </Text>
              </View>
            </View>

            {/* الإجراء */}
            <View style={styles.endCol}>
              {isLast ? (
                <View style={[styles.lastPill, { backgroundColor: theme.primary }]}>
                  <Icon name="play" size={10} color={theme.textInverse} />
                  <Text style={[styles.lastPillText, { color: theme.textInverse }]}>تابع</Text>
                </View>
              ) : (
                <View style={[styles.chevWrap, { backgroundColor: theme.surfaceAlt }]}>
                  <Icon name="chevron-back" size={15} color={theme.textMuted} />
                </View>
              )}
            </View>
          </View>
        </ScalePressable>
      );
    },
    [bookmarks, lastRead, navigation, readingLogToday.surahs, theme]
  );

  const header = (
    <View style={{ paddingBottom: spacing.md }}>
      {/* الترويسة */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>القرآن الكريم</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {toArabicDigits(114)} سورة · {toArabicDigits(QURAN_MANIFEST.totalVerses)} آية
          </Text>
        </View>
        <IconButton
          name="bookmark-outline"
          onPress={() => navigation.navigate('Bookmarks')}
          accessibilityLabel="العلامات المرجعية"
        />
        <IconButton
          name="search-outline"
          onPress={() => navigation.navigate('Search')}
          accessibilityLabel="بحث في القرآن"
        />
      </View>

      {/* آخر قراءة */}
      {lastRead && lastSurah ? (
        <Card
          onPress={() => navigation.navigate('Surah', { sura: lastRead.sura, ayah: lastRead.ayah })}
          style={{ marginTop: spacing.lg, paddingVertical: spacing.md }}
          accessibilityLabel="متابعة القراءة"
        >
          <View style={styles.row}>
            <View style={[styles.tile, { backgroundColor: theme.primarySoft }]}>
              <Icon name="play-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tinyLabel, { color: theme.textMuted }]}>تابع من حيث توقفت</Text>
              <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                {lastSurah.fullName} · {toArabicDigits(lastRead.ayah)}
              </Text>
            </View>
            <View style={styles.miniRing}>
              <Text style={[styles.miniRingText, { color: theme.goldDeep }]}>
                {toArabicDigits(Math.round(lastRead.percent))}٪
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* البحث */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.surface, borderColor: theme.border, marginTop: spacing.lg },
        ]}
      >
        <Icon name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث عن سورة… (بالاسم أو الرقم)"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="بحث عن سورة"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="مسح البحث">
            <Icon name="close-circle" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg }}>
        <Text style={[styles.count, { color: theme.textMuted }]}>
          {toArabicDigits(data.length)} سورة
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Search')}
          hitSlop={8}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text style={[styles.count, { color: theme.primary }]}>بحث في الآيات</Text>
          <Icon name="chevron-back" size={13} color={theme.primary} />
        </Pressable>
      </View>
    </View>
  );

  const footer = (
    <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
      <OrnamentDivider width={180} color={theme.ornament} />
      <View style={[styles.sourceCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <RubElHizb size={18} color={theme.gold} />
        <Text style={[styles.sourceText, { color: theme.textSecondary }]}>
          نص القرآن الكريم من{' '}
          <Text style={[styles.link, { color: theme.primary }]} onPress={() => openExternal('https://tanzil.net/')}>
            Tanzil Project
          </Text>{' '}
          — {QURAN_MANIFEST.source.url}
        </Text>
        <Text style={[styles.sourceSmall, { color: theme.textMuted }]}>
          {settings.script === 'uthmani'
            ? 'الرسم العثماني (مصحف المدينة)'
            : 'الرسم الإملائي المبسّط'}{' '}
          · {toArabicDigits(QURAN_MANIFEST.totalVerses)} آية · تم التحقق من سلامة النص بايت-ببايت
        </Text>
        <Pressable onPress={() => navigation.navigate('About')} hitSlop={8} accessibilityRole="link">
          <Text style={[styles.sourceSmall, { color: theme.gold, marginTop: 6, fontFamily: fonts.uiBold }]}>
            شروط الاستخدام وتفاصيل المصدر ←
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(i) => String(i.number)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={14}
        windowSize={9}
        maxToRenderPerBatch={12}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
            <Icon name="search-outline" size={34} color={theme.textMuted} />
            <Text style={[styles.rowTitle, { color: theme.textMuted, marginTop: spacing.md }]}>لا توجد سورة بهذا الاسم</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.uiBlack, fontSize: 26 },
  subtitle: { fontFamily: fonts.ui, fontSize: 12.5, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tinyLabel: { fontFamily: fonts.ui, fontSize: 11.5 },
  rowTitle: { fontFamily: fonts.uiBlack, fontSize: 14.5 },
  miniRing: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(198,161,91,0.16)',
    alignItems: 'center',
  },
  miniRingText: { fontFamily: fonts.uiBlack, fontSize: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  searchInput: { flex: 1, fontFamily: fonts.ui, fontSize: 14.5, paddingVertical: 0, textAlign: 'right' },
  count: { fontFamily: fonts.uiMedium, fontSize: 12.5 },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    minHeight: 76,
    gap: spacing.xs,
  },
  numWrap: { alignItems: 'center', justifyContent: 'center' },
  surahName: { fontFamily: fonts.naskhBold, fontSize: 20.5, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  metaPill: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: radius.pill },
  metaPillText: { fontFamily: fonts.uiMedium, fontSize: 10.5 },
  meta: { fontFamily: fonts.ui, fontSize: 11.5 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  doneDot: { width: 7, height: 7, borderRadius: 4 },
  enName: { fontFamily: fonts.ui, fontSize: 10.5, fontStyle: 'italic', flexShrink: 1 },
  endCol: { alignItems: 'center', justifyContent: 'center', minWidth: 52 },
  chevWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  lastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  lastPillText: { fontFamily: fonts.uiBlack, fontSize: 11 },
  sourceCard: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  sourceText: { fontFamily: fonts.uiMedium, fontSize: 13, textAlign: 'center', lineHeight: 22 },
  sourceSmall: { fontFamily: fonts.ui, fontSize: 11.5, textAlign: 'center', lineHeight: 18 },
  link: { fontFamily: fonts.uiBold, textDecorationLine: 'underline' },
});
