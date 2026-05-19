import {
  IconCamera,
  IconCheck,
  IconMessageCircle,
  IconPencil,
  IconReceipt,
  IconRefresh,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIcon, IconCircle, ScreenShell, SectionLabel, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import {
  deleteTransaction,
  getRecentTransactions,
  initDatabase,
  SavedTransaction,
  updateTransaction,
} from '@/services/dbService';
import type { ParsedTransaction, TransactionType } from '@/services/geminiService';
import { formatRupiah, formatSignedRupiah } from '@/utils/format';

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
  const [selectedTransaction, setSelectedTransaction] = useState<SavedTransaction | null>(null);
  const [editDraft, setEditDraft] = useState<ParsedTransaction | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  function openEditor(transaction: SavedTransaction) {
    setSelectedTransaction(transaction);
    setEditDraft({
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category_name ?? '',
      description: transaction.description ?? '',
      date: transaction.date,
      confidence: 1,
    });
  }

  function closeEditor() {
    setSelectedTransaction(null);
    setEditDraft(null);
  }

  async function handleSaveEdit() {
    if (!selectedTransaction || !editDraft || isSavingEdit) {
      return;
    }

    if (!editDraft.amount || !editDraft.category || !editDraft.description || !editDraft.date) {
      Alert.alert('Data belum lengkap', 'Lengkapi nominal, kategori, deskripsi, dan tanggal dulu.');
      return;
    }

    setIsSavingEdit(true);

    try {
      await updateTransaction(selectedTransaction.id, editDraft);
      closeEditor();
      await loadTransactions();
    } catch (error) {
      Alert.alert('Gagal memperbarui', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleDelete() {
    if (!selectedTransaction) {
      return;
    }

    Alert.alert('Hapus transaksi?', 'Transaksi ini akan dihapus dari penyimpanan lokal.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(selectedTransaction.id);
            closeEditor();
            await loadTransactions();
          } catch (error) {
            Alert.alert('Gagal menghapus', error instanceof Error ? error.message : 'Coba lagi sebentar.');
          }
        },
      },
    ]);
  }

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
                Catatan dari manual, Chat AI, dan foto struk akan muncul di sini.
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
                        <Pressable
                          key={item.id}
                          onPress={() => openEditor(item)}
                          style={({ pressed }) => [
                            styles.row,
                            index > 0 && styles.rowBorder,
                            pressed && styles.pressed,
                          ]}>
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
                              {(item.category_name ?? 'Lainnya')} - {formatDisplayDate(item.date)}
                            </Text>
                            <View style={styles.sourceBadge}>
                              <SourceIcon size={10} color={Palette.textSecondary} strokeWidth={1.8} />
                              <Text style={styles.sourceText}>{sourceLabels[item.source] ?? item.source}</Text>
                            </View>
                          </View>
                          <Text style={isIncome ? styles.incomeText : styles.expenseText}>
                            {formatSignedRupiah(item.amount, item.type)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))
            : null}
        </ScrollView>

        <EditTransactionModal
          draft={editDraft}
          saving={isSavingEdit}
          visible={Boolean(selectedTransaction && editDraft)}
          onChange={setEditDraft}
          onClose={closeEditor}
          onDelete={handleDelete}
          onSave={handleSaveEdit}
        />
      </SafeAreaView>
    </ScreenShell>
  );
}

