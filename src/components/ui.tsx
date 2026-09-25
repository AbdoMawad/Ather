import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../state/store';
import { fonts, radius, shadows, spacing } from '../theme';
import { Icon } from './Icon';
import { GeometricBackdrop, OrnamentDivider, RubElHizb } from './Ornaments';

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

interface ToastCtx {
  show: (message: string, icon?: string) => void;
}
const ToastContext = createContext<ToastCtx>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const [icon, setIcon] = useState<string>('checkmark-circle');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, icn = 'checkmark-circle') => {
      setMsg(message);
      setIcon(icn);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 90 }),
      ]).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 24, duration: 240, useNativeDriver: true }),
        ]).start(() => setMsg(null));
      }, 2100);
    },
    [opacity, translateY]
  );

  const insets = useSafeAreaInsets();
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {msg ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastWrap,
            { bottom: insets.bottom + 96, opacity, transform: [{ translateY }] },
          ]}
        >
          <View
            style={[
              styles.toast,
              {
                backgroundColor: theme.name === 'dark' ? '#22332B' : theme.primaryStrong,
                borderColor: theme.gold,
              },
            ]}
          >
            <Icon name={icon} size={18} color={theme.gold} />
            <Text style={[styles.toastText, { color: '#FBF9F4' }]} numberOfLines={2}>
              {msg}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function Screen({
  children,
  style,
  pattern = false,
  edges = ['top', 'left', 'right'],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pattern?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const { theme } = useStore();
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };
  return (
    <View style={[{ flex: 1, backgroundColor: theme.bg }, pad, style]}>
      {pattern ? <GeometricBackdrop opacity={theme.name === 'dark' ? 0.05 : 0.045} /> : null}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pressable with scale micro-interaction
// ---------------------------------------------------------------------------

export function ScalePressable({
  children,
  onPress,
  onLongPress,
  style,
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
  delay = 0.97,
}: {
  children: React.ReactNode | ((pressed: boolean) => React.ReactNode);
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
  delay?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: delay, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [pressed && Platform.OS !== 'web' ? { opacity: 0.92 } : null]}
      >
        {typeof children === 'function' ? children(false) : children}
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function Card({
  children,
  style,
  onPress,
  onLongPress,
  variant = 'surface',
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'surface' | 'alt' | 'primary' | 'gold';
  accessibilityLabel?: string;
}) {
  const { theme } = useStore();
  const bg =
    variant === 'alt'
      ? theme.surfaceAlt
      : variant === 'primary'
      ? theme.primaryStrong
      : variant === 'gold'
      ? theme.goldSoft
      : theme.surface;
  const inner = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: variant === 'surface' ? theme.border : 'transparent',
          ...shadows.card(theme),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress && !onLongPress) return inner;
  return (
    <ScalePressable onPress={onPress} onLongPress={onLongPress} accessibilityLabel={accessibilityLabel}>
      {inner}
    </ScalePressable>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'soft';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  style,
  disabled,
  loading,
  size = 'md',
  accessibilityLabel,
}: {
  title?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: string;
  iconRight?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
}) {
  const { theme } = useStore();
  const palette = useMemo(() => {
    switch (variant) {
      case 'gold':
        return { bg: theme.gold, fg: theme.name === 'dark' ? '#1A1408' : '#2A2110', border: 'transparent' };
      case 'outline':
        return { bg: 'transparent', fg: theme.primary, border: theme.borderStrong };
      case 'ghost':
        return { bg: 'transparent', fg: theme.textSecondary, border: 'transparent' };
      case 'danger':
        return { bg: 'transparent', fg: theme.danger, border: theme.danger };
      case 'soft':
        return { bg: theme.primarySoft, fg: theme.primaryOnSoft, border: 'transparent' };
      default:
        return { bg: theme.primary, fg: theme.textInverse, border: 'transparent' };
    }
  }, [variant, theme]);

  const padV = size === 'lg' ? 16 : size === 'sm' ? 9 : 12;
  const fs = size === 'lg' ? 17 : size === 'sm' ? 13.5 : 15;

  return (
    <ScalePressable
      onPress={disabled || loading ? undefined : onPress}
      accessibilityLabel={accessibilityLabel ?? title}
      delay={0.96}
    >
      <View
        style={[
          styles.btn,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            paddingVertical: padV,
            borderRadius: radius.pill,
            opacity: disabled ? 0.45 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={palette.fg} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={fs + 3} color={palette.fg} /> : null}
            {title ? (
              <Text style={[styles.btnText, { color: palette.fg, fontSize: fs }]} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {iconRight ? <Icon name={iconRight} size={fs + 3} color={palette.fg} /> : null}
          </>
        )}
      </View>
    </ScalePressable>
  );
}

export function IconButton({
  name,
  onPress,
  size = 22,
  color,
  bg,
  style,
  accessibilityLabel,
  active,
}: {
  name: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  active?: boolean;
}) {
  const { theme } = useStore();
  const fg = color ?? theme.textSecondary;
  return (
    <ScalePressable onPress={onPress} accessibilityLabel={accessibilityLabel} delay={0.9} style={style}>
      <View
        style={[
          styles.iconBtn,
          {
            backgroundColor: bg ?? (active ? theme.primarySoft : theme.surfaceAlt),
            borderColor: active ? theme.gold : 'transparent',
            borderWidth: active ? 1 : 0,
          },
        ]}
      >
        <Icon name={name} size={size} color={active ? theme.gold : fg} />
      </View>
    </ScalePressable>
  );
}

// ---------------------------------------------------------------------------
// Chip / Badge
// ---------------------------------------------------------------------------

export function Chip({
  label,
  icon,
  onPress,
  active,
  color,
  style,
}: {
  label: string;
  icon?: string;
  onPress?: () => void;
  active?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useStore();
  const c = color ?? theme.primary;
  const body = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: active ? c : theme.surfaceAlt,
          borderColor: active ? c : theme.border,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={14} color={active ? theme.textInverse : theme.textMuted} /> : null}
      <Text
        style={[
          styles.chipText,
          { color: active ? theme.textInverse : theme.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <ScalePressable onPress={onPress} delay={0.94} accessibilityLabel={label}>
      {body}
    </ScalePressable>
  );
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function ProgressBar({
  percent,
  height = 8,
  color,
  track,
  style,
  animated = true,
}: {
  percent: number;
  height?: number;
  color?: string;
  track?: string;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
}) {
  const { theme } = useStore();
  const p = Math.max(0, Math.min(100, percent));
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animated) {
      w.setValue(p);
      return;
    }
    Animated.timing(w, {
      toValue: p,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [p, animated, w]);
  const width = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View
      style={[
        { height, borderRadius: height, backgroundColor: track ?? theme.surfaceAlt, overflow: 'hidden' },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p) }}
    >
      <Animated.View
        style={{
          width,
          height: '100%',
          borderRadius: height,
          backgroundColor: color ?? theme.gold,
        }}
      />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  percent,
  size = 96,
  stroke = 9,
  color,
  trackColor,
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const { theme } = useStore();
  const p = Math.max(0, Math.min(100, percent));
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: p,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [p, anim]);

  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p) }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor ?? theme.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? theme.gold}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

export function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  icon?: string;
}) {
  const { theme } = useStore();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? (
          <View style={[styles.sectionIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name={icon} size={16} color={theme.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {action ? (
        <ScalePressable onPress={onAction} accessibilityLabel={action} delay={0.94}>
          <View style={styles.sectionAction}>
            <Text style={[styles.sectionActionText, { color: theme.primary }]}>{action}</Text>
            <Icon name="chevron-back" size={15} color={theme.primary} />
          </View>
        </ScalePressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty / Loading states
// ---------------------------------------------------------------------------

export function EmptyState({
  icon = 'search-outline',
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const { theme } = useStore();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Icon name={icon} size={30} color={theme.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.emptyMsg, { color: theme.textMuted }]}>{message}</Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </View>
  );
}

export function LoadingState({ label = 'جارٍ التحميل…' }: { label?: string }) {
  const { theme } = useStore();
  return (
    <View style={styles.empty}>
      <ActivityIndicator size="large" color={theme.gold} />
      <Text style={[styles.emptyMsg, { color: theme.textMuted, marginTop: spacing.md }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  const { theme } = useStore();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt, borderColor: theme.danger }]}>
        <Icon name="alert-circle-outline" size={30} color={theme.danger} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.danger }]}>{title}</Text>
      <Text style={[styles.emptyMsg, { color: theme.textSecondary }]}>{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button title="إعادة المحاولة" onPress={onRetry} variant="outline" icon="refresh" />
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: Array<{ value: T; label: string; icon?: string }>;
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useStore();
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        style,
      ]}
      accessibilityRole="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <ScalePressable
            key={o.value}
            onPress={() => onChange(o.value)}
            delay={0.97}
            accessibilityLabel={o.label}
            style={{ flex: 1 }}
          >
            <View
              style={[
                styles.segment,
                active
                  ? { backgroundColor: theme.surface, ...shadows.soft(theme) }
                  : { backgroundColor: 'transparent' },
              ]}
            >
              {o.icon ? (
                <Icon name={o.icon} size={15} color={active ? theme.primary : theme.textMuted} />
              ) : null}
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? theme.primary : theme.textMuted },
                ]}
                numberOfLines={1}
              >
                {o.label}
              </Text>
            </View>
          </ScalePressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet modal
