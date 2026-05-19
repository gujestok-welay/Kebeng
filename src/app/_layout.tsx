import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Palette } from '@/constants/theme';

export default function TabLayout() {
  return (
    <ThemeProvider
      value={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: Palette.background,
          card: Palette.card,
          primary: Palette.accent,
          text: Palette.text,
          border: Palette.border,
        },
      }}>
      <StatusBar style="light" backgroundColor={Palette.background} />
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
