import {
  IconBellExclamation,
  IconBellRinging,
  IconCalendarMonth,
  IconChevronRight,
  IconClock,
  IconDownload,
  IconFileSpreadsheet,
  IconTag,
  IconTrash,
  IconWallet,
} from '@tabler/icons-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, IconCircle, ScreenShell, SectionLabel, ToggleSwitch, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';

export default function SettingsScreen() {
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
            <SectionLabel>Budget</SectionLabel>
            <Card style={styles.listCard}>
              <SettingRow icon={IconCalendarMonth} title="Budget Bulanan Total" value={formatRupiah(1500000)} />
              <SettingRow icon={IconTag} title="Budget Per Kategori" value="5 kategori" />
              <SettingRow icon={IconBellExclamation} title="Peringatan Budget" trailing={<ToggleSwitch active />} />
            </Card>
          </View>

          <View>
            <SectionLabel>Notifikasi</SectionLabel>
            <Card style={styles.listCard}>
              <SettingRow icon={IconClock} title="Ringkasan Harian" value="Setiap 21:00" trailing={<ToggleSwitch active />} />
              <SettingRow icon={IconBellRinging} title="Pengingat Input" value="Jika belum input seharian" trailing={<ToggleSwitch active={false} />} />
            </Card>
          </View>

          <View>
            <SectionLabel>Data</SectionLabel>
            <Card style={styles.listCard}>
              <SettingRow
                icon={IconFileSpreadsheet}
                title="Export Excel"
                value="Transaksi dan laporan"
                trailing={<IconDownload size={18} color={Palette.accent} strokeWidth={1.9} />}
              />
              <SettingRow icon={IconTrash} title="Hapus Semua Data" danger trailing={<IconChevronRight size={18} color={Palette.expense} strokeWidth={1.9} />} />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function SettingRow({
  icon,
  title,
  value,
  trailing,
  danger,
}: {
  icon: Parameters<typeof IconCircle>[0]['icon'];
  title: string;
  value?: string;
  trailing?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <View style={styles.row}>
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
      {trailing ?? <IconChevronRight size={18} color={Palette.textTertiary} strokeWidth={1.9} />}
    </View>
  );
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
    minHeight: 58,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  dangerText: {
    color: Palette.expense,
  },
});
