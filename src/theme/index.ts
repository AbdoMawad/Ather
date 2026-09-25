/**
 * الهوية البصرية لتطبيق «أثر أمال»
 * أسلوب Minimal Islamic: كريمي/أوف-وايت + أخضر داكن + ذهبي هادئ + بيج
 */

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  /** خلفية الصفحة */
  bg: string;
  /** خلفية مرتفعة (بطاقات) */
  surface: string;
  /** خلفية ثانوية / بيج */
  surfaceAlt: string;
  surfaceSunken: string;
  /** الأخضر الداكن الأساسي */
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  primaryOnSoft: string;
  /** الذهبي الهادئ */
  gold: string;
  goldSoft: string;
  goldDeep: string;
  /** النصوص */
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  /** الحدود والفواصل */
  border: string;
  borderStrong: string;
  /** حالات */
  success: string;
  danger: string;
  warning: string;
  /** ظلال */
  shadow: string;
  overlay: string;
  /** زخرفة */
  ornament: string;
  ornamentSoft: string;
  tabBar: string;
  headerBg: string;
  skeleton: string;
}

export const lightTheme: Theme = {
  name: 'light',
  bg: '#FAF7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F2EBDD',
  surfaceSunken: '#F6F1E7',
  primary: '#1B5E43',
  primaryStrong: '#123F2D',
  primarySoft: '#E4EFE8',
  primaryOnSoft: '#17513A',
  gold: '#C6A15B',
  goldSoft: '#F1E6CE',
  goldDeep: '#9A7B3C',
  text: '#1C2A23',
  textSecondary: '#4A5B52',
  textMuted: '#7E8C84',
  textInverse: '#FBF9F4',
  border: '#E6DECC',
  borderStrong: '#D6CBB2',
  success: '#2E7D5B',
  danger: '#A64B3C',
  warning: '#B07D2B',
  shadow: '#1B3A2C',
  overlay: 'rgba(18, 40, 30, 0.45)',
  ornament: '#C6A15B',
  ornamentSoft: 'rgba(198, 161, 91, 0.28)',
  tabBar: '#FFFDF8',
  headerBg: '#FAF7F0',
  skeleton: '#EDE6D8',
};

export const darkTheme: Theme = {
  name: 'dark',
  bg: '#0D1411',
  surface: '#151F1A',
  surfaceAlt: '#1C2822',
  surfaceSunken: '#111A16',
  primary: '#7FC3A0',
  primaryStrong: '#A6D9BE',
  primarySoft: '#1B3229',
  primaryOnSoft: '#A9DCC1',
  gold: '#D8BB7E',
  goldSoft: '#2C2718',
  goldDeep: '#E3CB98',
  text: '#E9F1EC',
  textSecondary: '#B6C6BD',
  textMuted: '#84968C',
  textInverse: '#0D1411',
  border: '#24332B',
  borderStrong: '#33463B',
  success: '#63B58C',
  danger: '#D98574',
  warning: '#D9AE63',
  shadow: '#000000',
  overlay: 'rgba(4, 10, 7, 0.66)',
  ornament: '#C0A268',
  ornamentSoft: 'rgba(192, 162, 104, 0.22)',
  tabBar: '#101A15',
  headerBg: '#0D1411',
  skeleton: '#1D2A23',
};

export const themes: Record<ThemeName, Theme> = { light: lightTheme, dark: darkTheme };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

/** أسماء الخطوط المحمّلة عبر expo-font */
export const fonts = {
  ui: 'Tajawal-Regular',
  uiMedium: 'Tajawal-Medium',
  uiBold: 'Tajawal-Bold',
  uiBlack: 'Tajawal-ExtraBold',
  /** خط المصحف (الرسم العثماني) */
  quranUthmani: 'AmiriQuran',
  /** خط النسخ (الرسم الإملائي) */
  quranSimple: 'Amiri-Regular',
  /** خط العناوين الزخرفي */
  display: 'Amiri-Bold',
  naskh: 'Amiri-Regular',
  naskhBold: 'Amiri-Bold',
} as const;

export const shadows = {
  card: (t: Theme) => ({
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: t.name === 'dark' ? 0.5 : 0.09,
    shadowRadius: 16,
    elevation: 3,
  }),
  soft: (t: Theme) => ({
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: t.name === 'dark' ? 0.4 : 0.06,
    shadowRadius: 8,
    elevation: 2,
  }),
  lift: (t: Theme) => ({
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: t.name === 'dark' ? 0.6 : 0.16,
    shadowRadius: 28,
    elevation: 8,
  }),
};

/** حدود حجم الخط القرآني */
export const QURAN_FONT_MIN = 18;
export const QURAN_FONT_MAX = 40;
export const QURAN_FONT_DEFAULT = 26;
