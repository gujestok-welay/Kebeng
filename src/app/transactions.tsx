import {
  IconCamera,
  IconMessageCircle,
  IconPencil,
  IconReceipt,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIcon, IconCircle, ScreenShell, SectionLabel, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { getRecentTransactions, initDatabase, SavedTransaction } from '@/services/dbService';
import { formatSignedRupiah } from '@/utils/format';

const sourceLabels = {
  chat: 'Chat AI',
  photo: 'Foto',
  manual: 'Manual',
} as const;

const sourceIcons = {
  chat: IconMessageCircle,
  photo: IconCamera,
  manual: IconPencil,
} as const;

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<SavedTransaction[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTransactions = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      await initDatabase();
      const rows = await getRecentTransactions(100);
      setTransactions(rows);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Transaksi belum bisa dibaca.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.type === activeFilter);
  }, [activeFilter, transactions]);

  const grouped = useMemo(
    () =>
      filteredTransactions.reduce<Record<string, SavedTransaction[]>>((acc, item) => {
        const label = formatDisplayDate(item.date);
        acc[label] = [...(acc[label] ?? []), item];
        return acc;
      }, {}),
    [filteredTransactions],
  );

  return (
    <ScreenShell>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={textStyles.pageTitle}>Transaksi</Text>
          <HeaderIcon icon={IconSearch} />
        </View>

        <View style={styles.filters}>
          {[
            { label: 'Semua', value: 'all' },
            { label: 'Pengeluaran', value: 'expense' },
            { label: 'Pemasukan', value: 'income' },
          ].map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                onPress={() => setActiveFilter(filter.value as typeof activeFilter)}
                style={({ pressed }) => [
                  styles.filter,
                  isActive && styles.activeFilter,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              tintColor={Palette.accent}
              onRefresh={() => loadTransactions(true)}
            />
          }
          showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={Palette.accent} />
              <Text style={styles.stateText}>Memuat transaksi...</Text>
            </View>
          ) : null}

          {!isLoading && errorMessage ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Data belum bisa dibuka</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                onPress={() => loadTransactions()}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                <IconRefresh size={15} color={Palette.background} strokeWidth={2} />
                <Text style={styles.retryText}>Coba lagi</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !errorMessage && filteredTransactions.length === 0 ? (
            <View style={styles.stateCard}>
              <IconReceipt size={28} color={Palette.textTertiary} strokeWidth={1.7} />
              <Text style={styles.stateTitle}>Belum ada transaksi</Text>
              <Text style={styles.stateText}>
                Transaksi yang disimpan dari Chat AI akan muncul di sini.
              </Text>
            </View>
          ) : null}

          {!isLoading && !errorMessage
            ? Object.entries(grouped).map(([day, items]) => (
                <View key={day}>
                  <SectionLabel>{day}</SectionLabel>
                  <View style={styles.dayCard}>
                    {items.map((item, index) => {
                      const SourceIcon = sourceIcons[item.source] ?? IconPencil;
                      const isIncome = item.type === 'income';
                      return (
                        <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                          <IconCircle
                            icon={IconReceipt}
                            color={isIncome ? Palette.accent : Palette.expense}
                            background={isIncome ? Palette.accentDark : Palette.expenseBg}
                          />
                          <View style={styles.mainText}>
                            <Text style={textStyles.title}>
                              {item.description || item.category_name || 'Transaksi'}
                            </Text>
                            <Text style={textStyles.tiny}>
                              {(item.category_name ?? 'Lainnya')} · {formatDisplayDate(item.date)}
                            </Text>
                            <View style={styles.sourceBadge}>
                              <SourceIcon size={10} color={Palette.textSecondary} strokeWidth={1.8} />
                              <Text style={styles.sourceText}>{sourceLabels[item.source] ?? item.source}</Text>
                            </View>
                          </View>
                          <Text style={isIncome ? styles.incomeText : styles.expenseText}>
                            {formatSignedRupiah(item.amount, item.type)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            : null}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 18,
  },
  filter: {
    borderColor: Palette.border,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  activeFilter: {
    backgroundColor: Palette.accentDark,
    borderColor: Palette.accent,
  },
  filterText: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  activeFilterText: {
    color: Palette.accent,
  },
  content: {
    gap: 18,
    paddingBottom: 100,
    paddingTop: 22,
  },
  dayCard: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
  },
  rowBorder: {
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mainText: {
    flex: 1,
    gap: 4,
  },
  sourceBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Palette.grayBg,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sourceText: {
    color: Palette.textSecondary,
    fontSize: 10,
  },
  incomeText: {
    color: Palette.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  expenseText: {
    color: Palette.expense,
    fontSize: 14,
    fontWeight: '500',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 22,
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
