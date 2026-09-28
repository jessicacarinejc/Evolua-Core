import { DynamicColorIOS, Platform, PlatformColor } from 'react-native';

function adaptiveColor(light: string, dark: string, androidAttribute: string) {
  if (Platform.OS === 'ios') return DynamicColorIOS({ light, dark });
  if (Platform.OS === 'android') return PlatformColor(androidAttribute);
  return light;
}

const background = adaptiveColor('#FBFAF7', '#0D1117', '?android:attr/colorBackground');
const surface = adaptiveColor('#FFFFFF', '#171C24', '?android:attr/colorBackgroundFloating');
const text = adaptiveColor('#1A2433', '#F4F6F8', '?android:attr/textColorPrimary');
const textMuted = adaptiveColor('#737D8B', '#B6BEC9', '?android:attr/textColorSecondary');
const inputSurface = adaptiveColor('#FFFFFF', '#151B23', '?android:attr/colorBackgroundFloating');

export const theme = {
  colors: {
    navy: '#10294B',
    navyDark: '#0B1E38',
    lime: '#9DCC46',
    white: '#FFFFFF',
    background,
    surface,
    inputSurface,
    text,
    textStrong: text,
    textMuted,
    placeholder: textMuted,
    border: 'rgba(128, 136, 148, 0.24)',
    borderStrong: 'rgba(94, 108, 126, 0.48)',
    tintSurface: 'rgba(157, 204, 70, 0.12)',
    warningSurface: 'rgba(199, 120, 0, 0.12)',
    success: '#2E7D32',
    warning: '#C77800',
    danger: '#B3261E'
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  }
} as const;
