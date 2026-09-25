import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStore } from '../state/store';
import { fonts, radius, spacing } from '../theme';
import { OrnamentDivider, RubElHizb } from './Ornaments';

export const FOOTER_DUA =
  'اللهم ارحم أمال محمود النهر واغفر لها، واجعل هذا الموقع أثرًا طيبًا باقيًا ينتفع به الناس.';
export const FOOTER_REQUEST = 'نسألكم الدعاء لها بالرحمة والمغفرة';

/** تذييل موحّد يظهر في أسفل كل الصفحات */
export function AppFooter({ compact = false }: { compact?: boolean }) {
  const { theme } = useStore();
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
          borderRadius: radius.lg,
          paddingVertical: compact ? spacing.lg : spacing.xxl,
        },
      ]}
      accessibilityRole="text"
    >
      <RubElHizb size={20} color={theme.gold} />
      <Text style={[styles.dua, { color: theme.textSecondary, marginTop: spacing.md }]}>{FOOTER_DUA}</Text>
      <OrnamentDivider width={150} color={theme.ornament} style={{ marginVertical: spacing.md }} />
      <Text style={[styles.request, { color: theme.gold }]}>{FOOTER_REQUEST}</Text>
      <Text style={[styles.brand, { color: theme.textMuted, marginTop: spacing.lg }]}>
        أثر أمال · صدقة جارية · بلا إعلانات ولا تسجيل ولا اشتراكات
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  dua: { fontFamily: fonts.naskh, fontSize: 16.5, lineHeight: 30, textAlign: 'center' },
  request: { fontFamily: fonts.uiBold, fontSize: 14, textAlign: 'center' },
  brand: { fontFamily: fonts.ui, fontSize: 11.5, textAlign: 'center', lineHeight: 18 },
});
