import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import { Button, EmptyState, IconButton, ScalePressable, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { OrnamentDivider } from '../components/Ornaments';
import { QuranText } from '../components/QuranText';
import { getAyah, getSurahMeta, type QuranScript } from '../lib/quran';
import { toArabicDigits } from '../lib/arabic';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BookmarksScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { theme, bookmarks, removeBookmark, settings } = useStore();

  const sorted = useMemo(
    () => [...bookmarks].sort((a, b) => (a.sura === b.sura ? a.ayah - b.ayah : a.sura - b.sura)),
    [bookmarks]
  );

  const confirmRemove = useCallback(
    (id: string) => {
      if (Platform.OS === 'web') {
        removeBookmark(id);
        toast.show('تم حذف العلامة', 'trash-outline');
        return;
      }
      Alert.alert('حذف العلامة', 'هل تريد إزالة هذه العلامة المرجعية؟', [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            removeBookmark(id);
            toast.show('تم حذف العلامة', 'trash-outline');
          },
        },
      ]);
    },
    [removeBookmark, toast]
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof sorted)[number] }) => {
      const meta = getSurahMeta(item.sura);
      return (
        <ScalePressable
          onPress={() => navigation.navigate('Surah', { sura: item.sura, ayah: item.ayah })}
          accessibilityLabel={`سورة ${meta?.name} الآية ${item.ayah}`}
          style={{ marginBottom: spacing.sm }}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border, ...shadows.soft(theme) },
            ]}
          >
            <View style={styles.head}>
              <View style={[styles.badge, { backgroundColor: theme.goldSoft }]}>
                <Icon name="bookmark" size={13} color={theme.goldDeep} />
                <Text style={[styles.badgeText, { color: theme.goldDeep }]}>
                  {toArabicDigits(item.sura)}:{toArabicDigits(item.ayah)}
                </Text>
              </View>
              <Text style={[styles.surah, { color: theme.text }]} numberOfLines={1}>
                سورة {meta?.name}
              </Text>
              <View style={{ flex: 1 }} />
              <IconButton
                name="trash-outline"
                size={17}
                onPress={() => confirmRemove(item.id)}
                accessibilityLabel="حذف العلامة"
              />
            </View>
            <QuranText
              text={previewFor(item.sura, item.ayah, settings.script)}
              size={Math.min(settings.quranFontSize, 21)}
              script={settings.script}
              selectable={false}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScalePressable>
      );
    },
    [confirmRemove, navigation, settings.quranFontSize, settings.script, theme]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <FlatList
        data={sorted}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingBottom: spacing.md }}>
            <View style={styles.topRow}>
              <IconButton name="chevron-forward" onPress={() => navigation.goBack()} accessibilityLabel="رجوع" />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.title, { color: theme.text }]}>العلامات المرجعية</Text>
                <Text style={[styles.sub, { color: theme.textMuted }]}>
                  {toArabicDigits(sorted.length)} علامة محفوظة على جهازك
                </Text>
              </View>
              <View style={{ width: 42 }} />
            </View>
            <OrnamentDivider width={170} color={theme.ornament} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title="لا توجد علامات بعد"
            message="اضغط على أي آية أثناء القراءة ثم اختر «حفظ علامة» لتظهر هنا."
            action={<Button title="إلى القرآن الكريم" icon="book-outline" onPress={() => navigation.goBack()} />}
          />
        }
      />
    </View>
  );
}

function previewFor(sura: number, ayah: number, script: QuranScript): string {
  const a = getAyah(sura, ayah, script);
  return a ? a.text : '—';
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  title: { fontFamily: fonts.uiBlack, fontSize: 19 },
  sub: { fontFamily: fonts.ui, fontSize: 11.5, marginTop: 2 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontFamily: fonts.uiBlack, fontSize: 11.5 },
  surah: { fontFamily: fonts.uiBold, fontSize: 13, flexShrink: 1 },
});
