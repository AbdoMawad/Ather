import React from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';
import { useStore } from '../state/store';
import { fonts } from '../theme';
import type { QuranScript } from '../lib/quran';

/**
 * عرض نص القرآن الكريم.
 *
 * ⚠️ هذا المكوّن يعرض النص **كما هو تمامًا** من ملف Tanzil.
 * لا يتم تطبيق أي تطبيع أو تصحيح أو تعديل على الحروف أو الحركات.
 * التطبيع الموجود في `lib/arabic.ts` يُستخدم للبحث فقط، والنص المعروض
 * هنا هو دائمًا `text` الأصلي.
 */

export function quranFont(script: QuranScript): string {
  return script === 'simple' ? fonts.quranSimple : fonts.quranUthmani;
}

export interface QuranTextProps {
  /** النص الأصلي حرفيًا */
  text: string;
  size: number;
  script: QuranScript;
  color?: string;
  style?: StyleProp<TextStyle>;
  selectable?: boolean;
  onPress?: () => void;
  /** فترات التظليل على النص الأصلي (نتائج البحث) */
  highlights?: Array<{ start: number; end: number }>;
  highlightColor?: string;
  highlightBg?: string;
}

export function QuranText({
  text,
  size,
  script,
  color,
  style,
  selectable = true,
  onPress,
  highlights,
  highlightColor,
  highlightBg,
}: QuranTextProps) {
  const { theme } = useStore();
  const fg = color ?? theme.text;
  const base: TextStyle = {
    fontFamily: quranFont(script),
    fontSize: size,
    lineHeight: Math.round(size * 2.05),
    color: fg,
    textAlign: 'justify',
    writingDirection: 'rtl',
  };

  const parts: React.ReactNode[] = [];
  if (highlights && highlights.length > 0) {
    let cursor = 0;
    highlights.forEach((h, i) => {
      const start = Math.max(cursor, Math.min(h.start, text.length));
      const end = Math.max(start, Math.min(h.end, text.length));
      if (start > cursor) parts.push(text.slice(cursor, start));
      if (end > start) {
        parts.push(
          <Text
            key={`h${i}`}
            style={{
              color: highlightColor ?? theme.primaryStrong,
              backgroundColor: highlightBg ?? theme.goldSoft,
              borderRadius: 4,
            }}
          >
            {text.slice(start, end)}
          </Text>
        );
      }
      cursor = end;
    });
    if (cursor < text.length) parts.push(text.slice(cursor));
  }

  return (
    <Text
      style={[base, style]}
      selectable={selectable}
      onPress={onPress}
      accessibilityRole="text"
      suppressHighlighting
    >
      {parts.length > 0 ? parts : text}
    </Text>
  );
}

/** سطر مرجع السورة/الآية */
export function AyahRefLabel({
  suraName,
  sura,
  ayah,
  style,
}: {
  suraName: string;
  sura: number;
  ayah: number;
  style?: StyleProp<TextStyle>;
}) {
  const { theme } = useStore();
  return (
    <Text style={[{ fontFamily: fonts.uiBold, fontSize: 12.5, color: theme.textMuted }, style]}>
      {suraName} · آية {ayah}
    </Text>
  );
}

/** تنبيه يوضّح أن أرقام الآيات إضافة عرضية وليست جزءًا من النص */
export function MarkupNote({ children }: { children: React.ReactNode }) {
  const { theme } = useStore();
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
      <Text style={{ fontFamily: fonts.ui, fontSize: 12, color: theme.textMuted, lineHeight: 19, flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}
