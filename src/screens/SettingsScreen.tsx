import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, type ThemeMode } from '../state/store';
import { QURAN_FONT_MAX, QURAN_FONT_MIN, fonts, radius, spacing } from '../theme';
import { Button, Card, IconButton, ProgressBar, ScalePressable, SegmentedControl, Sheet, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { OrnamentDivider, RubElHizb } from '../components/Ornaments';
import { QuranText } from '../components/QuranText';
import { getAyah } from '../lib/quran';
import { toArabicDigits } from '../lib/arabic';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { theme, settings, setSettings, resetEverything } = useStore();
  const [resetOpen, setResetOpen] = useState(false);

  const sample = getAyah(1, 5, settings.script);

  const confirmReset = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('حذف كل البيانات', 'سيتم حذف الإعدادات وآخر قراءة والعلامات وتقدّم الأذكار والورد. لا يمكن التراجع.', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: doReset },
      ]);
      return;
    }
    setResetOpen(true);
  };

  const doReset = async () => {
    await resetEverything();
    setResetOpen(false);
    toast.show('تم حذف كل البيانات المحفوظة', 'trash-outline');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <IconButton name="chevron-forward" onPress={() => navigation.goBack()} accessibilityLabel="رجوع" />
          <Text style={[styles.title, { color: theme.text }]}>الإعدادات</Text>
          <View style={{ width: 42 }} />
        </View>
        <OrnamentDivider width={170} color={theme.ornament} style={{ marginBottom: spacing.lg }} />

        {/* ------------------------------------------------------- المظهر */}
        <Group title="المظهر" icon="color-palette-outline">
          <Row label="السمة">
            <SegmentedControl<ThemeMode>
              value={settings.themeMode}
              onChange={(v) => setSettings({ themeMode: v })}
              options={[
                { value: 'system', label: 'النظام', icon: 'phone-portrait-outline' },
                { value: 'light', label: 'نهاري', icon: 'sunny-outline' },
                { value: 'dark', label: 'ليلي', icon: 'moon-outline' },
              ]}
              style={{ width: 250 }}
            />
          </Row>
        </Group>

        {/* ------------------------------------------------------- القرآن */}
        <Group title="عرض القرآن" icon="book-outline">
          <Row label="الرسم">
            <SegmentedControl<'uthmani' | 'simple'>
              value={settings.script}
              onChange={(v) => setSettings({ script: v })}
              options={[
                { value: 'uthmani', label: 'عثماني' },
                { value: 'simple', label: 'إملائي' },
              ]}
              style={{ width: 190 }}
            />
          </Row>
          <Row label="طريقة العرض">
            <SegmentedControl<'ayah' | 'continuous'>
              value={settings.readingMode}
              onChange={(v) => setSettings({ readingMode: v })}
              options={[
                { value: 'ayah', label: 'آية آية' },
                { value: 'continuous', label: 'متصل' },
              ]}
              style={{ width: 210 }}
            />
          </Row>
          <Row label={`حجم الخط القرآني · ${toArabicDigits(settings.quranFontSize)}`}>
            <View style={styles.fontRow}>
              <IconButton
                name="remove-circle-outline"
                size={22}
                accessibilityLabel="تصغير الخط"
                onPress={() => setSettings({ quranFontSize: Math.max(QURAN_FONT_MIN, settings.quranFontSize - 2) })}
              />
              <View style={{ flex: 1, paddingHorizontal: spacing.sm }}>
                <ProgressBar
                  percent={
                    ((settings.quranFontSize - QURAN_FONT_MIN) / (QURAN_FONT_MAX - QURAN_FONT_MIN)) * 100
                  }
                  height={6}
                  color={theme.primary}
                />
              </View>
              <IconButton
                name="add-circle-outline"
                size={22}
                accessibilityLabel="تكبير الخط"
                onPress={() => setSettings({ quranFontSize: Math.min(QURAN_FONT_MAX, settings.quranFontSize + 2) })}
              />
            </View>
          </Row>
          {sample ? (
            <View style={[styles.preview, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[styles.previewLabel, { color: theme.textMuted }]}>معاينة</Text>
              <QuranText text={sample.text} size={settings.quranFontSize} script={settings.script} selectable={false} />
            </View>
          ) : null}
        </Group>

        {/* ------------------------------------------------------- التفاعل */}
        <Group title="التفاعل" icon="pulse-outline">
          <SwitchRow
            label="الاهتزاز الخفيف عند العدّ"
            value={settings.haptics}
            onChange={(v) => setSettings({ haptics: v })}
          />
        </Group>

        {/* ------------------------------------------------------- الخصوصية */}
        <Group title="الخصوصية والبيانات" icon="shield-checkmark-outline">
          <View style={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <Bullet text="لا يوجد تسجيل حساب ولا بريد إلكتروني ولا أي بيانات شخصية." />
            <Bullet text="لا إعلانات ولا اشتراكات ولا مدفوعات — الموقع صدقة جارية بالكامل." />
            <Bullet text="كل ما تحفظه (الإعدادات، آخر قراءة، العلامات، تقدّم الأذكار والورد) يبقى على جهازك فقط." />
            <Bullet text="يعمل دون اتصال بعد التحميل الأول، لأن نص القرآن والأذكار مضمّنان داخل التطبيق." />
            <Bullet text="يمكنك تثبيته كتطبيق (PWA) من قائمة المتصفح: «إضافة إلى الشاشة الرئيسية»." />
          </View>
        </Group>

        {/* ------------------------------------------------------- روابط */}
        <Group title="عن التطبيق" icon="information-circle-outline">
          <LinkRow icon="document-text-outline" label="المصادر وشروط استخدام النص القرآني" onPress={() => navigation.navigate('About')} />
          <LinkRow icon="bookmark-outline" label="العلامات المرجعية" onPress={() => navigation.navigate('Bookmarks')} />
          <LinkRow icon="search-outline" label="البحث في القرآن" onPress={() => navigation.navigate('Search')} />
        </Group>

        <View style={{ marginTop: spacing.xl }}>
          <Button title="حذف كل البيانات المحفوظة" icon="trash-outline" variant="danger" onPress={confirmReset} />
        </View>

        <View style={{ alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm }}>
          <RubElHizb size={22} color={theme.gold} />
          <Text style={[styles.version, { color: theme.textMuted }]}>أثر أمال · الإصدار ١٫٠٫٠</Text>
          <Text style={[styles.version, { color: theme.textMuted }]}>صدقة جارية عن روح أمال محمود النهر</Text>
        </View>
      </ScrollView>

      <Sheet visible={resetOpen} onClose={() => setResetOpen(false)} title="حذف كل البيانات">
        <Text style={[styles.sheetBody, { color: theme.textSecondary }]}>
          سيتم حذف الإعدادات وآخر موضع قراءة والعلامات المرجعية وتقدّم الأذكار والورد اليومي وعدّاد الدعوات. لا يمكن
          التراجع عن هذا الإجراء.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.sm }}>
          <Button title="حذف" variant="danger" icon="trash-outline" style={{ flex: 1 }} onPress={doReset} />
          <Button title="إلغاء" variant="outline" style={{ flex: 1 }} onPress={() => setResetOpen(false)} />
        </View>
      </Sheet>
    </View>
  );
}

