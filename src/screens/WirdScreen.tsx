import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useStore, type WirdItem } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import {
  Button,
  Card,
  IconButton,
  ProgressBar,
  ProgressRing,
  ScalePressable,
  Screen,
  SectionHeader,
  Sheet,
  useToast,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { AppFooter } from '../components/AppFooter';
import { GeometricBackdrop, OrnamentDivider, RubElHizb } from '../components/Ornaments';
import { getGroup } from '../lib/adhkar';
import { getSurahMeta } from '../lib/quran';
import { toArabicDigits } from '../lib/arabic';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WirdScreen() {
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const {
    theme,
    settings,
    wird,
    wirdValue,
    incWird,
    setWirdEnabled,
    addCustomWird,
    removeWird,
    resetWirdToday,
    activeWirdsToday,
    dailyWird,
    streak,
    weekHistory,
    ayahsReadToday,
    duaToday,
  } = useStore();

  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('33');

  const bump = useCallback(() => {
    if (!settings.haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [settings.haptics]);

  const openWird = useCallback(
    (item: WirdItem) => {
      switch (item.type) {
        case 'adhkar':
          navigation.navigate('AdhkarGroup', { id: String(item.ref) });
          break;
        case 'surah':
          navigation.navigate('Surah', { sura: Number(item.ref) });
          break;
        case 'dua':
          navigation.navigate('Tabs', { screen: 'Dua' });
          break;
        case 'ayahs':
          navigation.navigate('Tabs', { screen: 'Quran' });
          break;
        default:
          break;
      }
    },
    [navigation]
  );

  const sorted = useMemo(() => {
    const order: Record<string, number> = { adhkar: 0, surah: 1, ayahs: 2, dua: 3, count: 4 };
    return [...wird.items].sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      const d = (order[a.type] ?? 9) - (order[b.type] ?? 9);
      return d !== 0 ? d : a.title.localeCompare(b.title, 'ar');
    });
  }, [wird.items]);

  return (
    <Screen pattern>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>وردي اليومي</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              خطة يومية محفوظة على جهازك — بلا حساب ولا تسجيل
            </Text>
          </View>
          <IconButton name="settings-outline" onPress={() => setManageOpen(true)} accessibilityLabel="إدارة الأوراد" />
        </View>

        {/* ------------------------------------------------------- حلقة الإنجاز */}
        <Card style={{ marginTop: spacing.lg, overflow: 'hidden' }}>
          <GeometricBackdrop opacity={0.05} size={64} />
          <View style={styles.ringRow}>
            <ProgressRing percent={dailyWird.percent} size={132} stroke={12} color={theme.gold}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.ringValue, { color: theme.text }]}>
                  {toArabicDigits(Math.round(dailyWird.percent))}٪
                </Text>
                <Text style={[styles.ringLabel, { color: theme.textMuted }]}>
                  {toArabicDigits(dailyWird.completed)}/{toArabicDigits(dailyWird.total)} وردًا
                </Text>
              </View>
            </ProgressRing>
            <View style={{ flex: 1, gap: spacing.md }}>
              <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                <Icon name="flame-outline" size={18} color={theme.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{toArabicDigits(streak)}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>أيام متتالية</Text>
                </View>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                <Icon name="reader-outline" size={18} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{toArabicDigits(ayahsReadToday)}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>آية قرأتها اليوم</Text>
                </View>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt }]}>
                <Icon name="heart-outline" size={18} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{toArabicDigits(duaToday)}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>دعوة لها اليوم</Text>
                </View>
              </View>
            </View>
          </View>

          {/* سجل الأسبوع */}
          <View style={[styles.weekRow, { borderTopColor: theme.border }]}>
            {weekHistory.map((d) => (
              <View key={d.key} style={styles.weekCell}>
                <View style={[styles.weekTrack, { backgroundColor: theme.surfaceAlt }]}>
                  <View
                    style={[
                      styles.weekFill,
                      {
                        height: `${Math.max(4, d.percent)}%`,
                        backgroundColor:
                          d.percent >= 100 ? theme.gold : d.percent > 0 ? theme.primary : theme.borderStrong,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.weekLabel,
                    { color: d.isToday ? theme.gold : theme.textMuted, fontFamily: d.isToday ? fonts.uiBlack : fonts.ui },
                  ]}
                >
                  {d.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* -------------------------------------------------------- الأوراد */}
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader
            title="أوراد اليوم"
            subtitle="اضغط على العدّاد لزيادة العدد، أو على الورد للانتقال إليه"
            icon="sparkles-outline"
            action="إدارة"
            onAction={() => setManageOpen(true)}
          />
        </View>

        <FlatList
          data={sorted}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const value = wirdValue(item);
            const done = value >= item.target;
            const percent = Math.min(100, (value / Math.max(1, item.target)) * 100);
            const surahMeta = item.type === 'surah' ? getSurahMeta(Number(item.ref)) : undefined;
            const group = item.type === 'adhkar' ? getGroup(String(item.ref)) : undefined;
            const subtitle =
              item.type === 'surah' && surahMeta
                ? `سورة ${surahMeta.name} · ${toArabicDigits(surahMeta.ayahs)} آية`
                : item.type === 'adhkar' && group
                ? `${toArabicDigits(group.items.length)} ذكرًا`
                : item.subtitle;

            return (
              <View
                style={[
                  styles.wirdCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: done ? theme.gold : theme.border,
                    opacity: item.enabled ? 1 : 0.55,
                    ...shadows.soft(theme),
                  },
                ]}
              >
                <View style={styles.wirdHead}>
                  <View
                    style={[
                      styles.wirdIcon,
                      { backgroundColor: done ? theme.goldSoft : theme.primarySoft },
                    ]}
                  >
                    <Icon name={done ? 'checkmark' : item.icon} size={18} color={done ? theme.goldDeep : theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.wirdTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.wirdSub, { color: theme.textMuted }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  </View>
                  {item.type !== 'count' ? (
                    <IconButton
                      name="chevron-back"
                      size={16}
                      onPress={() => openWird(item)}
                      accessibilityLabel={`الانتقال إلى ${item.title}`}
                    />
                  ) : null}
                </View>

                <View style={styles.wirdBody}>
                  <ProgressBar
                    percent={percent}
                    height={7}
                    color={done ? theme.gold : theme.primary}
                    style={{ flex: 1 }}
                  />
                  <Text style={[styles.wirdCount, { color: done ? theme.goldDeep : theme.textSecondary }]}>
                    {toArabicDigits(Math.min(value, item.target))}/{toArabicDigits(item.target)}
                  </Text>
                </View>

                {item.type === 'count' ? (
                  <View style={styles.wirdActions}>
                    <ScalePressable
                      onPress={() => {
                        bump();
                        incWird(item.id, 1);
                      }}
                      accessibilityLabel={`زيادة ${item.title}`}
                      delay={0.94}
                      style={{ flex: 1 }}
                    >
                      <View style={[styles.tapBtn, { backgroundColor: theme.primarySoft }]}>
                        <Icon name="add" size={16} color={theme.primary} />
                        <Text style={[styles.tapBtnText, { color: theme.primaryOnSoft }]}>+١</Text>
                      </View>
                    </ScalePressable>
                    <ScalePressable
                      onPress={() => {
                        bump();
                        incWird(item.id, 10);
                      }}
                      accessibilityLabel={`زيادة عشرة ${item.title}`}
                      delay={0.94}
                    >
                      <View style={[styles.tapBtn, { backgroundColor: theme.surfaceAlt }]}>
                        <Text style={[styles.tapBtnText, { color: theme.textSecondary }]}>+١٠</Text>
                      </View>
                    </ScalePressable>
                    <ScalePressable
                      onPress={() => {
                        bump();
                        incWird(item.id, -1);
                      }}
                      accessibilityLabel={`إنقاص ${item.title}`}
                      delay={0.94}
                    >
                      <View style={[styles.tapBtn, { backgroundColor: theme.surfaceAlt }]}>
                        <Icon name="remove" size={16} color={theme.textSecondary} />
                      </View>
                    </ScalePressable>
                  </View>
                ) : null}
              </View>
            );
          }}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <Button
            title="ورد جديد"
            icon="add-circle-outline"
            variant="soft"
            style={{ flex: 1 }}
            onPress={() => setAddOpen(true)}
          />
          <Button
            title="تصفير اليوم"
            icon="refresh-outline"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => {
              resetWirdToday();
              toast.show('تم تصفير عدّادات اليوم', 'refresh-outline');
            }}
          />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Card variant="alt">
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
              <RubElHizb size={20} color={theme.gold} />
              <Text style={[styles.intentText, { color: theme.textSecondary }]}>
                اللهم اجعل وردي هذا صدقةً جارية عن روح أمال محمود النهر، وتقبّله منّا بقبولٍ حسن.
              </Text>
            </View>
          </Card>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <AppFooter compact />
        </View>
      </ScrollView>

      {/* -------------------------------------------------- إضافة ورد مخصص */}
      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} title="إضافة ورد مخصص">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>اسم الورد</Text>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="مثال: سبحان الله وبحمده"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
            returnKeyType="next"
            accessibilityLabel="اسم الورد"
          />
          <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>
            العدد المستهدف يوميًا
          </Text>
          <TextInput
            value={newTarget}
            onChangeText={(t) => setNewTarget(t.replace(/[^0-9٠-٩]/g, ''))}
            placeholder="33"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
            returnKeyType="done"
            accessibilityLabel="العدد المستهدف"
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.sm }}>
            <Button
              title="إضافة"
              icon="add"
              style={{ flex: 1 }}
              onPress={() => {
                const target = Number(String(newTarget).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
                if (!newTitle.trim() || !Number.isFinite(target) || target < 1) {
                  toast.show('أدخل اسمًا وعددًا صحيحًا', 'alert-circle-outline');
                  return;
                }
                addCustomWird(newTitle, `ورد مخصص · ${toArabicDigits(target)} مرة`, target);
                setNewTitle('');
                setNewTarget('33');
                setAddOpen(false);
                toast.show('تمت إضافة الورد', 'checkmark-circle-outline');
              }}
            />
            <Button title="إلغاء" variant="outline" style={{ flex: 1 }} onPress={() => setAddOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Sheet>

      {/* ------------------------------------------------------ إدارة الأوراد */}
      <Sheet visible={manageOpen} onClose={() => setManageOpen(false)} title="إدارة الأوراد">
        <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
          <Text style={[styles.manageHint, { color: theme.textMuted }]}>
            فعّل أو عطّل الأوراد حسب قدرتك. الأوراد المدمجة لا يمكن حذفها، أما المخصصة فيمكن حذفها.
          </Text>
          {wird.items.map((item) => (
            <View
              key={item.id}
              style={[styles.manageRow, { borderBottomColor: theme.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.manageTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.manageSub, { color: theme.textMuted }]} numberOfLines={1}>
                  {item.builtin ? 'ورد مدمج' : 'ورد مخصص'} · الهدف {toArabicDigits(item.target)}
                </Text>
              </View>
              {!item.builtin ? (
                <IconButton
                  name="trash-outline"
                  size={17}
                  onPress={() => {
                    removeWird(item.id);
                    toast.show('تم حذف الورد', 'trash-outline');
                  }}
                  accessibilityLabel={`حذف ${item.title}`}
                />
              ) : null}
              <Switch
                value={item.enabled}
                onValueChange={(v) => setWirdEnabled(item.id, v)}
                trackColor={{ false: theme.borderStrong, true: theme.primarySoft }}
                thumbColor={item.enabled ? theme.primary : theme.surface}
                accessibilityLabel={`تفعيل ${item.title}`}
              />
            </View>
          ))}
          <OrnamentDivider width={150} color={theme.ornament} style={{ marginVertical: spacing.lg }} />
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.uiBlack, fontSize: 26 },
  subtitle: { fontFamily: fonts.ui, fontSize: 12.5, marginTop: 3 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringValue: { fontFamily: fonts.uiBlack, fontSize: 26 },
  ringLabel: { fontFamily: fonts.ui, fontSize: 11, marginTop: 2 },
  statBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8 },
  statValue: { fontFamily: fonts.uiBlack, fontSize: 15 },
  statLabel: { fontFamily: fonts.ui, fontSize: 11, marginTop: 1 },
  weekRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1 },
  weekCell: { flex: 1, alignItems: 'center', gap: 5 },
  weekTrack: { width: '100%', height: 54, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  weekFill: { width: '100%', borderRadius: 6 },
  weekLabel: { fontFamily: fonts.ui, fontSize: 10 },
  wirdCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.sm },
  wirdHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  wirdIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  wirdTitle: { fontFamily: fonts.uiBlack, fontSize: 14.5 },
  wirdSub: { fontFamily: fonts.ui, fontSize: 11.5, marginTop: 2 },
  wirdBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  wirdCount: { fontFamily: fonts.uiBlack, fontSize: 12.5 },
  wirdActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  tapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    minWidth: 46,
  },
  tapBtnText: { fontFamily: fonts.uiBlack, fontSize: 13 },
  intentText: { fontFamily: fonts.naskh, fontSize: 15.5, lineHeight: 28, textAlign: 'center' },
  fieldLabel: { fontFamily: fonts.uiBold, fontSize: 12.5, marginBottom: 6 },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontFamily: fonts.ui,
    fontSize: 14.5,
    textAlign: 'right',
    minHeight: 48,
  },
  manageHint: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 21, marginBottom: spacing.md, textAlign: 'center' },
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1 },
  manageTitle: { fontFamily: fonts.uiBold, fontSize: 13.5 },
  manageSub: { fontFamily: fonts.ui, fontSize: 11, marginTop: 2 },
});
