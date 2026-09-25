import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import { Card, IconButton, ProgressRing, ScalePressable, Screen, SectionHeader } from '../components/ui';
import { AppFooter } from '../components/AppFooter';
import { CornerOrnament, GeometricBackdrop, OrnamentDivider, RubElHizb, StarWatermark } from '../components/Ornaments';
import { Icon } from '../components/Icon';
import { ADHKAR_GROUPS } from '../lib/adhkar';
import { getSurahMeta } from '../lib/quran';
import { gregorianLabel, hijriLabel, timeGreeting } from '../lib/date';
import { toArabicDigits } from '../lib/arabic';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const HOME_DUA =
  'اللهم اجعل هذا العمل نورًا لها، وارحمها واغفر لها، واجعل كل حرف يُقرأ وكل ذكر يُقال هنا في ميزان حسناتها.';

export default function HomeScreen() {
  const { theme, settings, lastRead, dailyWird, streak, groupProgress, duaTotal, ayahsReadToday } = useStore();
  const navigation = useNavigation<Nav>();

  const hijri = useMemo(() => hijriLabel(), []);
  const greg = useMemo(() => gregorianLabel(), []);

  const morning = groupProgress('morning');
  const evening = groupProgress('evening');
  const afterPrayer = groupProgress('after-prayer');

  const lastSurah = lastRead ? getSurahMeta(lastRead.sura) : undefined;
  const isDarkHero = theme.name === 'dark';

  const sections = [
    {
      key: 'quran',
      title: 'القرآن الكريم',
      desc: '١١٤ سورة · بحث · علامات',
      icon: 'book',
      onPress: () => navigation.navigate('Tabs', { screen: 'Quran' }),
      tint: theme.primary,
    },
    {
      key: 'adhkar',
      title: 'الأذكار',
      desc: `${ADHKAR_GROUPS.length} مجموعة · عدّاد وتقدّم`,
      icon: 'leaf',
      onPress: () => navigation.navigate('Tabs', { screen: 'Adhkar' }),
      tint: theme.gold,
    },
    {
      key: 'dua',
      title: 'الدعاء لها',
      desc: 'أدعية للميت من السنة والقرآن',
      icon: 'heart',
      onPress: () => navigation.navigate('Tabs', { screen: 'Dua' }),
      tint: theme.primary,
    },
    {
      key: 'wird',
      title: 'وردي اليومي',
      desc: 'خطة يومية وحفظ التقدّم',
      icon: 'calendar',
      onPress: () => navigation.navigate('Tabs', { screen: 'Wird' }),
      tint: theme.gold,
    },
  ];

  return (
    <Screen pattern>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      >
        {/* ---------------------------------------------------------- الترويسة */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: theme.textMuted }]}>{timeGreeting()}</Text>
              <Text style={[styles.dateLine, { color: theme.textSecondary }]}>
                {hijri ? hijri + ' · ' : ''}
                {greg}
              </Text>
            </View>
            <IconButton
              name="settings-outline"
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="الإعدادات"
            />
          </View>
        </View>

        {/* ------------------------------------------------------- البطاقة الرئيسية */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <View
            style={[
              styles.hero,
              {
                borderRadius: radius.xl,
                borderColor: theme.gold,
                ...shadows.lift(theme),
              },
            ]}
          >
            <LinearGradient
              colors={
                isDarkHero
                  ? ['#13271E', '#0C1512', '#101C17']
                  : ['#1F6B4C', '#123F2D', '#0E3324']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <GeometricBackdrop opacity={0.1} color="#C6A15B" size={78} />
            <CornerOrnament size={54} color="rgba(198,161,91,0.55)" style={{ top: 10, right: 10 }} />
            <CornerOrnament size={54} color="rgba(198,161,91,0.55)" rotate={180} style={{ bottom: 10, left: 10 }} />
            <StarWatermark
              size={190}
              color="#C6A15B"
              opacity={0.09}
              style={{ position: 'absolute', top: -40, left: -50 }}
            />

            <View style={styles.heroInner}>
              <RubElHizb size={30} color="#D9BC7C" />
              <Text style={[styles.heroTitle, { color: '#FBF6E9' }]} accessibilityRole="header">
                أثر أمال
              </Text>
              <Text style={[styles.heroSubtitle, { color: '#E3D6B6' }]}>صدقة جارية عن روح أمال محمود النهر</Text>
              <OrnamentDivider width={210} color="#C6A15B" style={{ marginVertical: spacing.lg }} />
              <Text style={[styles.heroDua, { color: 'rgba(251,246,233,0.93)' }]}>{HOME_DUA}</Text>
              <Text style={[styles.heroMercy, { color: '#D9BC7C' }]}>رحمها الله وغفر لها</Text>
            </View>
          </View>
        </View>

        {/* --------------------------------------------------------- أكمل القراءة */}
        {lastRead && lastSurah ? (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <Card
              onPress={() => navigation.navigate('Surah', { sura: lastRead.sura, ayah: lastRead.ayah })}
              style={{ paddingVertical: spacing.md }}
              accessibilityLabel={`متابعة القراءة: سورة ${lastSurah.name}`}
            >
              <View style={styles.row}>
                <View style={[styles.iconTile, { backgroundColor: theme.primarySoft }]}>
                  <Icon name="book-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.smallLabel, { color: theme.textMuted }]}>آخر موضع قراءة</Text>
                  <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                    سورة {lastSurah.name} · الآية {toArabicDigits(lastRead.ayah)}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: theme.goldSoft }]}>
                  <Text style={[styles.pillText, { color: theme.goldDeep }]}>
                    {toArabicDigits(Math.round(lastRead.percent))}٪
                  </Text>
                </View>
                <Icon name="chevron-back" size={18} color={theme.textMuted} />
              </View>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <Card
              onPress={() => navigation.navigate('Surah', { sura: 1 })}
              style={{ paddingVertical: spacing.md }}
              accessibilityLabel="ابدأ القراءة من سورة الفاتحة"
            >
              <View style={styles.row}>
                <View style={[styles.iconTile, { backgroundColor: theme.primarySoft }]}>
                  <Icon name="play-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.smallLabel, { color: theme.textMuted }]}>ابدأ القراءة</Text>
                  <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                    سورة الفاتحة
                  </Text>
                </View>
                <Icon name="chevron-back" size={18} color={theme.textMuted} />
              </View>
            </Card>
          </View>
        )}

        {/* ------------------------------------------------------------ الأقسام */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <SectionHeader title="أقسام الموقع" subtitle="اقرأ واذكر وادعُ — كل شيء محفوظ على جهازك" icon="apps-outline" />
          <View style={styles.grid}>
            {sections.map((s) => (
              <ScalePressable
                key={s.key}
                onPress={s.onPress}
                style={{ flex: 1, flexBasis: '47%' }}
                accessibilityLabel={s.title}
              >
                <View
                  style={[
                    styles.sectionCard,
                    { backgroundColor: theme.surface, borderColor: theme.border, ...shadows.card(theme) },
                  ]}
                >
                  <View style={[styles.sectionIconBig, { backgroundColor: theme.surfaceAlt }]}>
                    <Icon name={s.icon} size={24} color={s.tint} />
                  </View>
                  <Text style={[styles.sectionCardTitle, { color: theme.text }]}>{s.title}</Text>
                  <Text style={[styles.sectionCardDesc, { color: theme.textMuted }]} numberOfLines={2}>
                    {s.desc}
                  </Text>
                </View>
              </ScalePressable>
            ))}
          </View>
        </View>

        {/* --------------------------------------------------------- ورد اليوم */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <SectionHeader
            title="وردي اليوم"
            subtitle={streak > 0 ? `سلسلة ${toArabicDigits(streak)} يوم متتالٍ` : 'ابدأ اليوم وكن ثابتًا'}
            icon="sparkles-outline"
            action="التفاصيل"
            onAction={() => navigation.navigate('Tabs', { screen: 'Wird' })}
          />
          <Card>
            <View style={styles.wirdRow}>
              <ProgressRing percent={dailyWird.percent} size={104} stroke={10}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.ringBig, { color: theme.text }]}>
                    {toArabicDigits(Math.round(dailyWird.percent))}٪
                  </Text>
                  <Text style={[styles.ringSmall, { color: theme.textMuted }]}>إنجاز اليوم</Text>
                </View>
              </ProgressRing>
              <View style={{ flex: 1, gap: spacing.md }}>
                <StatRow
                  icon="reader-outline"
                  label="آيات قرأتها اليوم"
                  value={toArabicDigits(ayahsReadToday)}
                  color={theme.primary}
                />
                <StatRow
                  icon="sunny-outline"
                  label="أذكار الصباح"
                  value={`${toArabicDigits(morning.done)}/${toArabicDigits(morning.total)}`}
                  color={theme.gold}
                />
                <StatRow
                  icon="moon-outline"
                  label="أذكار المساء"
                  value={`${toArabicDigits(evening.done)}/${toArabicDigits(evening.total)}`}
                  color={theme.primary}
                />
                <StatRow
                  icon="mosque"
                  label="أذكار بعد الصلاة"
                  value={`${toArabicDigits(afterPrayer.done)}/${toArabicDigits(afterPrayer.total)}`}
                  color={theme.gold}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* ------------------------------------------------------- الدعاء لها */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Card
            variant="gold"
            onPress={() => navigation.navigate('Tabs', { screen: 'Dua' })}
            accessibilityLabel="الدعاء لها"
          >
            <View style={styles.row}>
              <View style={[styles.iconTile, { backgroundColor: theme.surface }]}>
                <Icon name="heart" size={20} color={theme.goldDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>الدعاء لها</Text>
                <Text style={[styles.smallLabel, { color: theme.textSecondary }]} numberOfLines={2}>
                  {duaTotal > 0
                    ? `دعوت لها ${toArabicDigits(duaTotal)} مرة — جزاك الله خيرًا`
                    : 'أدعية للميت من السنة والقرآن الكريم'}
                </Text>
              </View>
              <Icon name="chevron-back" size={18} color={theme.goldDeep} />
            </View>
          </Card>
        </View>

        <View style={{ marginTop: spacing.xxl }}>
          <AppFooter />
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const { theme } = useStore();
  return (
    <View style={styles.statRow}>
      <Icon name={icon} size={15} color={color} />
      <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  greeting: { fontFamily: fonts.uiBold, fontSize: 15 },
  dateLine: { fontFamily: fonts.ui, fontSize: 12.5, marginTop: 3 },
  hero: {
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 260,
  },
  heroInner: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  heroTitle: { fontFamily: fonts.display, fontSize: 42, letterSpacing: 1, textAlign: 'center' },
  heroSubtitle: { fontFamily: fonts.uiMedium, fontSize: 14.5, textAlign: 'center', marginTop: 6, lineHeight: 22 },
  heroDua: {
    fontFamily: fonts.naskh,
    fontSize: 17,
    lineHeight: 32,
    textAlign: 'center',
    maxWidth: 460,
  },
  heroMercy: { fontFamily: fonts.uiBold, fontSize: 13, marginTop: spacing.lg, letterSpacing: 0.3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLabel: { fontFamily: fonts.ui, fontSize: 12, marginTop: 2 },
  rowTitle: { fontFamily: fonts.uiBlack, fontSize: 15.5 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontFamily: fonts.uiBold, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  sectionCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    minHeight: 132,
    justifyContent: 'flex-start',
    gap: 6,
  },
  sectionIconBig: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sectionCardTitle: { fontFamily: fonts.uiBlack, fontSize: 15.5 },
  sectionCardDesc: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 18 },
  wirdRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringBig: { fontFamily: fonts.uiBlack, fontSize: 20 },
  ringSmall: { fontFamily: fonts.ui, fontSize: 10.5, marginTop: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { fontFamily: fonts.ui, fontSize: 12.5, flex: 1 },
  statValue: { fontFamily: fonts.uiBlack, fontSize: 13 },
});
