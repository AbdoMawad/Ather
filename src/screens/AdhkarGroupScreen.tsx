import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useStore } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import { Button, IconButton, ProgressBar, ScalePressable, Sheet, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { OrnamentDivider, RubElHizb } from '../components/Ornaments';
import { getGroup, countLabel as defaultCountLabel, type AdhkarItem } from '../lib/adhkar';
import { toArabicDigits } from '../lib/arabic';
import { copyText, shareText } from '../lib/share';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'AdhkarGroup'>;

export default function AdhkarGroupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const {
    theme,
    settings,
    adhkarCount,
    incAdhkar,
    decAdhkar,
    completeAdhkar,
    resetAdhkarGroup,
    groupProgress,
  } = useStore();

  const group = getGroup(route.params?.id ?? '');
  const [sheet, setSheet] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const progress = group ? groupProgress(group.id) : { done: 0, total: 0, percent: 0 };

  const bump = useCallback(() => {
    if (!settings.haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [settings.haptics]);

  const items = useMemo(() => group?.items ?? [], [group]);

  const renderItem = useCallback(
    ({ item }: { item: AdhkarItem }) => {
      const current = adhkarCount(item.id);
      const done = current >= item.count;
      return (
        <DhikrCard
          item={item}
          current={current}
          done={done}
          expanded={!!expanded[item.id]}
          onToggleExpand={() => setExpanded((p) => ({ ...p, [item.id]: !p[item.id] }))}
          onInc={() => {
            bump();
            incAdhkar(item.id, 1);
          }}
          onDec={() => {
            bump();
            decAdhkar(item.id);
          }}
          onComplete={() => {
            bump();
            completeAdhkar(item.id);
          }}
          onCopy={async () => {
            const ok = await copyText(item.text);
            toast.show(ok ? 'تم نسخ الذكر' : 'تعذّر النسخ', 'copy-outline');
          }}
          onShare={async () => {
            const r = await shareText(
              `${item.text}\n\n— أثر أمال · صدقة جارية عن روح أمال محمود النهر`,
              'أثر أمال — الأذكار'
            );
            toast.show(r === 'failed' ? 'تعذّرت المشاركة' : 'تمت المشاركة', 'share-social-outline');
          }}
        />
      );
    },
    [adhkarCount, bump, completeAdhkar, decAdhkar, expanded, incAdhkar, toast]
  );

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl }}>
        <Icon name="alert-circle-outline" size={36} color={theme.danger} />
        <Text style={[styles.missingTitle, { color: theme.text, marginTop: spacing.md }]}>المجموعة غير موجودة</Text>
        <View style={{ marginTop: spacing.lg }}>
          <Button title="رجوع" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* الترويسة */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.headerBg, borderBottomColor: theme.border, paddingTop: insets.top + 6 },
        ]}
      >
        <View style={styles.headerRow}>
          <IconButton name="chevron-forward" onPress={() => navigation.goBack()} accessibilityLabel="رجوع" />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {group.title}
            </Text>
            <Text style={[styles.headerSub, { color: theme.textMuted }]} numberOfLines={1}>
              {group.hint}
            </Text>
          </View>
          <IconButton name="refresh-outline" onPress={() => setSheet(true)} accessibilityLabel="إعادة ضبط تقدّم اليوم" />
        </View>
        <View style={styles.progressRow}>
          <ProgressBar
            percent={progress.percent}
            height={6}
            color={progress.done >= progress.total && progress.total > 0 ? theme.gold : theme.primary}
            style={{ flex: 1 }}
          />
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {toArabicDigits(progress.done)}/{toArabicDigits(progress.total)}
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        ListHeaderComponent={
          progress.total > 0 && progress.done >= progress.total ? (
            <View style={[styles.doneBanner, { backgroundColor: theme.primarySoft, borderColor: theme.gold }]}>
              <RubElHizb size={20} color={theme.gold} />
              <Text style={[styles.doneBannerText, { color: theme.primaryOnSoft }]}>
                أتممت أذكار «{group.title}» اليوم — تقبّل الله منك، واجعلها في ميزان حسناتها
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={{ alignItems: 'center', paddingTop: spacing.lg }}>
            <OrnamentDivider width={160} color={theme.ornament} />
            <Text style={[styles.footNote, { color: theme.textMuted }]}>
              الأذكار من «حصن المسلم» وقاعدة أذكار الصباح والمساء — تُعرض بنصّها الأصلي دون تعديل.
            </Text>
          </View>
        }
      />

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="إعادة ضبط التقدّم">
        <Text style={[styles.sheetBody, { color: theme.textSecondary }]}>
          سيتم تصفير عدّادات «{group.title}» لهذا اليوم فقط. لا يؤثر ذلك على العدّاد الكلي.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
          <Button
            title="إعادة الضبط"
            variant="danger"
            icon="refresh-outline"
            style={{ flex: 1 }}
            onPress={() => {
              resetAdhkarGroup(group.id);
              setSheet(false);
              toast.show('تم تصفير عدّادات اليوم', 'refresh-outline');
            }}
          />
          <Button title="إلغاء" variant="outline" style={{ flex: 1 }} onPress={() => setSheet(false)} />
        </View>
      </Sheet>
    </View>
  );
}

