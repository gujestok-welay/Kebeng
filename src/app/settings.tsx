import {
  IconBrain,
  IconChevronRight,
  IconDatabase,
  IconGauge,
  IconKey,
  IconRefresh,
  IconTrash,
  IconWallet,
} from '@tabler/icons-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, IconCircle, ScreenShell, SectionLabel, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { AI_USAGE_LIMITS, AiUsage, getAiUsage } from '@/services/aiUsageService';
import { clearLocalData } from '@/services/dbService';

const provider = process.env.EXPO_PUBLIC_AI_PROVIDER || 'openrouter';
const openRouterKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const textModel = process.env.EXPO_PUBLIC_OPENROUTER_TEXT_MODEL || 'Belum diset';
const visionModel = process.env.EXPO_PUBLIC_OPENROUTER_VISION_MODEL || 'Belum diset';

export default function SettingsScreen() {
  const [usage, setUsage] = useState<AiUsage | null>(null);

  const loadUsage = useCallback(async () => {
    setUsage(await getAiUsage());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsage();
    }, [loadUsage]),
  );

  function confirmResetData() {
    Alert.alert(
      'Reset data lokal?',
      'Semua transaksi, budget, log notifikasi, dan pemakaian AI harian akan dihapus dari perangkat ini.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLocalData();
              await loadUsage();
              Alert.alert('Berhasil', 'Data lokal sudah direset.');
            } catch (error) {
              Alert.alert('Gagal reset', error instanceof Error ? error.message : 'Coba lagi sebentar.');
            }
          },
        },
      ],
    );
  }

  return (
    <ScreenShell>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={textStyles.pageTitle}>Pengaturan</Text>
          <View style={styles.smallBrand}>
            <IconWallet size={16} color={Palette.accent} strokeWidth={1.9} />
            <Text style={styles.brandText}>Kebeng</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View>
            <SectionLabel>AI</SectionLabel>
            <Card style={styles.listCard}>
              <SettingRow
                icon={IconBrain}
                title="Provider AI"
                value={`${providerLabel(provider)} - ${openRouterKey ? 'aktif' : 'API key belum ada'}`}
              />
              <SettingRow icon={IconKey} title="Model chat" value={textModel} />
              <SettingRow icon={IconKey} title="Model struk" value={visionModel} />
              <SettingRow
                icon={IconGauge}
                title="Batas AI hari ini"
                value={`Chat ${usage?.chatCount ?? 0}/${AI_USAGE_LIMITS.chatDaily}, Struk ${usage?.receiptCount ?? 0}/${AI_USAGE_LIMITS.receiptDaily}`}
              />
            </Card>
          </View>

          <View>
            <SectionLabel>Penyimpanan</SectionLabel>
            <Card style={styles.listCard}>
              <SettingRow
                icon={IconDatabase}
                title="Data lokal"
                value={Platform.OS === 'web' ? 'LocalStorage browser untuk mode web' : 'SQLite lokal di perangkat'}
              />
              <SettingRow
                icon={IconRefresh}
                title="Build aplikasi"
                value={`${Constants.expoConfig?.version ?? 'dev'} - ${Platform.OS}`}
              />
              <SettingRow
                danger
                icon={IconTrash}
                title="Reset data lokal"
                value="Hapus semua data di perangkat ini"
                onPress={confirmResetData}
              />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function SettingRow({
  danger,
  icon,
  onPress,
  title,
  value,
}: {
  danger?: boolean;
  icon: Parameters<typeof IconCircle>[0]['icon'];
  onPress?: () => void;
  title: string;
  value?: string;
}) {
  const content = (
    <>
      <IconCircle
        icon={icon}
        color={danger ? Palette.expense : Palette.accent}
        background={danger ? Palette.expenseBg : Palette.accentDark}
        size={28}
      />
      <View style={styles.rowText}>
        <Text style={[textStyles.title, danger && styles.dangerText]}>{title}</Text>
        {value ? <Text style={textStyles.tiny}>{value}</Text> : null}
      </View>
      <IconChevronRight
        size={18}
        color={danger ? Palette.expense : onPress ? Palette.textTertiary : Palette.border}
        strokeWidth={1.9}
      />
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

function providerLabel(value: string) {
  if (value.toLowerCase() === 'openrouter') {
    return 'OpenRouter';
  }

  if (value.toLowerCase() === 'gemini') {
    return 'Gemini';
  }

  return value;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  smallBrand: {
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  brandText: {
    color: Palette.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    gap: 18,
    paddingBottom: 100,
    paddingTop: 24,
  },
  listCard: {
    paddingVertical: 2,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: Palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 62,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  dangerText: {
    color: Palette.expense,
  },
  pressed: {
    opacity: 0.72,
  },
});
