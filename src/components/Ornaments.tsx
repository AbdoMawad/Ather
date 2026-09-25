import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Defs,
  Pattern,
  Text as SvgText,
} from 'react-native-svg';
import { useStore } from '../state/store';
import { toArabicDigits } from '../lib/arabic';

/**
 * زخارف إسلامية هندسية خفيفة مرسومة بـ SVG (أسلوب Minimal Islamic).
 * كل الألوان تأتي من الثيم الحالي.
 */

/** نجمة ثمانية (رُبع الحزب) */
export function RubElHizb({ size = 28, color }: { size?: number; color?: string }) {
  const { theme } = useStore();
  const c = color ?? theme.gold;
  const s = size;
  const k = s / 2;
  const q = s * 0.207;
  const star = [
    [k, 0],
    [s - q, q],
    [s, k],
    [s - q, s - q],
    [k, s],
    [q, s - q],
    [0, k],
    [q, q],
  ]
    .map((p) => p.join(','))
    .join(' ');
  const inner = s * 0.16;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Polygon points={star} fill="none" stroke={c} strokeWidth={Math.max(1, s * 0.045)} />
      <Rect
        x={inner}
        y={inner}
        width={s - inner * 2}
        height={s - inner * 2}
        fill="none"
        stroke={c}
        strokeWidth={Math.max(0.8, s * 0.03)}
        opacity={0.6}
        transform={`rotate(45 ${k} ${k})`}
      />
      <Circle cx={k} cy={k} r={s * 0.07} fill={c} opacity={0.85} />
    </Svg>
  );
}

/** شريط زخرفي فاصل */
export function OrnamentDivider({
  width = 220,
  color,
  style,
}: {
  width?: number;
  color?: string;
  style?: ViewStyle;
}) {
  const { theme } = useStore();
  const c = color ?? theme.ornament;
  const h = 18;
  const mid = width / 2;
  return (
    <View style={[styles.center, style]} pointerEvents="none">
      <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
        <Line x1={0} y1={h / 2} x2={mid - 26} y2={h / 2} stroke={c} strokeWidth={1} opacity={0.45} />
        <Line x1={mid + 26} y1={h / 2} x2={width} y2={h / 2} stroke={c} strokeWidth={1} opacity={0.45} />
        <G opacity={0.95}>
          <Path d={`M ${mid - 22} ${h / 2} q 8 -8 14 0 q -6 8 -14 0 Z`} fill="none" stroke={c} strokeWidth={1.1} />
          <Path d={`M ${mid + 22} ${h / 2} q -8 -8 -14 0 q 6 8 14 0 Z`} fill="none" stroke={c} strokeWidth={1.1} />
          <Polygon
            points={`${mid},${h / 2 - 7} ${mid + 7},${h / 2} ${mid},${h / 2 + 7} ${mid - 7},${h / 2}`}
            fill="none"
            stroke={c}
            strokeWidth={1.2}
          />
          <Circle cx={mid} cy={h / 2} r={1.8} fill={c} />
        </G>
      </Svg>
    </View>
  );
}

/** زخرفة زاوية */
export function CornerOrnament({
  size = 46,
  color,
  rotate = 0,
  style,
}: {
  size?: number;
  color?: string;
  rotate?: number;
  style?: ViewStyle;
}) {
  const { theme } = useStore();
  const c = color ?? theme.ornamentSoft;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" style={{ transform: [{ rotate: `${rotate}deg` }] }}>
        <Path d="M2 46 L2 14 Q2 2 14 2 L46 2" fill="none" stroke={c} strokeWidth={1.6} />
        <Path d="M9 46 L9 20 Q9 9 20 9 L46 9" fill="none" stroke={c} strokeWidth={1} opacity={0.55} />
        <Circle cx={14} cy={14} r={2.2} fill={c} opacity={0.8} />
      </Svg>
    </View>
  );
}

