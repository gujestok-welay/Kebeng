import { IconArrowDownCircle, IconArrowUpCircle, IconBell, IconWallet } from '@tabler/icons-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, HeaderIcon, IconCircle, ProgressBar, ScreenShell, SectionLabel, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { categoryMeta, transactions } from '@/data/mock-finance';
import { formatRupiah, formatSignedRupiah } from '@/utils/format';

const monthlyBudget = 1500000;
const usedBudget = 965000;
const budgetLeft = monthlyBudget - usedBudget;
const budgetPercent = Math.round((usedBudget / monthlyBudget) * 100);

export default function HomeScreen() {
  return (
    <ScreenShell>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <IconWallet size={20} color={Palette.accent} strokeWidth={1.9} />
              </View>
              <Text style={styles.brandText}>Kebeng</Text>
            </View>
            <HeaderIcon icon={IconBell} />
          </View>

          <Card accent style={styles.budgetCard}>
            <Text style={styles.budgetLabel}>Sisa Budget Bulan Ini</Text>
            <Text style={styles.budgetAmount}>{formatRupiah(budgetLeft)}</Text>
            <ProgressBar value={budgetPercent} warning={budgetPercent > 80} />
            <View style={styles.budgetFooter}>
              <Text style={textStyles.muted}>Terpakai {formatRupiah(usedBudget)}</Text>
              <Text style={styles.budgetPercent}>{budgetPercent}%</Text>
            </View>
          </Card>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <IconArrowDownCircle size={20} color={Palette.accent} strokeWidth={1.8} />
              <Text style={textStyles.muted}>Pemasukan</Text>
              <Text style={styles.incomeText}>{formatRupiah(2750000)}</Text>
            </Card>
            <Card style={styles.statCard}>
              <IconArrowUpCircle size={20} color={Palette.expense} strokeWidth={1.8} />
              <Text style={textStyles.muted}>Pengeluaran</Text>
              <Text style={styles.expenseText}>{formatRupiah(965000)}</Text>
            </Card>
          </View>

          <View>
            <SectionLabel>Transaksi Terbaru</SectionLabel>
            <Card style={styles.listCard}>
              {transactions.slice(0, 3).map((item, index) => {
                const meta = categoryMeta[item.category];
                return (
                  <View key={item.id} style={[styles.transactionRow, index > 0 && styles.rowBorder]}>
                    <IconCircle icon={meta.icon} color={meta.color} background={meta.background} />
                    <View style={styles.rowText}>
                      <Text style={textStyles.title}>{item.title}</Text>
                      <Text style={textStyles.tiny}>{item.time}</Text>
                    </View>
                    <Text style={item.type === 'income' ? styles.incomeText : styles.expenseText}>
                      {formatSignedRupiah(item.amount, item.type)}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 100,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: Palette.cardAccent,
    borderColor: Palette.accentBorder,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  brandText: {
    color: Palette.accent,
    fontSize: 18,
    fontWeight: '500',
  },
  budgetCard: {
    gap: 13,
  },
  budgetLabel: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  budgetAmount: {
    color: Palette.accent,
    fontSize: 28,
    fontWeight: '500',
  },
  budgetFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetPercent: {
    color: Palette.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    gap: 8,
  },
  listCard: {
    paddingVertical: 4,
  },
  transactionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
  },
  rowBorder: {
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  incomeText: {
    color: Palette.accent,
    fontSize: 15,
    fontWeight: '500',
  },
  expenseText: {
    color: Palette.expense,
    fontSize: 15,
    fontWeight: '500',
  },
});
