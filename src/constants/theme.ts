/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  background: '#111111',
  card: '#1c1c1c',
  cardAccent: '#0d1f16',
  border: '#2a2a2a',
  accent: '#2DD4A0',
  accentDark: '#0d3d2a',
  accentBorder: '#1e3d2a',
  text: '#f0f0f0',
  textNormal: '#cccccc',
  textSecondary: '#888888',
  textTertiary: '#555555',
  expense: '#f87171',
  expenseBg: '#3d1515',
  blue: '#60aaee',
  blueBg: '#0d2233',
  orange: '#f0a040',
  orangeBg: '#2a1a0d',
  purple: '#a078f0',
  purpleBg: '#1e0d33',
  coffee: '#d4894a',
  coffeeBg: '#1e1208',
  grayBg: '#222222',
} as const;

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    backgroundElement: Palette.card,
    backgroundSelected: Palette.accentDark,
    textSecondary: Palette.textSecondary,
  },
  dark: {
    text: Palette.text,
    background: Palette.background,
    backgroundElement: Palette.card,
    backgroundSelected: Palette.accentDark,
    textSecondary: Palette.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
