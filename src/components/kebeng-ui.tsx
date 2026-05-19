import type { IconProps } from '@tabler/icons-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Palette } from '@/constants/theme';

type TablerIcon = React.ComponentType<IconProps>;

export function ScreenShell({ children }: { children: React.ReactNode }) {
  return <View style={styles.shell}>{children}</View>;
}

export function Card({
  children,
  accent,
  style,
}: {
  children: React.ReactNode;
  accent?: boolean;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, accent && styles.accentCard, style]}>{children}</View>;
}

export function IconCircle({
  icon: Icon,
  color,
  background,
  size = 34,
}: {
  icon: TablerIcon;
  color: string;
  background: string;
  size?: number;
}) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}>
      <Icon size={size > 30 ? 17 : 15} color={color} strokeWidth={1.8} />
    </View>
  );
}

export function HeaderIcon({ icon: Icon, onPress }: { icon: TablerIcon; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
      <Icon size={18} color={Palette.text} strokeWidth={1.8} />
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode;
  tone?: 'green' | 'red' | 'gray';
}) {
  return <Text style={[styles.badge, styles[`${tone}Badge`]]}>{children}</Text>;
}

export function ProgressBar({ value, warning }: { value: number; warning?: boolean }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.min(value, 100)}%`, backgroundColor: warning ? Palette.expense : Palette.accent },
        ]}
      />
    </View>
  );
}

export function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <View style={[styles.toggle, { backgroundColor: active ? Palette.accent : '#333333' }]}>
      <View style={[styles.toggleThumb, active ? styles.toggleThumbOn : styles.toggleThumbOff]} />
    </View>
  );
}

export const textStyles = StyleSheet.create({
  pageTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '500',
  },
  title: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '500',
  },
  body: {
    color: Palette.textNormal,
    fontSize: 13,
    lineHeight: 19,
  },
  muted: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  tiny: {
    color: Palette.textTertiary,
    fontSize: 10,
  },
});

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: Palette.background,
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accentCard: {
    backgroundColor: Palette.cardAccent,
    borderColor: Palette.accentBorder,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.72,
  },
  sectionLabel: {
    color: Palette.textTertiary,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    fontSize: 10,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  greenBadge: {
    backgroundColor: Palette.accentDark,
    color: Palette.accent,
  },
  redBadge: {
    backgroundColor: Palette.expenseBg,
    color: Palette.expense,
  },
  grayBadge: {
    backgroundColor: Palette.grayBg,
    color: Palette.textSecondary,
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: Palette.grayBg,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 20,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
    backgroundColor: '#666666',
  },
});