/** خلفية زخرفية هندسية خفيفة جدًا */
export function GeometricBackdrop({
  opacity = 0.05,
  color,
  size = 90,
  style,
}: {
  opacity?: number;
  color?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const { theme } = useStore();
  const c = color ?? theme.ornament;
  const id = `ig-${size}-${Math.round(opacity * 100)}`;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
            <Polygon
              points={`${size / 2},2 ${size - 2},${size / 2} ${size / 2},${size - 2} 2,${size / 2}`}
              fill="none"
              stroke={c}
              strokeWidth={1}
            />
            <Rect
              x={size * 0.22}
              y={size * 0.22}
              width={size * 0.56}
              height={size * 0.56}
              fill="none"
              stroke={c}
              strokeWidth={0.8}
            />
            <Circle cx={size / 2} cy={size / 2} r={size * 0.09} fill="none" stroke={c} strokeWidth={0.8} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * شارة رقم الآية داخل زخرفة.
 * الرقم تمثيل شكلي لرقم الآية (بيانات وصفية) — لا يمسّ نص الآية.
 */
export function AyahBadge({
  n,
  size = 34,
  color,
  active = false,
}: {
  n: number;
  size?: number;
  color?: string;
  active?: boolean;
}) {
  const { theme } = useStore();
  const c = color ?? theme.gold;
  const digits = toArabicDigits(n);
  const fontSize = digits.length > 2 ? size * 0.3 : size * 0.36;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Polygon
        points="20,2 24.5,7.5 31.5,6.5 33,13.5 39,17 36,23 39,29 33,32.5 31.5,39.5 24.5,38.5 20,38 15.5,38.5 8.5,39.5 7,32.5 1,29 4,23 1,17 7,13.5 8.5,6.5 15.5,7.5"
        fill={active ? c : 'transparent'}
        fillOpacity={active ? 0.14 : 0}
        stroke={c}
        strokeWidth={1}
        opacity={0.85}
      />
      <Circle cx={20} cy={20} r={14.5} fill="none" stroke={c} strokeWidth={0.7} opacity={0.4} />
      <SvgText
        x={20}
        y={20 + fontSize * 0.36}
        fontSize={fontSize}
        fill={c}
        textAnchor="middle"
        fontFamily="Tajawal-Bold"
      >
        {digits}
      </SvgText>
    </Svg>
  );
}

/** قوس إسلامي للعناوين */
export function ArchHeader({
  height = 90,
  color,
  children,
}: {
  height?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const { theme } = useStore();
  const c = color ?? theme.ornament;
  return (
    <View style={{ height }}>
      <Svg
        width="100%"
        height={height}
        viewBox="0 0 360 90"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Path d="M0 90 L0 46 Q0 8 180 8 Q360 8 360 46 L360 90" fill="none" stroke={c} strokeWidth={1.2} opacity={0.5} />
        <Path d="M14 90 L14 50 Q14 20 180 20 Q346 20 346 50 L346 90" fill="none" stroke={c} strokeWidth={0.8} opacity={0.28} />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

/** نجمة ثمانية كبيرة كعنصر خلفي ناعم */
export function StarWatermark({ size = 220, color, opacity = 0.08, style }: { size?: number; color?: string; opacity?: number; style?: ViewStyle }) {
  const { theme } = useStore();
  const c = color ?? theme.ornament;
  const s = size;
  const k = s / 2;
  const q = s * 0.207;
  const star = [
    [k, 0],
    [s - q, q],
    [s, k],
    [s - q, s - q],
    [k, s],
    [q, s - q],
    [0, k],
    [q, q],
  ]
    .map((p) => p.join(','))
    .join(' ');
  return (
    <View pointerEvents="none" style={[{ width: s, height: s, opacity }, style]}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Polygon points={star} fill="none" stroke={c} strokeWidth={1.4} />
        <Rect x={s * 0.146} y={s * 0.146} width={s * 0.707} height={s * 0.707} fill="none" stroke={c} strokeWidth={1.4} />
        <Rect
          x={s * 0.146}
          y={s * 0.146}
          width={s * 0.707}
          height={s * 0.707}
          fill="none"
          stroke={c}
          strokeWidth={1.4}
          transform={`rotate(45 ${k} ${k})`}
        />
        <Circle cx={k} cy={k} r={s * 0.2} fill="none" stroke={c} strokeWidth={1} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
