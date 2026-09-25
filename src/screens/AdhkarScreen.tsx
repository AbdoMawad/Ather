import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import { Card, ProgressRing, ScalePressable, Screen, SectionHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { GeometricBackdrop, OrnamentDivider, RubElHizb } from '../components/Ornaments';
import { ADHKAR_GROUPS, totalAdhkarItems } from '../lib/adhkar';
import { toArabicDigits } from '../lib/arabic';
import { AppFooter } from '../components/AppFooter';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AdhkarScreen() {
  const { theme, groupProgress, adhkarLifetime } = useStore();
  const navigation = useNavigation<Nav>();

  const overall = useMemo(() => {
    let done = 0;
    const total = totalAdhkarItems();
    for (const g of ADHKAR_GROUPS) done += groupProgress(g.id).done;
    return { done, total, percent: total ? (done / total) * 100 : 0 };
  }, [groupProgress]);

  const lifetime = useMemo(() => Object.values(adhkarLifetime).reduce((s, n) => s + n, 0), [adhkarLifetime]);

  return (
    <Screen pattern>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>الأذكار</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {toArabicDigits(ADHKAR_GROUPS.length)} مجموعة · {toArabicDigits(overall.total)} ذكرًا
            </Text>
          </View>
          <View style={[styles.lifetimePill, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Icon name="infinite-outline" size={14} color={theme.gold} />
            <Text style={[styles.lifetimeText, { color: theme.textSecondary }]}>
              {toArabicDigits(lifetime)} ذكرًا كليًا
            </Text>
          </View>
        </View>

        {/* ملخّص اليوم */}
        <Card style={{ marginTop: spacing.lg, overflow: 'hidden' }}>
          <GeometricBackdrop opacity={0.05} size={70} />
          <View style={styles.summaryRow}>
            <ProgressRing percent={overall.percent} size={92} stroke={9}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.ringValue, { color: theme.text }]}>
                  {toArabicDigits(Math.round(overall.percent))}٪
                </Text>
                <Text style={[styles.ringLabel, { color: theme.textMuted }]}>اليوم</Text>
              </View>
            </ProgressRing>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>تقدّمك في أذكار اليوم</Text>
              <Text style={[styles.summaryBody, { color: theme.textSecondary }]}>
                أتممت {toArabicDigits(overall.done)} من {toArabicDigits(overall.total)} ذكرًا. التقدّم يُحفظ على جهازك
                ويُعاد ضبطه كل يوم تلقائيًا.
              </Text>
              <OrnamentDivider width={150} color={theme.ornament} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            </View>
          </View>
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="مجموعات الأذكار" subtitle="اختر مجموعة وابدأ الذكر مع العدّاد" icon="leaf-outline" />
        </View>

        <View style={styles.grid}>
          {ADHKAR_GROUPS.map((g) => {
            const p = groupProgress(g.id);
            const complete = p.total > 0 && p.done >= p.total;
            return (
              <ScalePressable
                key={g.id}
                onPress={() => navigation.navigate('AdhkarGroup', { id: g.id })}
                accessibilityLabel={`${g.title} — ${toArabicDigits(p.done)} من ${toArabicDigits(p.total)}`}
                style={{ flexBasis: '47%', flexGrow: 1 }}
              >
                <View
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: complete ? theme.gold : theme.border,
                      ...shadows.card(theme),
                    },
                  ]}
                >
                  <View style={styles.groupHead}>
                    <View
                      style={[
                        styles.groupIcon,
                        { backgroundColor: complete ? theme.goldSoft : theme.primarySoft },
                      ]}
                    >
                      <Icon name={g.icon} size={20} color={complete ? theme.goldDeep : theme.primary} />
                    </View>
                    {complete ? (
                      <View style={[styles.donePill, { backgroundColor: theme.primarySoft }]}>
                        <Icon name="checkmark-done" size={12} color={theme.primary} />
                        <Text style={[styles.doneText, { color: theme.primary }]}>تم</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.groupTitle, { color: theme.text }]} numberOfLines={2}>
                    {g.title}
                  </Text>
                  <Text style={[styles.groupHint, { color: theme.textMuted }]} numberOfLines={2}>
                    {g.hint}
                  </Text>
                  <View style={styles.groupFoot}>
                    <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
                      <View
                        style={[
                          styles.fill,
                          {
                            width: `${p.percent}%`,
                            backgroundColor: complete ? theme.gold : theme.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.groupCount, { color: theme.textMuted }]}>
                      {toArabicDigits(p.done)}/{toArabicDigits(p.total)}
                    </Text>
                  </View>
                </View>
              </ScalePressable>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Card variant="alt">
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <RubElHizb size={20} color={theme.gold} />
              <Text style={[styles.noteTitle, { color: theme.text }]}>نية الذكر</Text>
              <Text style={[styles.noteBody, { color: theme.textSecondary }]}>
                اجعل ذكرَك هنا صدقةً جارية عن روح أمال محمود النهر — اللهم تقبّل منها ومنّا، واجعلها في ميزان حسناتها.
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

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.uiBlack, fontSize: 26 },
  subtitle: { fontFamily: fonts.ui, fontSize: 12.5, marginTop: 3 },
  lifetimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  lifetimeText: { fontFamily: fonts.uiBold, fontSize: 11.5 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringValue: { fontFamily: fonts.uiBlack, fontSize: 19 },
  ringLabel: { fontFamily: fonts.ui, fontSize: 10.5 },
  summaryTitle: { fontFamily: fonts.uiBlack, fontSize: 15.5 },
  summaryBody: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  groupCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 158,
    justifyContent: 'space-between',
  },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  donePill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  doneText: { fontFamily: fonts.uiBlack, fontSize: 10.5 },
  groupTitle: { fontFamily: fonts.uiBlack, fontSize: 15, marginTop: spacing.md },
  groupHint: { fontFamily: fonts.ui, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
  groupFoot: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  groupCount: { fontFamily: fonts.uiBold, fontSize: 11.5 },
  noteTitle: { fontFamily: fonts.uiBlack, fontSize: 15 },
  noteBody: { fontFamily: fonts.naskh, fontSize: 15, lineHeight: 27, textAlign: 'center' },
});
