import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import { Chip, EmptyState, IconButton, ScalePressable, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { OrnamentDivider } from '../components/Ornaments';
import { QuranText } from '../components/QuranText';
import { getSurahMeta, searchQuran, searchSurahs, type SearchHit } from '../lib/quran';
import { findMatches, normalizeQuery, snippetAround, toArabicDigits } from '../lib/arabic';
import { copyText, shareText, surahLink } from '../lib/share';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'Search'>;

const SUGGESTIONS = ['الرحمن', 'مغفرة', 'الجنة', 'ربنا', 'الصبر', 'نور', 'القلب', 'توبة'];

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { theme, settings, toggleBookmark, isBookmarked } = useStore();

  const [query, setQuery] = useState(route.params?.initial ?? '');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const q = normalizeQuery(query);
    if (q.length < 2) {
      setHits([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = setTimeout(() => {
      // بناء الفهرس قد يستغرق لحظات في أول مرة
      const res = searchQuran(query, settings.script, 300);
      setHits(res);
      setSearching(false);
      setSearched(true);
    }, 220);
    return () => clearTimeout(id);
  }, [query, settings.script]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const surahHits = useMemo(() => (normalizeQuery(query) ? searchSurahs(query).slice(0, 4) : []), [query]);

  const renderItem = useCallback(
    ({ item }: { item: SearchHit }) => {
      const snip = snippetAround(item.text, query, 110);
      const matches = findMatches(snip, query);
      const bookmarked = isBookmarked(item.sura, item.ayah);
      return (
        <ScalePressable
          onPress={() => navigation.navigate('Surah', { sura: item.sura, ayah: item.ayah })}
          onLongPress={async () => {
            const msg = `${item.text}\n\n﴿سورة ${item.sura} : ${toArabicDigits(item.ayah)}﴾\n${surahLink(item.sura, item.ayah)}`;
            const r = await shareText(msg, 'أثر أمال');
            toast.show(r === 'failed' ? 'تعذّرت المشاركة' : 'تمت المشاركة', 'share-social-outline');
          }}
          accessibilityLabel={`نتيجة: سورة ${item.sura} آية ${item.ayah}`}
          style={{ marginBottom: spacing.sm }}
        >
          <View
            style={[
              styles.hit,
              { backgroundColor: theme.surface, borderColor: theme.border, ...shadows.soft(theme) },
            ]}
          >
            <View style={styles.hitHead}>
              <View style={[styles.hitBadge, { backgroundColor: theme.primarySoft }]}>
                <Text style={[styles.hitBadgeText, { color: theme.primary }]}>
                  {toArabicDigits(item.sura)}:{toArabicDigits(item.ayah)}
                </Text>
              </View>
              <Text style={[styles.hitSurah, { color: theme.textSecondary }]} numberOfLines={1}>
                سورة {surahName(item.sura)}
              </Text>
              <View style={{ flex: 1 }} />
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={bookmarked ? 'إزالة العلامة' : 'حفظ علامة'}
                onPress={() => {
                  const added = toggleBookmark(item.sura, item.ayah);
                  toast.show(added ? 'تم حفظ العلامة' : 'تم إزالة العلامة', added ? 'bookmark' : 'bookmark-outline');
                }}
              >
                <Icon name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={17} color={bookmarked ? theme.gold : theme.textMuted} />
              </Pressable>
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="نسخ الآية"
                onPress={async () => {
                  const ok = await copyText(`${item.text}  ﴿سورة ${surahName(item.sura)} : ${item.ayah}﴾`);
                  toast.show(ok ? 'تم نسخ الآية' : 'تعذّر النسخ', 'copy-outline');
                }}
              >
                <Icon name="copy-outline" size={16} color={theme.textMuted} />
              </Pressable>
            </View>
            <QuranText
              text={snip}
              size={Math.min(settings.quranFontSize, 22)}
              script={settings.script}
              selectable={false}
              highlights={matches}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScalePressable>
      );
    },
    [isBookmarked, navigation, query, settings.quranFontSize, settings.script, theme, toast, toggleBookmark]
  );

  const header = (
    <View style={{ paddingBottom: spacing.md }}>
      <View style={styles.topRow}>
        <IconButton name="chevron-forward" onPress={() => navigation.goBack()} accessibilityLabel="رجوع" />
        <Text style={[styles.title, { color: theme.text }]}>البحث في القرآن</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="اكتب كلمة أو جزءًا من آية…"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="حقل البحث في الآيات"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="مسح">
            <Icon name="close-circle" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollViewRow>
        {SUGGESTIONS.map((s) => (
          <Chip key={s} label={s} onPress={() => setQuery(s)} active={normalizeQuery(query) === normalizeQuery(s)} />
        ))}
      </ScrollViewRow>

      {surahHits.length > 0 ? (
        <View style={{ marginTop: spacing.sm }}>
          <ScrollViewRow>
            {surahHits.map((s) => (
              <Chip
                key={s.number}
                icon="book-outline"
                label={`سورة ${s.name}`}
                onPress={() => navigation.navigate('Surah', { sura: s.number })}
              />
            ))}
          </ScrollViewRow>
        </View>
      ) : null}

      {searched && !searching ? (
        <View style={styles.resultInfo}>
          <Text style={[styles.resultInfoText, { color: theme.textMuted }]}>
            {hits.length > 0
              ? `${toArabicDigits(hits.length)} نتيجة${hits.length >= 300 ? ' (الحد الأقصى المعروض)' : ''}`
              : 'لا توجد نتائج'}
          </Text>
          <Text style={[styles.resultInfoText, { color: theme.textMuted }]}>البحث يتجاهل التشكيل · النص المعروض أصلي</Text>
        </View>
      ) : null}
      <OrnamentDivider width={170} color={theme.ornament} style={{ marginTop: spacing.sm }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <FlatList
        data={hits}
        keyExtractor={(i) => `${i.sura}:${i.ayah}`}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={7}
        ListEmptyComponent={
          searching ? (
            <View style={{ paddingVertical: spacing.xxxl, alignItems: 'center' }}>
              <ActivityIndicator color={theme.gold} size="large" />
              <Text style={[styles.hint, { color: theme.textMuted, marginTop: spacing.md }]}>جارٍ البحث في المصحف…</Text>
            </View>
          ) : searched ? (
            <EmptyState
              icon="search-outline"
              title="لا توجد نتائج"
              message="جرّب كلمة أقصر أو بدون تشكيل. البحث يعمل على النص المطبَّع لكن النتائج تُعرض بالنص الأصلي تمامًا."
            />
          ) : (
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm }}>
              <Icon name="book-outline" size={34} color={theme.textMuted} />
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                ابحث في {toArabicDigits(6236)} آية
              </Text>
              <Text style={[styles.hint, { color: theme.textMuted, textAlign: 'center' }]}>
                اكتب حرفين على الأقل. النتائج تُعرض كما هي في ملف Tanzil دون أي تغيير.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

function ScrollViewRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 2, gap: spacing.sm }}
      style={{ flexGrow: 0 }}
    >
      {children}
    </ScrollView>
  );
}

function surahName(n: number): string {
  return getSurahMeta(n)?.name ?? String(n);
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { fontFamily: fonts.uiBlack, fontSize: 19, flex: 1, textAlign: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    minHeight: 50,
  },
  searchInput: { flex: 1, fontFamily: fonts.ui, fontSize: 15, paddingVertical: 0, textAlign: 'right' },
  resultInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  resultInfoText: { fontFamily: fonts.ui, fontSize: 11.5 },
  hit: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  hitHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hitBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  hitBadgeText: { fontFamily: fonts.uiBlack, fontSize: 11.5 },
  hitSurah: { fontFamily: fonts.uiBold, fontSize: 12.5, flexShrink: 1 },
  hint: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 21 },
});