function EditTransactionModal({
  draft,
  onChange,
  onClose,
  onDelete,
  onSave,
  saving,
  visible,
}: {
  draft: ParsedTransaction | null;
  onChange: (draft: ParsedTransaction | null) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  saving: boolean;
  visible: boolean;
}) {
  if (!draft) {
    return null;
  }

  const currentDraft = draft;

  function update(field: keyof ParsedTransaction, value: ParsedTransaction[keyof ParsedTransaction]) {
    onChange({
      type: field === 'type' ? value as ParsedTransaction['type'] : currentDraft.type,
      amount: field === 'amount' ? value as ParsedTransaction['amount'] : currentDraft.amount,
      category: field === 'category' ? value as ParsedTransaction['category'] : currentDraft.category,
      description: field === 'description' ? value as ParsedTransaction['description'] : currentDraft.description,
      date: field === 'date' ? value as ParsedTransaction['date'] : currentDraft.date,
      confidence: field === 'confidence' ? value as number : currentDraft.confidence,
    });
  }

  function updateType(type: TransactionType) {
    onChange({
      type,
      amount: currentDraft.amount,
      category: currentDraft.category,
      description: currentDraft.description,
      date: currentDraft.date,
      confidence: currentDraft.confidence,
    });
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.editSheet}>
          <Text style={styles.editTitle}>Edit transaksi</Text>

          <View style={styles.typeSwitch}>
            <Pressable
              onPress={() => updateType('expense')}
              style={[styles.typeOption, draft.type === 'expense' && styles.typeOptionActive]}>
              <Text style={[styles.typeText, draft.type === 'expense' && styles.typeTextActive]}>
                Pengeluaran
              </Text>
            </Pressable>
            <Pressable
              onPress={() => updateType('income')}
              style={[styles.typeOption, draft.type === 'income' && styles.typeOptionActive]}>
              <Text style={[styles.typeText, draft.type === 'income' && styles.typeTextActive]}>
                Pemasukan
              </Text>
            </Pressable>
          </View>

          <EditField
            keyboardType="numeric"
            label="Nominal"
            preview={draft.amount ? formatRupiah(draft.amount) : 'Rp 0'}
            value={draft.amount ? String(draft.amount) : ''}
            onChangeText={(value) => update('amount', Number(value.replace(/\D/g, '')) || null)}
          />
          <EditField label="Kategori" value={draft.category ?? ''} onChangeText={(value) => update('category', value)} />
          <EditField
            label="Deskripsi"
            value={draft.description ?? ''}
            onChangeText={(value) => update('description', value)}
          />
          <EditField label="Tanggal" value={draft.date ?? ''} onChangeText={(value) => update('date', value)} />

          <View style={styles.editActions}>
            <Pressable
              disabled={saving}
              onPress={onSave}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
              <IconCheck size={16} color={Palette.background} strokeWidth={2} />
              <Text style={styles.saveButtonText}>Simpan</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={onDelete}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
              <IconTrash size={16} color={Palette.expense} strokeWidth={1.9} />
              <Text style={styles.deleteButtonText}>Hapus</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditField({
  keyboardType,
  label,
  onChangeText,
  preview,
  value,
}: {
  keyboardType?: 'default' | 'numeric';
  label: string;
  onChangeText: (value: string) => void;
  preview?: string;
  value: string;
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      {preview ? <Text style={styles.amountPreview}>{preview}</Text> : null}
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={Palette.textTertiary}
        style={styles.editInput}
        value={value}
      />
    </View>
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  editSheet: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
    maxWidth: 520,
    padding: 16,
    width: '100%',
  },
  editTitle: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  typeSwitch: {
    backgroundColor: Palette.grayBg,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 4,
  },
  typeOption: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    paddingVertical: 9,
  },
  typeOptionActive: {
    backgroundColor: Palette.cardAccent,
  },
  typeText: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  typeTextActive: {
    color: Palette.accent,
    fontWeight: '500',
  },
  editField: {
    gap: 7,
  },
  editLabel: {
    color: Palette.textTertiary,
    fontSize: 11,
  },
  amountPreview: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: '500',
  },
  editInput: {
    backgroundColor: Palette.grayBg,
    borderRadius: 12,
    color: Palette.text,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 42,
  },
  saveButtonText: {
    color: Palette.background,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: Palette.expenseBg,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 42,
  },
  deleteButtonText: {
    color: Palette.expense,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
});
