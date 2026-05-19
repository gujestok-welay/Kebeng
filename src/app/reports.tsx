import { IconCalendar, IconRobot, IconTrendingUp } from '@tabler/icons-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, IconCircle, ProgressBar, ScreenShell, SectionLabel, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { categoryMeta, categoryReports } from '@/data/mock-finance';
import { formatRupiah } from '@/utils/format';

export default function ReportsScreen() {
  return (
    <ScreenShell>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={textStyles.pageTitle}>Laporan</Text>
          <View style={styles.monthPill}>
            <IconCalendar size={15} color={Palette.textSecondary} strokeWidth={1.8} />
            <Text style={styles.monthText}>Mei 2026</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <View style={styles.activeTab}>
            <Text style={styles.activeTabText}>Mingguan</Text>
          </View>
          <View style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>Bulanan</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.totalCard}>
            <Text style={textStyles.muted}>Total Pengeluaran Minggu Ini</Text>
            <Text style={styles.totalAmount}>{formatRupiah(1031000)}</Text>
            <View style={styles.trendRow}>
              <IconTrendingUp size={15} color={Palette.expense} strokeWidth={1.9} />
              <Text style={styles.trendText}>Naik 12% dari minggu lalu</Text>
            </View>
          </Card>

          <View>
            <SectionLabel>Per Kategori</SectionLabel>
            <Card style={styles.categoryCard}>
              {categoryReports.map((item, index) => {
                const meta = categoryMeta[item.key];
                return (
                  <View key={item.key} style={[styles.categoryRow, index > 0 && styles.rowBorder]}>
                    <View style={styles.categoryTop}>
                      <IconCircle icon={meta.icon} color={meta.color} background={meta.background} />
                      <View style={styles.categoryText}>
                        <Text style={textStyles.title}>{meta.label}</Text>
                        <Text style={textStyles.tiny}>{item.progress}% dari budget</Text>
                      </View>
                      <Text style={styles.categoryAmount}>{formatRupiah(item.amount)}</Text>
                    </View>
                    <ProgressBar value={item.progress} warning={item.progress > 80} />
                  </View>
                );
              })}
            </Card>
          </View>

          <Card accent style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <IconRobot size={17} color={Palette.accent} strokeWidth={1.9} />
              <Text style={styles.aiTitle}>Analisis AI Mingguan</Text>
            </View>
            <Text style={styles.aiBody}>
              Pengeluaran makanan sudah melewati 80% budget. Coba batasi makan di luar sampai akhir minggu dan pindahkan sebagian belanja kecil ke catatan manual agar lebih mudah dilacak.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
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
  monthPill: {
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
  monthText: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  tabs: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    flexDirection: 'row',
    marginTop: 18,
    padding: 4,
  },
  activeTab: {
    backgroundColor: Palette.accentDark,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 9,
  },
  inactiveTab: {
    flex: 1,
    paddingVertical: 9,
  },
  activeTabText: {
    color: Palette.accent,
    fontSize: 12,
    textAlign: 'center',
  },
  inactiveTabText: {
    color: Palette.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    gap: 18,
    paddingBottom: 100,
    paddingTop: 18,
  },
  totalCard: {
    gap: 10,
  },
  totalAmount: {
    color: Palette.expense,
    fontSize: 28,
    fontWeight: '500',
  },
  trendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  trendText: {
    color: Palette.expense,
    fontSize: 12,
  },
  categoryCard: {
    gap: 0,
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  categoryTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  categoryText: {
    flex: 1,
    gap: 3,
  },
  categoryAmount: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '500',
  },
  aiCard: {
    gap: 10,
  },
  aiHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  aiTitle: {
    color: Palette.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  aiBody: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 20,
  },
});