function Group({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const { theme } = useStore();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={styles.groupHead}>
        <Icon name={icon} size={15} color={theme.primary} />
        <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>{title}</Text>
      </View>
      <Card style={{ paddingVertical: spacing.xs, paddingHorizontal: 0 }}>{children}</Card>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const { theme } = useStore();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {children}
    </View>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { theme } = useStore();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.rowLabel, { color: theme.text, flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.borderStrong, true: theme.primarySoft }}
        thumbColor={value ? theme.primary : theme.surface}
        accessibilityLabel={label}
      />
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  const { theme } = useStore();
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <View style={[styles.bulletDot, { backgroundColor: theme.gold, marginTop: 7 }]} />
      <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { theme } = useStore();
  return (
    <ScalePressable onPress={onPress} accessibilityLabel={label} delay={0.97}>
      <View style={[styles.linkRow, { borderBottomColor: theme.border }]}>
        <Icon name={icon} size={17} color={theme.primary} />
        <Text style={[styles.linkLabel, { color: theme.text }]}>{label}</Text>
        <Icon name="chevron-back" size={15} color={theme.textMuted} />
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontFamily: fonts.uiBlack, fontSize: 20, flex: 1, textAlign: 'center' },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm, paddingHorizontal: 4 },
  groupTitle: { fontFamily: fonts.uiBlack, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
  },
  rowLabel: { fontFamily: fonts.uiMedium, fontSize: 13.5 },
  fontRow: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 200 },
  preview: { margin: spacing.md, borderRadius: radius.md, borderWidth: 1, padding: spacing.lg },
  previewLabel: { fontFamily: fonts.ui, fontSize: 11, marginBottom: spacing.sm },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  linkLabel: { fontFamily: fonts.uiMedium, fontSize: 13.5, flex: 1 },
  bulletDot: { width: 5, height: 5, borderRadius: 3 },
  bulletText: { fontFamily: fonts.ui, fontSize: 12.5, lineHeight: 21, flex: 1 },
  version: { fontFamily: fonts.ui, fontSize: 11.5, textAlign: 'center' },
  sheetBody: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 24, textAlign: 'center' },
});
