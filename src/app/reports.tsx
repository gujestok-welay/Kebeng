import {
  IconBook,
  IconBus,
  IconCalendar,
  IconCash,
  IconCoffee,
  IconDeviceGamepad2,
  IconDotsCircleHorizontal,
  IconHeartRateMonitor,
  IconReceipt,
  IconRefresh,
  IconRobot,
  IconShoppingCart,
  IconToolsKitchen2,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, IconCircle, ProgressBar, ScreenShell, SectionLabel, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { getRecentTransactions, initDatabase, SavedTransaction } from '@/services/dbService';
import { formatRupiah } from '@/utils/format';

type CategoryReport = {
  amount: number;
  category: string;
  progress: number;
};

const categoryVisuals = {
  makanan: {
    icon: IconToolsKitchen2,
    color: Palette.accent,
    background: Palette.accentDark,
  },
  minuman: {
    icon: IconCoffee,
    color: Palette.coffee,
    background: Palette.coffeeBg,
  },
  transport: {
    icon: IconBus,
    color: Palette.blue,
    background: Palette.blueBg,
  },
  belanja: {
    icon: IconShoppingCart,
    color: Palette.orange,
    background: Palette.orangeBg,
  },
  hiburan: {
    icon: IconDeviceGamepad2,
    color: Palette.purple,
    background: Palette.purpleBg,
  },
  kesehatan: {
    icon: IconHeartRateMonitor,
    color: Palette.expense,
    background: Palette.expenseBg,
  },
  pendidikan: {
    icon: IconBook,
    color: Palette.blue,
    background: Palette.blueBg,
  },
  pemasukan: {
    icon: IconCash,
    color: Palette.accent,
    background: Palette.accentDark,
  },
  lainnya: {
    icon: IconDotsCircleHorizontal,
    color: Palette.textSecondary,
    background: Palette.grayBg,
  },
} as const;

export default function ReportsScreen() {
  const [transactions, setTransactions] = useState<SavedTransaction[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);

    try {
      await initDatabase();
      const rows = await getRecentTransactions(500);
      setTransactions(rows);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Laporan belum bisa dibaca.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const report = useMemo(() => buildReport(transactions, period), [transactions, period]);

  return (
    <ScreenShell>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={textStyles.pageTitle}>Laporan</Text>
          <View style={styles.monthPill}>
            <IconCalendar size={15} color={Palette.textSecondary} strokeWidth={1.8} />
            <Text style={styles.monthText}>{report.monthLabel}</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setPeriod('weekly')}
            style={period === 'weekly' ? styles.activeTab : styles.inactiveTab}>
            <Text style={period === 'weekly' ? styles.activeTabText : styles.inactiveTabText}>Mingguan</Text>
          </Pressable>
          <Pressable
            onPress={() => setPeriod('monthly')}
            style={period === 'monthly' ? styles.activeTab : styles.inactiveTab}>
            <Text style={period === 'monthly' ? styles.activeTabText : styles.inactiveTabText}>Bulanan</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <Card style={styles.stateCard}>
              <ActivityIndicator color={Palette.accent} />
              <Text style={styles.stateText}>Memuat laporan...</Text>
            </Card>
          ) : null}

          {!isLoading && errorMessage ? (
            <Card style={styles.stateCard}>
              <Text style={styles.stateTitle}>Laporan belum bisa dibuka</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                onPress={loadTransactions}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                <IconRefresh size={15} color={Palette.background} strokeWidth={2} />
                <Text style={styles.retryText}>Coba lagi</Text>
              </Pressable>
            </Card>
          ) : null}

          {!isLoading && !errorMessage ? (
            <>
              <Card style={styles.totalCard}>
                <Text style={textStyles.muted}>{report.totalLabel}</Text>
                <Text style={styles.totalAmount}>{formatRupiah(report.currentWeekExpense)}</Text>
                <View style={styles.trendRow}>
                  {report.trendPercent > 0 ? (
                    <IconTrendingUp size={15} color={Palette.expense} strokeWidth={1.9} />
                  ) : (
                    <IconTrendingDown size={15} color={Palette.accent} strokeWidth={1.9} />
                  )}
                  <Text style={report.trendPercent > 0 ? styles.trendTextUp : styles.trendTextDown}>
                    {getTrendText(report.trendPercent, period)}
                  </Text>
                </View>
              </Card>

              <View>
                <SectionLabel>Per Kategori</SectionLabel>
                {report.categoryReports.length > 0 ? (
                  <Card style={styles.categoryCard}>
                    {report.categoryReports.map((item, index) => {
                      const visual = getCategoryVisual(item.category);
                      return (
                        <View key={item.category} style={[styles.categoryRow, index > 0 && styles.rowBorder]}>
                          <View style={styles.categoryTop}>
                            <IconCircle icon={visual.icon} color={visual.color} background={visual.background} />
                            <View style={styles.categoryText}>
                              <Text style={textStyles.title}>{item.category}</Text>
                              <Text style={textStyles.tiny}>{item.progress}% dari total minggu ini</Text>
                            </View>
                            <Text style={styles.categoryAmount}>{formatRupiah(item.amount)}</Text>
                          </View>
                          <ProgressBar value={item.progress} warning={item.progress > 80} />
                        </View>
                      );
                    })}
                  </Card>
                ) : (
                  <Card style={styles.stateCard}>
                    <IconReceipt size={28} color={Palette.textTertiary} strokeWidth={1.7} />
                    <Text style={styles.stateTitle}>Belum ada data laporan</Text>
                    <Text style={styles.stateText}>
                      Simpan transaksi pengeluaran dari Chat AI agar laporan mingguan terisi.
                    </Text>
                  </Card>
                )}
              </View>

              <Card accent style={styles.aiCard}>
                <View style={styles.aiHeader}>
                  <IconRobot size={17} color={Palette.accent} strokeWidth={1.9} />
                  <Text style={styles.aiTitle}>Analisis AI Mingguan</Text>
                </View>
                <Text style={styles.aiBody}>{report.aiSummary}</Text>
              </Card>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function buildReport(transactions: SavedTransaction[], period: 'weekly' | 'monthly') {
  const today = startOfDay(new Date());
  const days = period === 'weekly' ? 7 : 30;
  const currentWeekStart = addDays(today, -(days - 1));
  const previousWeekStart = addDays(today, -((days * 2) - 1));
  const previousWeekEnd = addDays(today, -days);

  const currentWeekExpenses = transactions.filter((transaction) =>
    isExpenseBetween(transaction, currentWeekStart, today),
  );
  const previousWeekExpense = sumExpenses(
    transactions.filter((transaction) => isExpenseBetween(transaction, previousWeekStart, previousWeekEnd)),
  );
  const currentWeekExpense = sumExpenses(currentWeekExpenses);
  const trendPercent = getTrendPercent(currentWeekExpense, previousWeekExpense);
  const categoryReports = buildCategoryReports(currentWeekExpenses, currentWeekExpense);

  return {
    aiSummary: buildAiSummary(categoryReports, currentWeekExpense, trendPercent, period),
    categoryReports,
    currentWeekExpense,
    monthLabel: today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    totalLabel: period === 'weekly' ? 'Total Pengeluaran 7 Hari Terakhir' : 'Total Pengeluaran 30 Hari Terakhir',
    trendPercent,
  };
}

function buildCategoryReports(transactions: SavedTransaction[], totalExpense: number) {
  const totals = transactions.reduce<Record<string, number>>((acc, transaction) => {
    const category = transaction.category_name?.trim() || 'Lainnya';
    acc[category] = (acc[category] ?? 0) + transaction.amount;
    return acc;
  }, {});

  return Object.entries(totals)
    .map<CategoryReport>(([category, amount]) => ({
      amount,
      category,
      progress: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function buildAiSummary(
  categoryReports: CategoryReport[],
  totalExpense: number,
  trendPercent: number,
  period: 'weekly' | 'monthly',
) {
  const periodLabel = period === 'weekly' ? 'minggu ini' : '30 hari terakhir';
  const previousLabel = period === 'weekly' ? '7 hari sebelumnya' : '30 hari sebelumnya';

  if (totalExpense === 0) {
    return `Belum ada pengeluaran tersimpan untuk ${periodLabel}. Setelah kamu menyimpan transaksi, ringkasan pola pengeluaran akan muncul di sini.`;
  }

  const biggestCategory = categoryReports[0];
  const trendText = trendPercent > 0
    ? `naik ${trendPercent}% dibanding ${previousLabel}`
    : trendPercent < 0
      ? `turun ${Math.abs(trendPercent)}% dibanding ${previousLabel}`
      : `stabil dibanding ${previousLabel}`;

  return `Pengeluaran ${periodLabel} ${formatRupiah(totalExpense)} dan ${trendText}. Kategori terbesar adalah ${biggestCategory.category} sebesar ${formatRupiah(biggestCategory.amount)}.`;
}

function getTrendPercent(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function getTrendText(trendPercent: number, period: 'weekly' | 'monthly') {
  const previousLabel = period === 'weekly' ? '7 hari sebelumnya' : '30 hari sebelumnya';

  if (trendPercent > 0) {
    return `Naik ${trendPercent}% dari ${previousLabel}`;
  }

  if (trendPercent < 0) {
    return `Turun ${Math.abs(trendPercent)}% dari ${previousLabel}`;
  }

  return `Stabil dari ${previousLabel}`;
}

function sumExpenses(transactions: SavedTransaction[]) {
  return transactions.reduce((total, transaction) => total + transaction.amount, 0);
}

function isExpenseBetween(transaction: SavedTransaction, startDate: Date, endDate: Date) {
  if (transaction.type !== 'expense') {
    return false;
  }

  const date = parseDatabaseDate(transaction.date);
  return date >= startDate && date <= endDate;
}

function parseDatabaseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return startOfDay(new Date(value));
  }

  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getCategoryVisual(category: string) {
  const key = category.toLowerCase() as keyof typeof categoryVisuals;
  return categoryVisuals[key] ?? categoryVisuals.lainnya;
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
    textTransform: 'capitalize',
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
  trendTextUp: {
    color: Palette.expense,
    fontSize: 12,
  },
  trendTextDown: {
    color: Palette.accent,
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
  stateCard: {
    alignItems: 'center',
    gap: 10,
  },
  stateTitle: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  stateText: {
    color: Palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {
    color: Palette.background,
    fontSize: 12,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.72,
  },
});
