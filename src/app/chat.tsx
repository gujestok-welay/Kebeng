import {
  IconCamera,
  IconCheck,
  IconHistory,
  IconPencil,
  IconRobot,
  IconSend,
  IconTrash,
} from '@tabler/icons-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

import { Badge, Card, HeaderIcon, ScreenShell, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import { initDatabase, saveParsedTransaction } from '@/services/dbService';
import {
  parseTransactionFromChat,
  ParsedTransaction,
} from '@/services/geminiService';
import { formatRupiah } from '@/utils/format';

type ChatMessage = {
  id: string;
  role: 'ai' | 'user' | 'system';
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'ai',
    text: 'Tulis seperti biasa, misalnya beli makan siang 25rb. Aku bantu susun datanya untuk kamu konfirmasi.',
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<ParsedTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const canSend = input.trim().length > 0 && !isLoading;
  const hasLowConfidence = useMemo(() => (draft?.confidence ?? 1) < 0.7, [draft]);

  useEffect(() => {
    initDatabase().catch((error) => {
      addSystemMessage(error instanceof Error ? error.message : 'Database belum siap.');
    });
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, draft, isLoading]);

  async function handleSend() {
    const text = input.trim();

    if (!text || isLoading) {
      return;
    }

    setInput('');
    setDraft(null);
    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: 'user', text }]);
    setIsLoading(true);

    try {
      const parsed = await parseTransactionFromChat(text);
      setDraft(parsed);

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-ai`,
          role: 'ai',
          text: parsed.confidence < 0.7
            ? 'Aku kurang yakin dengan hasilnya. Cek dan edit dulu sebelum disimpan ya.'
            : 'Aku sudah susun draft transaksinya. Cek sebentar, lalu simpan kalau sudah benar.',
        },
      ]);
    } catch (error) {
      addSystemMessage(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveDraft() {
    if (!draft || isSaving) {
      return;
    }

    if (!draft.type || !draft.amount || !draft.category || !draft.description || !draft.date) {
      Alert.alert('Data belum lengkap', 'Lengkapi nominal, kategori, deskripsi, tipe, dan tanggal dulu.');
      return;
    }

    setIsSaving(true);

    try {
      await saveParsedTransaction(draft);
      setDraft(null);
      addSystemMessage('Transaksi berhasil disimpan.');
    } catch (error) {
      Alert.alert('Gagal menyimpan', getFriendlyError(error));
    } finally {
      setIsSaving(false);
    }
  }

  function addSystemMessage(text: string) {
    setMessages((current) => [...current, { id: `${Date.now()}-system`, role: 'system', text }]);
  }

  return (
    <ScreenShell>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={textStyles.pageTitle}>Chat AI</Text>
            <Text style={styles.subtitle}>Cerita pengeluaranmu secara natural</Text>
          </View>
          <HeaderIcon icon={IconHistory} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading ? (
            <View style={styles.loadingBubble}>
              <ActivityIndicator color={Palette.accent} />
              <Text style={styles.loadingText}>Kebeng AI sedang membaca transaksi...</Text>
            </View>
          ) : null}

          {draft ? (
            <ConfirmationCard
              draft={draft}
              lowConfidence={hasLowConfidence}
              saving={isSaving}
              onChange={setDraft}
              onCancel={() => setDraft(null)}
              onSave={handleSaveDraft}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={84}
        style={styles.inputDock}>
        <SafeAreaView edges={['bottom']} style={styles.inputRow}>
          <Pressable
            onPress={() => Alert.alert('Segera hadir', 'Upload foto struk akan masuk di fase berikutnya.')}
            style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}>
            <IconCamera size={20} color={Palette.text} strokeWidth={1.8} />
          </Pressable>
          <TextInput
            editable={!isLoading}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder="Tulis transaksi..."
            placeholderTextColor={Palette.textTertiary}
            returnKeyType="send"
            style={styles.input}
            value={input}
          />
          <Pressable
            disabled={!canSend}
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendButton,
              (!canSend || pressed) && styles.disabledButton,
            ]}>
            {isLoading ? (
              <ActivityIndicator color={Palette.background} size="small" />
            ) : (
              <IconSend size={19} color={Palette.background} strokeWidth={2} />
            )}
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'system') {
    return (
      <View style={styles.systemBubble}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  const isAi = message.role === 'ai';

  return (
    <View style={isAi ? styles.aiBubble : styles.userBubble}>
      {isAi ? (
        <View style={styles.aiHeader}>
          <IconRobot size={15} color={Palette.accent} strokeWidth={1.9} />
          <Text style={styles.aiName}>Kebeng AI</Text>
        </View>
      ) : null}
      <Text style={textStyles.body}>{message.text}</Text>
    </View>
  );
}

function ConfirmationCard({
  draft,
  lowConfidence,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  draft: ParsedTransaction;
  lowConfidence: boolean;
  saving: boolean;
  onChange: (draft: ParsedTransaction) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const amountText = draft.amount ? String(draft.amount) : '';

  function update(field: keyof ParsedTransaction, value: ParsedTransaction[keyof ParsedTransaction]) {
    onChange({ ...draft, [field]: value });
  }

  return (
    <Card accent style={styles.confirmCard}>
      <View style={styles.confirmHeader}>
        <View style={styles.confirmTitleWrap}>
          <Text style={textStyles.title}>Konfirmasi transaksi</Text>
          <Text style={styles.confidenceText}>
            Keyakinan AI {Math.round(draft.confidence * 100)}%
          </Text>
        </View>
        <Badge tone={draft.type === 'income' ? 'green' : 'red'}>
          {draft.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
        </Badge>
      </View>

      {lowConfidence ? (
        <Text style={styles.warningText}>Hasil AI masih kurang yakin. Koreksi field yang belum pas.</Text>
      ) : null}

      <View style={styles.typeSwitch}>
        <Pressable
          onPress={() => update('type', 'expense')}
          style={[styles.typeOption, draft.type === 'expense' && styles.typeOptionActive]}>
          <Text style={[styles.typeText, draft.type === 'expense' && styles.typeTextActive]}>
            Pengeluaran
          </Text>
        </Pressable>
        <Pressable
          onPress={() => update('type', 'income')}
          style={[styles.typeOption, draft.type === 'income' && styles.typeOptionActive]}>
          <Text style={[styles.typeText, draft.type === 'income' && styles.typeTextActive]}>
            Pemasukan
          </Text>
        </Pressable>
      </View>

      <EditableField
        keyboardType="numeric"
        label="Nominal"
        onChangeText={(value) => update('amount', Number(value.replace(/\D/g, '')) || null)}
        prefix={draft.amount ? formatRupiah(draft.amount) : 'Rp 0'}
        value={amountText}
      />
      <EditableField
        label="Kategori"
        onChangeText={(value) => update('category', value)}
        value={draft.category ?? ''}
      />
      <EditableField
        label="Deskripsi"
        onChangeText={(value) => update('description', value)}
        value={draft.description ?? ''}
      />
      <EditableField
        label="Tanggal database"
        onChangeText={(value) => update('date', value)}
        value={draft.date ?? ''}
      />

      <View style={styles.confirmActions}>
        <Pressable
          disabled={saving}
          onPress={onSave}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          {saving ? (
            <ActivityIndicator color={Palette.background} size="small" />
          ) : (
            <IconCheck size={16} color={Palette.background} strokeWidth={2} />
          )}
          <Text style={styles.primaryButtonText}>Simpan</Text>
        </Pressable>
        <Pressable
          disabled={saving}
          onPress={onCancel}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <IconTrash size={16} color={Palette.textSecondary} strokeWidth={1.9} />
          <Text style={styles.secondaryButtonText}>Batal</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function EditableField({
  label,
  value,
  onChangeText,
  keyboardType,
  prefix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
  prefix?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {prefix ? <Text style={styles.amountPreview}>{prefix}</Text> : null}
      <View style={styles.fieldInputWrap}>
        <IconPencil size={14} color={Palette.textTertiary} strokeWidth={1.8} />
        <TextInput
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholderTextColor={Palette.textTertiary}
          style={styles.fieldInput}
          value={value}
        />
      </View>
    </View>
  );
}

function getFriendlyError(error: unknown) {
  if (error instanceof TypeError) {
    return 'Internet sedang tidak tersedia. Cek koneksi lalu coba lagi.';
  }

  return error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi sebentar.';
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
  subtitle: {
    color: Palette.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  chatContent: {
    gap: 14,
    paddingBottom: 176,
    paddingTop: 24,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1c2e24',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
    maxWidth: '88%',
    padding: 14,
  },
  aiHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  aiName: {
    color: Palette.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Palette.card,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderColor: Palette.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '84%',
    padding: 14,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: Palette.grayBg,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  systemText: {
    color: Palette.textSecondary,
    fontSize: 11,
  },
  loadingBubble: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1c2e24',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadingText: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  confirmCard: {
    gap: 14,
  },
  confirmHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmTitleWrap: {
    flex: 1,
    gap: 5,
  },
  confidenceText: {
    color: Palette.textTertiary,
    fontSize: 11,
  },
  warningText: {
    color: Palette.orange,
    fontSize: 12,
    lineHeight: 17,
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
    paddingVertical: 8,
  },
  typeOptionActive: {
    backgroundColor: Palette.card,
  },
  typeText: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  typeTextActive: {
    color: Palette.text,
    fontWeight: '500',
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    color: Palette.textTertiary,
    fontSize: 11,
  },
  amountPreview: {
    color: Palette.expense,
    fontSize: 20,
    fontWeight: '500',
  },
  fieldInputWrap: {
    alignItems: 'center',
    backgroundColor: Palette.grayBg,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  fieldInput: {
    color: Palette.text,
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: Palette.background,
    fontSize: 12,
    fontWeight: '500',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Palette.grayBg,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  inputDock: {
    backgroundColor: Palette.background,
    borderTopColor: Palette.grayBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 74,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  cameraButton: {
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  input: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    color: Palette.text,
    flex: 1,
    fontSize: 13,
    height: 42,
    paddingHorizontal: 16,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
});
