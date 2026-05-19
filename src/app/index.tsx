import { IconArrowDownCircle, IconArrowUpCircle, IconBell, IconReceipt, IconWallet } from '@tabler/icons-react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, HeaderIcon, IconCircle, ProgressBar, ScreenShell, SectionLabel, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { getRecentTransactions, initDatabase, SavedTransaction } from '@/services/dbService';
import { formatRupiah, formatSignedRupiah } from '@/utils/format';

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<SavedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      await initDatabase();
      const rows = await getRecentTransactions(500);
      setTransactions(rows);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ringkasan belum bisa dibaca.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const dashboard = useMemo(() => buildDashboard(transactions), [transactions]);

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
            <Text style={styles.budgetLabel}>Arus Kas Bulan Ini</Text>
            <Text style={dashboard.netBalance >= 0 ? styles.budgetAmount : styles.budgetAmountWarning}>
              {formatRupiah(Math.abs(dashboard.netBalance))}
            </Text>
            <ProgressBar value={dashboard.expensePercent} warning={dashboard.expensePercent > 80} />
            <View style={styles.budgetFooter}>
              <Text style={textStyles.muted}>Pengeluaran {formatRupiah(dashboard.monthlyExpense)}</Text>
              <Text style={styles.budgetPercent}>{dashboard.expensePercent}% dari pemasukan</Text>
            </View>
          </Card>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <IconArrowDownCircle size={20} color={Palette.accent} strokeWidth={1.8} />
              <Text style={textStyles.muted}>Pemasukan</Text>
              <Text style={styles.incomeText}>{formatRupiah(dashboard.monthlyIncome)}</Text>
            </Card>
            <Card style={styles.statCard}>
              <IconArrowUpCircle size={20} color={Palette.expense} strokeWidth={1.8} />
              <Text style={textStyles.muted}>Pengeluaran</Text>
              <Text style={styles.expenseText}>{formatRupiah(dashboard.monthlyExpense)}</Text>
            </Card>
          </View>

          <View>
            <SectionLabel>Transaksi Terbaru</SectionLabel>
            <Card style={styles.listCard}>
              {isLoading ? (
                <View style={styles.stateRow}>
                  <ActivityIndicator color={Palette.accent} />
                  <Text style={textStyles.muted}>Memuat data lokal...</Text>
                </View>
              ) : null}

              {!isLoading && errorMessage ? (
                <Text style={styles.stateText}>{errorMessage}</Text>
              ) : null}

              {!isLoading && !errorMessage && dashboard.recentTransactions.length === 0 ? (
                <View style={styles.stateRow}>
                  <IconReceipt size={20} color={Palette.textTertiary} strokeWidth={1.8} />
                  <Text style={textStyles.muted}>Belum ada transaksi tersimpan.</Text>
                </View>
              ) : null}

              {!isLoading && !errorMessage
                ? dashboard.recentTransactions.map((item, index) => {
                    const isIncome = item.type === 'income';
                    return (
                      <View key={item.id} style={[styles.transactionRow, index > 0 && styles.rowBorder]}>
                        <IconCircle
                          icon={IconReceipt}
                          color={isIncome ? Palette.accent : Palette.expense}
                          background={isIncome ? Palette.accentDark : Palette.expenseBg}
                        />
                        <View style={styles.rowText}>
                          <Text style={textStyles.title}>
                            {item.description || item.category_name || 'Transaksi'}
                          </Text>
                          <Text style={textStyles.tiny}>
                            {(item.category_name ?? 'Lainnya')} - {formatDisplayDate(item.date)}
                          </Text>
                        </View>
                        <Text style={isIncome ? styles.incomeText : styles.expenseText}>
                          {formatSignedRupiah(item.amount, item.type)}
                        </Text>
                      </View>
                    );
                  })
                : null}
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function buildDashboard(transactions: SavedTransaction[]) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}`;
  const monthlyTransactions = transactions.filter((transaction) => transaction.date.startsWith(monthKey));
  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const monthlyExpense = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expensePercent = monthlyIncome > 0 ? Math.round((monthlyExpense / monthlyIncome) * 100) : 0;

  return {
    expensePercent,
    monthlyExpense,
    monthlyIncome,
    netBalance: monthlyIncome - monthlyExpense,
    recentTransactions: transactions.slice(0, 3),
  };
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
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
  budgetAmountWarning: {
    color: Palette.expense,
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
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
  },
  stateText: {
    color: Palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 16,
    textAlign: 'center',
  },
});
