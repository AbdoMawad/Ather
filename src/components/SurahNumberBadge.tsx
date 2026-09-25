import React from 'react';
import Svg, { Circle, Polygon, Text as SvgText } from 'react-native-svg';
import { useStore } from '../state/store';
import { toArabicDigits } from '../lib/arabic';

/** رقم السورة داخل نجمة ثمانية (زخرفة مصحفية) */
export function SurahNumberBadge({
  n,
  size = 44,
  color,
  filled = false,
}: {
  n: number;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  const { theme } = useStore();
  const c = color ?? theme.gold;
  const digits = toArabicDigits(n);
  const fs = digits.length > 2 ? size * 0.28 : size * 0.34;
  const k = size / 2;
  const q = size * 0.207;
  const star = [
    [k, 0.5],
    [size - q, q],
    [size - 0.5, k],
    [size - q, size - q],
    [k, size - 0.5],
    [q, size - q],
    [0.5, k],
    [q, q],
  ]
    .map((p) => p.join(','))
    .join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon
        points={star}
        fill={filled ? c : 'transparent'}
        fillOpacity={filled ? 0.14 : 0}
        stroke={c}
        strokeWidth={1.1}
        opacity={0.9}
      />
      <Circle cx={k} cy={k} r={size * 0.31} fill="none" stroke={c} strokeWidth={0.6} opacity={0.4} />
      <SvgText
        x={k}
        y={k + fs * 0.36}
        fontSize={fs}
        fill={c}
        textAnchor="middle"
        fontFamily="Tajawal-Bold"
      >
        {digits}
      </SvgText>
    </Svg>
  );
}