// ---------------------------------------------------------------------------

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const { theme } = useStore();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="إغلاق">
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingBottom: insets.bottom + spacing.lg,
            transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }) }],
            borderTopWidth: 2,
            borderTopColor: theme.gold,
            maxHeight: '82%',
          }}
        >
          <View style={styles.sheetHandle}>
            <View style={[styles.sheetHandleBar, { backgroundColor: theme.borderStrong }]} />
          </View>
          {title ? (
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>
              <IconButton name="close" onPress={onClose} accessibilityLabel="إغلاق" size={20} />
            </View>
          ) : null}
          <View style={{ paddingHorizontal: spacing.xl }}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Hero gradient header
// ---------------------------------------------------------------------------

export function HeroGradient({
  children,
  style,
  variant = 'green',
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'green' | 'gold' | 'night';
}) {
  const { theme } = useStore();
  const colors = useMemo(() => {
    if (theme.name === 'dark') {
      if (variant === 'gold') return ['#241E10', '#151F1A'];
      if (variant === 'night') return ['#0B1220', '#101A15'];
      return ['#12251C', '#0D1411'];
    }
    if (variant === 'gold') return ['#F3E7CD', '#FAF7F0'];
    if (variant === 'night') return ['#DCE7F0', '#FAF7F0'];
    return ['#1B5E43', '#123F2D'];
  }, [theme.name, variant]);

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <GeometricBackdrop opacity={theme.name === 'dark' ? 0.07 : 0.09} color={theme.name === 'dark' ? theme.gold : '#C6A15B'} />
      {children}
    </View>
  );
}

