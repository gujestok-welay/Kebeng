import { TabList, TabSlot, Tabs, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  IconChartBar,
  IconHome,
  IconList,
  IconMessageCircle,
  IconPlus,
  IconSettings,
} from '@tabler/icons-react-native';
import { useRouter, type Href } from 'expo-router';

import { Palette } from '@/constants/theme';

const tabs = [
  { name: 'home', href: '/', label: 'Home', icon: IconHome, fab: false },
  { name: 'chat', href: '/chat', label: 'Chat AI', icon: IconMessageCircle, fab: false },
  { name: 'add', href: '/manual', label: '', icon: IconPlus, fab: true },
  { name: 'transactions', href: '/transactions', label: 'Transaksi', icon: IconList, fab: false },
  { name: 'reports', href: '/reports', label: 'Laporan', icon: IconChartBar, fab: false },
  { name: 'settings', href: '/settings', label: 'Pengaturan', icon: IconSettings, fab: false },
] as const;

export default function AppTabs() {
  const router = useRouter();

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList style={styles.tabBar}>
        {tabs.map((tab) =>
          tab.fab ? (
            <FabButton
              key={tab.name}
              icon={tab.icon}
              onPress={() => router.push(tab.href as Href)}
            />
          ) : (
            <TabTrigger key={`${tab.name}-${tab.href}`} name={tab.name} href={tab.href as Href} asChild>
              <TabButton label={tab.label} icon={tab.icon} />
            </TabTrigger>
          ),
        )}
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon: Icon,
  label,
  isFocused,
  ...props
}: TabTriggerSlotProps & {
  icon: typeof IconHome;
  label: string;
}) {
  const color = isFocused ? Palette.accent : Palette.textSecondary;
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}>
      <Icon size={20} color={color} strokeWidth={1.9} />
      <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function FabButton({
  icon: Icon,
  onPress,
}: {
  icon: typeof IconHome;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fabWrap, pressed && styles.pressed]}>
      <View style={styles.fab}>
        <Icon size={24} color={Palette.background} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
    backgroundColor: Palette.background,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 74,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.background,
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    width: 56,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '400',
  },
  fabWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accent,
    borderColor: Palette.background,
    borderWidth: 3,
  },
  pressed: {
    opacity: 0.72,
  },
});