function DhikrCard({
  item,
  current,
  done,
  expanded,
  onToggleExpand,
  onInc,
  onDec,
  onComplete,
  onCopy,
  onShare,
}: {
  item: AdhkarItem;
  current: number;
  done: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onInc: () => void;
  onDec: () => void;
  onComplete: () => void;
  onCopy: () => void;
  onShare: () => void;
}) {
  const { theme } = useStore();
  const pulse = useRef(new Animated.Value(1)).current;

  const handleInc = () => {
    onInc();
    pulse.setValue(1.14);
    Animated.timing(pulse, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  const label = item.countLabel ?? defaultCountLabel(item.count);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: done ? theme.gold : theme.border,
          ...shadows.card(theme),
        },
      ]}
      accessibilityRole="summary"
    >
      {/* النص */}
      <Text style={[styles.text, { color: theme.text }]} selectable>
        {item.text}
      </Text>

      {/* الفضل والتخريج */}
      {item.virtue || item.reference ? (
        <Pressable onPress={onToggleExpand} hitSlop={6} accessibilityRole="button" accessibilityLabel="تفاصيل الذكر">
          <View style={styles.detailToggle}>
            <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={theme.textMuted} />
            <Text style={[styles.detailToggleText, { color: theme.textMuted }]}>
              {expanded ? 'إخفاء الفضل والتخريج' : 'الفضل والتخريج'}
            </Text>
          </View>
        </Pressable>
      ) : null}
      {expanded ? (
        <View style={[styles.detailBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          {item.virtue ? <Text style={[styles.detailText, { color: theme.textSecondary }]}>{item.virtue}</Text> : null}
          {item.reference ? (
            <Text style={[styles.detailRef, { color: theme.textMuted, marginTop: item.virtue ? 8 : 0 }]}>
              التخريج: {item.reference}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* العدّاد */}
      <View style={[styles.counterRow, { borderTopColor: theme.border }]}>
        <View style={[styles.countBadge, { backgroundColor: done ? theme.goldSoft : theme.primarySoft }]}>
          <Text style={[styles.countBadgeText, { color: done ? theme.goldDeep : theme.primary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <ScalePressable onPress={onDec} accessibilityLabel="إنقاص" delay={0.9}>
          <View style={[styles.roundBtn, { backgroundColor: theme.surfaceAlt }]}>
            <Icon name="remove" size={18} color={theme.textSecondary} />
          </View>
        </ScalePressable>

        <ScalePressable onPress={handleInc} accessibilityLabel="تسبيح — زيادة العدّاد" delay={0.88}>
          <Animated.View
            style={[
              styles.counterBubble,
              {
                backgroundColor: done ? theme.gold : theme.primary,
                transform: [{ scale: pulse }],
              },
            ]}
          >
            <Text style={[styles.counterValue, { color: done ? '#2A2110' : theme.textInverse }]}>
              {toArabicDigits(Math.min(current, item.count))}
            </Text>
            <Text style={[styles.counterTotal, { color: done ? 'rgba(42,33,16,0.7)' : 'rgba(255,255,255,0.75)' }]}>
              / {toArabicDigits(item.count)}
            </Text>
          </Animated.View>
        </ScalePressable>

        <ScalePressable onPress={onInc} accessibilityLabel="زيادة" delay={0.9}>
          <View style={[styles.roundBtn, { backgroundColor: theme.surfaceAlt }]}>
            <Icon name="add" size={18} color={theme.textSecondary} />
          </View>
        </ScalePressable>
      </View>

      {/* الإجراءات */}
      <View style={styles.actionsRow}>
        <ScalePressable onPress={onComplete} accessibilityLabel="تم" style={{ flex: 1 }} delay={0.96}>
          <View
            style={[
              styles.doneBtn,
              {
                backgroundColor: done ? theme.primarySoft : theme.primary,
                borderColor: done ? theme.gold : 'transparent',
              },
            ]}
          >
            <Icon name={done ? 'checkmark-done' : 'checkmark'} size={16} color={done ? theme.primary : theme.textInverse} />
            <Text style={[styles.doneBtnText, { color: done ? theme.primary : theme.textInverse }]}>
              {done ? 'تم بحمد الله' : 'تم'}
            </Text>
          </View>
        </ScalePressable>
        <IconButton name="copy-outline" size={17} onPress={onCopy} accessibilityLabel="نسخ الذكر" />
        <IconButton name="share-social-outline" size={17} onPress={onShare} accessibilityLabel="مشاركة الذكر" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingBottom: 8 },
  headerTitle: { fontFamily: fonts.uiBlack, fontSize: 18 },
  headerSub: { fontFamily: fonts.ui, fontSize: 11, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  progressText: { fontFamily: fonts.uiBlack, fontSize: 12.5 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  text: { fontFamily: fonts.naskh, fontSize: 19, lineHeight: 36, textAlign: 'justify', writingDirection: 'rtl' },
  detailToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, alignSelf: 'flex-start' },
  detailToggleText: { fontFamily: fonts.uiMedium, fontSize: 11.5 },
  detailBox: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginTop: spacing.sm },
  detailText: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 22 },
  detailRef: { fontFamily: fonts.ui, fontSize: 11.5, lineHeight: 19 },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  countBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, maxWidth: 130 },
  countBadgeText: { fontFamily: fonts.uiBold, fontSize: 11.5 },
  roundBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  counterBubble: {
    minWidth: 62,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 2,
  },
  counterValue: { fontFamily: fonts.uiBlack, fontSize: 18 },
  counterTotal: { fontFamily: fonts.uiBold, fontSize: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  doneBtnText: { fontFamily: fonts.uiBlack, fontSize: 14 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  doneBannerText: { flex: 1, fontFamily: fonts.uiBold, fontSize: 13, lineHeight: 22 },
  footNote: { fontFamily: fonts.ui, fontSize: 11.5, textAlign: 'center', lineHeight: 19, marginTop: spacing.md, paddingHorizontal: spacing.lg },
  sheetBody: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 24, textAlign: 'center' },
  missingTitle: { fontFamily: fonts.uiBlack, fontSize: 17 },
});