/** بطاقة عنوان رئيسية مزخرفة */
export function OrnamentTitle({
  title,
  subtitle,
  dark,
}: {
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  const { theme } = useStore();
  const fg = dark ? (theme.name === 'dark' ? theme.text : '#FBF9F4') : theme.text;
  const sub = dark ? (theme.name === 'dark' ? theme.textSecondary : 'rgba(251,249,244,0.82)') : theme.textSecondary;
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: spacing.lg }}>
      <RubElHizb size={26} color={theme.gold} />
      <Text style={[styles.displayTitle, { color: fg, marginTop: spacing.md }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.displaySubtitle, { color: sub, marginTop: 6 }]}>{subtitle}</Text>
      ) : null}
      <OrnamentDivider width={190} color={theme.gold} style={{ marginTop: spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center', zIndex: 9999 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 460,
  },
  toastText: { fontFamily: fonts.uiMedium, fontSize: 14, flexShrink: 1 },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    borderWidth: 1.4,
    minWidth: 44,
    minHeight: 44,
  },
  btnText: { fontFamily: fonts.uiBold, fontSize: 15, textAlign: 'center' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontFamily: fonts.uiMedium, fontSize: 13 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontFamily: fonts.uiBlack, fontSize: 17 },
  sectionSubtitle: { fontFamily: fonts.ui, fontSize: 12.5, marginTop: 2, lineHeight: 18 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 6 },
  sectionActionText: { fontFamily: fonts.uiBold, fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: 2 },
  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  emptyTitle: { fontFamily: fonts.uiBlack, fontSize: 17, textAlign: 'center' },
  emptyMsg: { fontFamily: fonts.ui, fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  segmented: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    gap: 2,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  segmentText: { fontFamily: fonts.uiBold, fontSize: 13 },
  sheetHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  sheetHandleBar: { width: 44, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  sheetTitle: { fontFamily: fonts.uiBlack, fontSize: 17 },
  displayTitle: { fontFamily: fonts.display, fontSize: 34, textAlign: 'center', letterSpacing: 0.4 },
  displaySubtitle: { fontFamily: fonts.uiMedium, fontSize: 14.5, textAlign: 'center', lineHeight: 22 },
});
