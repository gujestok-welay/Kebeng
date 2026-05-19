import { TabList, TabSlot, Tabs, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useState } from 'react';
import { GestureResponderEvent, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  IconBrain,
  IconChartBar,
  IconHome,
  IconList,
  IconMessageCircle,
  IconPencil,
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
  const netInfo = useNetInfo();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const isOnline = netInfo.isConnected !== false && netInfo.isInternetReachable !== false;

  function openRoute(href: Href) {
    setIsAddOpen(false);
    setTimeout(() => router.push(href), 0);
  }

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList style={styles.tabBar}>
        {tabs.map((tab) =>
          tab.fab ? (
            <FabButton
              key={tab.name}
              icon={tab.icon}
              onPress={() => setIsAddOpen(true)}
            />
          ) : (
            <TabTrigger key={`${tab.name}-${tab.href}`} name={tab.name} href={tab.href as Href} asChild>
              <TabButton label={tab.label} icon={tab.icon} />
            </TabTrigger>
          ),
        )}
      </TabList>
      <AddTransactionModal
        isOnline={isOnline}
        onClose={() => setIsAddOpen(false)}
        onManual={() => openRoute('/manual')}
        onAi={() => openRoute('/chat')}
        visible={isAddOpen}
      />
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

function AddTransactionModal({
  isOnline,
  onAi,
  onClose,
  onManual,
  visible,
}: {
  isOnline: boolean;
  onAi: () => void;
  onClose: () => void;
  onManual: () => void;
  visible: boolean;
}) {
  function pressChoice(callback: () => void) {
    return (event: GestureResponderEvent) => {
      event.stopPropagation();
      callback();
    };
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.addSheet}>
          <Text style={styles.sheetTitle}>Catat transaksi</Text>
          <Text style={styles.sheetSubtitle}>
            Pilih manual kapan saja, atau pakai AI saat internet tersedia.
          </Text>

          <Pressable
            onPress={pressChoice(onManual)}
            style={({ pressed }) => [styles.choiceRow, pressed && styles.pressed]}>
            <View style={styles.choiceIcon}>
              <IconPencil size={20} color={Palette.accent} strokeWidth={1.8} />
            </View>
            <View style={styles.choiceText}>
              <Text style={styles.choiceTitle}>Input manual</Text>
              <Text style={styles.choiceSubtitle}>Cocok saat offline atau data sudah jelas</Text>
            </View>
          </Pressable>

          <Pressable
            disabled={!isOnline}
            onPress={pressChoice(onAi)}
            style={({ pressed }) => [
              styles.choiceRow,
              !isOnline && styles.choiceDisabled,
              pressed && styles.pressed,
            ]}>
            <View style={isOnline ? styles.choiceIcon : styles.choiceIconDisabled}>
              <IconBrain size={20} color={isOnline ? Palette.accent : Palette.textTertiary} strokeWidth={1.8} />
            </View>
            <View style={styles.choiceText}>
              <Text style={isOnline ? styles.choiceTitle : styles.choiceTitleDisabled}>Chat AI</Text>
              <Text style={styles.choiceSubtitle}>
                {isOnline ? 'Tulis natural atau baca foto struk' : 'Butuh internet'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  addSheet: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    maxWidth: 520,
    padding: 16,
    width: '100%',
  },
  sheetTitle: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sheetSubtitle: {
    color: Palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
  choiceRow: {
    alignItems: 'center',
    backgroundColor: Palette.grayBg,
    borderColor: Palette.border,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 68,
    paddingHorizontal: 12,
  },
  choiceDisabled: {
    opacity: 0.55,
  },
  choiceIcon: {
    alignItems: 'center',
    backgroundColor: Palette.accentDark,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  choiceIconDisabled: {
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  choiceText: {
    flex: 1,
    gap: 3,
  },
  choiceTitle: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  choiceTitleDisabled: {
    color: Palette.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  choiceSubtitle: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
});
