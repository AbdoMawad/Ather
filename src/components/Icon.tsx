import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/**
 * مكوّن أيقونات موحّد.
 * معظم الأسماء من Ionicons، وبعض الأسماء الخاصة (مثل mosque) من MaterialCommunityIcons.
 */
const MCI_NAMES = new Set([
  'mosque',
  'star-crescent',
  'book-open-page-variant',
  'prayer',
  'hand-prayer',
  'abacus',
  'calendar-star',
]);

export interface IconProps {
  name: string;
  size?: number;
  color: string;
  style?: any;
  accessibilityLabel?: string;
}

export function Icon({ name, size = 22, color, style, accessibilityLabel }: IconProps) {
  if (MCI_NAMES.has(name)) {
    return (
      <MaterialCommunityIcons
        name={name as any}
        size={size}
        color={color}
        style={style}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }
  return (
    <Ionicons
      name={name as any}
      size={size}
      color={color}
      style={style}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export default Icon;
