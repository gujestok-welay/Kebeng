import { IconCalendar, IconCheck, IconPencil, IconReceipt } from '@tabler/icons-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, HeaderIcon, ScreenShell, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { saveParsedTransaction } from '@/services/dbService';
import type { ParsedTransaction, TransactionType } from '@/services/geminiService';
import { formatRupiah } from '@/utils/format';

const expenseCategories = ['Makanan', 'Minuman', 'Transport', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'];
const incomeCategories = ['Pemasukan', 'Gaji', 'Bonus', 'Lainnya'];

export default function ManualScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ description?: string }>();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));
  const [isSaving, setIsSaving] = useState(false);

  const amountValue = Number(amount.replace(/\D/g, '')) || null;
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (typeof params.description === 'string' && params.description.trim()) {
      const parsedAmount = parseAmount(params.description);
      setDescription(params.description);

      if (parsedAmount) {
        setAmount(String(parsedAmount));
      }
    }
  }, [params.description]);

  async function handleSave() {
    const transaction: ParsedTransaction = {
      type,
      amount: amountValue,
      category,
      description: description.trim() || category,
      date,
      confidence: 1,
    };

    if (!transaction.amount || !transaction.category || !transaction.description || !transaction.date) {
      Alert.alert('Data belum lengkap', 'Isi nominal, kategori, deskripsi, dan tanggal dulu.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      Alert.alert('Tanggal belum valid', 'Gunakan format tanggal YYYY-MM-DD.');
      return;
    }

    setIsSaving(true);

    try {
      await saveParsedTransaction(transaction, 'manual');
      Alert.alert('Berhasil', 'Transaksi manual berhasil disimpan.', [
        { text: 'Lihat transaksi', onPress: () => router.push('/transactions') },
        { text: 'Tambah lagi', style: 'cancel', onPress: resetForm },
      ]);
    } catch (error) {
      Alert.alert('Gagal menyimpan', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setAmount('');
    setDescription('');
    setDate(toISODate(new Date()));
    setType('expense');
    setCategory('Makanan');
  }

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setCategory(nextType === 'income' ? 'Pemasukan' : 'Makanan');
  }

  return (
    <ScreenShell>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <View>
                <Text style={textStyles.pageTitle}>Input Manual</Text>
                <Text style={styles.subtitle}>Tetap catat transaksi walau sedang offline</Text>
              </View>
              <HeaderIcon icon={IconReceipt} />
            </View>

            <Card style={styles.formCard}>
              <View style={styles.typeSwitch}>
                <Pressable
                  onPress={() => handleTypeChange('expense')}
                  style={[styles.typeOption, type === 'expense' && styles.typeOptionActive]}>
                  <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
                    Pengeluaran
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleTypeChange('income')}
                  style={[styles.typeOption, type === 'income' && styles.typeOptionActive]}>
                  <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
                    Pemasukan
                  </Text>
                </Pressable>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nominal</Text>
                <Text style={type === 'income' ? styles.incomePreview : styles.expensePreview}>
                  {amountValue ? formatRupiah(amountValue) : 'Rp 0'}
                </Text>
                <InputRow
                  icon="pencil"
                  keyboardType="numeric"
                  onChangeText={(value) => setAmount(value.replace(/\D/g, ''))}
                  placeholder="25000"
                  value={amount}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Kategori</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((item) => {
                    const active = item === category;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => setCategory(item)}
                        style={({ pressed }) => [
                          styles.categoryPill,
                          active && styles.categoryPillActive,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Deskripsi</Text>
                <InputRow
                  icon="pencil"
                  onChangeText={setDescription}
                  placeholder="makan siang"
                  value={description}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tanggal database</Text>
                <InputRow
                  icon="calendar"
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  value={date}
                />
              </View>

              <Pressable
                disabled={isSaving}
                onPress={handleSave}
                style={({ pressed }) => [styles.saveButton, (isSaving || pressed) && styles.pressed]}>
                {isSaving ? (
                  <ActivityIndicator color={Palette.background} size="small" />
                ) : (
                  <IconCheck size={17} color={Palette.background} strokeWidth={2} />
                )}
                <Text style={styles.saveButtonText}>Simpan Transaksi</Text>
              </Pressable>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function InputRow({
  icon,
  keyboardType,
  onChangeText,
  placeholder,
  value,
}: {
  icon: 'calendar' | 'pencil';
  keyboardType?: 'default' | 'numeric';
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const Icon = icon === 'calendar' ? IconCalendar : IconPencil;

  return (
    <View style={styles.inputWrap}>
      <Icon size={14} color={Palette.textTertiary} strokeWidth={1.8} />
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.textTertiary}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseAmount(input: string) {
  const match = input
    .toLowerCase()
    .match(/(?:rp\s*)?(\d+(?:[.,]\d{3})*|\d+(?:[.,]\d+)?)(\s?rb|\s?ribu|\s?k|jt|juta)?/i);

  if (!match) {
    return null;
  }

  const rawNumber = match[1];
  const suffix = match[2]?.replace(/\s/g, '').toLowerCase();
  let amount = Number(rawNumber.replace(/\./g, '').replace(',', '.'));

  if (!Number.isFinite(amount)) {
    return null;
  }

  if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') {
    amount *= 1000;
  }

  if (suffix === 'jt' || suffix === 'juta') {
    amount *= 1000000;
  }

  return Math.round(amount);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 18,
    paddingBottom: 110,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitle: {
    color: Palette.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  formCard: {
    gap: 18,
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
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: Palette.textTertiary,
    fontSize: 11,
  },
  incomePreview: {
    color: Palette.accent,
    fontSize: 24,
    fontWeight: '500',
  },
  expensePreview: {
    color: Palette.expense,
    fontSize: 24,
    fontWeight: '500',
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: Palette.grayBg,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  input: {
    color: Palette.text,
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: Palette.grayBg,
    borderColor: Palette.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  categoryPillActive: {
    backgroundColor: Palette.accentDark,
    borderColor: Palette.accent,
  },
  categoryText: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  categoryTextActive: {
    color: Palette.accent,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
  },
  saveButtonText: {
    color: Palette.background,
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
});
