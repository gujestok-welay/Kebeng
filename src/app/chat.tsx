import {
  IconCamera,
  IconCheck,
  IconHistory,
  IconPencil,
  IconRobot,
  IconSend,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
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

import { Badge, Card, HeaderIcon, ProgressBar, ScreenShell, textStyles } from '@/components/kebeng-ui';
import { Palette } from '@/constants/theme';
import {
  AI_USAGE_LIMITS,
  AiUsage,
  canUseAi,
  formatBytes,
  getAiUsage,
  getImageSizeFromBase64,
  recordAiUsage,
} from '@/services/aiUsageService';
import { initDatabase, saveParsedTransaction } from '@/services/dbService';
import {
  parseTransactionFromReceiptImage,
  parseTransactionFromChat,
  parseTransactionLocally,
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
  const netInfo = useNetInfo();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<ParsedTransaction | null>(null);
  const [draftSource, setDraftSource] = useState<'chat' | 'photo' | 'manual'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Kebeng AI sedang membaca transaksi...');
  const [isSaving, setIsSaving] = useState(false);
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const inputLength = input.trim().length;
  const isOnline = netInfo.isConnected !== false && netInfo.isInternetReachable !== false;
  const canSend =
    inputLength > 0 &&
    inputLength <= AI_USAGE_LIMITS.chatMaxCharacters &&
    !isLoading &&
    (!isOnline || !aiUsage || canUseAi(aiUsage, 'chat'));
  const hasLowConfidence = useMemo(() => (draft?.confidence ?? 1) < 0.7, [draft]);

  useEffect(() => {
    initDatabase().catch((error) => {
      addSystemMessage(error instanceof Error ? error.message : 'Database belum siap.');
    });
    refreshAiUsage();
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, draft, isLoading]);

  async function handleSend() {
    const text = input.trim();

    if (!text || isLoading) {
      return;
    }

    if (!isOnline) {
      handleOfflineManualDraft(text);
      return;
    }

    if (text.length > AI_USAGE_LIMITS.chatMaxCharacters) {
      Alert.alert(
        'Teks terlalu panjang',
        `Maksimal ${AI_USAGE_LIMITS.chatMaxCharacters} karakter agar pemakaian AI tetap hemat.`,
      );
      return;
    }

    const currentUsage = aiUsage ?? await getAiUsage();

    if (!canUseAi(currentUsage, 'chat')) {
      Alert.alert('Batas Chat AI tercapai', 'Batas chat AI hari ini sudah habis. Coba lagi besok.');
      setAiUsage(currentUsage);
      return;
    }

    setInput('');
    setDraft(null);
    setDraftSource('chat');
    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: 'user', text }]);
    setLoadingText('Kebeng AI sedang membaca transaksi...');
    setIsLoading(true);

    try {
      setAiUsage(await recordAiUsage('chat'));
      const parsed = await parseTransactionFromChat(text);
      setDraft(parsed);
      setDraftSource('chat');

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

  async function handlePickReceipt() {
    if (isLoading) {
      return;
    }

    try {
      const connection = await NetInfo.fetch();
      const canReachInternet = connection.isConnected !== false && connection.isInternetReachable !== false;

      if (!canReachInternet) {
        addSystemMessage('Foto struk membutuhkan internet. Saat offline, gunakan input teks/manual dulu.');
        return;
      }

      const currentUsage = aiUsage ?? await getAiUsage();

      if (!canUseAi(currentUsage, 'receipt')) {
        Alert.alert('Batas foto struk tercapai', 'Batas baca foto struk hari ini sudah habis. Coba lagi besok.');
        setAiUsage(currentUsage);
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Izin diperlukan', 'Izinkan akses galeri agar Kebeng bisa membaca foto struk.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.75,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.base64) {
        Alert.alert('Foto belum bisa dibaca', 'Pilih foto lain atau coba ulangi.');
        return;
      }

      const imageBytes = asset.fileSize ?? getImageSizeFromBase64(asset.base64);

      if (imageBytes > AI_USAGE_LIMITS.receiptMaxBytes) {
        Alert.alert(
          'Foto terlalu besar',
          `Ukuran foto ${formatBytes(imageBytes)}. Gunakan foto di bawah ${formatBytes(AI_USAGE_LIMITS.receiptMaxBytes)} agar AI lebih cepat dan hemat.`,
        );
        return;
      }

      setDraft(null);
      setDraftSource('photo');
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-user-photo`,
          role: 'user',
          text: `Mengunggah foto struk: ${asset.fileName || 'struk'}`,
        },
      ]);
      setLoadingText('Kebeng AI sedang membaca foto struk...');
      setIsLoading(true);

      setAiUsage(await recordAiUsage('receipt'));
      const parsed = await parseTransactionFromReceiptImage({
        base64: asset.base64,
        mimeType: asset.mimeType,
      });

      setDraft(parsed);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-ai-photo`,
          role: 'ai',
          text: parsed.confidence < 0.7
            ? 'Hasil baca struk masih kurang yakin. Cek dan edit dulu sebelum disimpan ya.'
            : 'Aku sudah baca foto struknya. Cek hasilnya, lalu simpan kalau sudah benar.',
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
      await saveParsedTransaction(draft, draftSource);
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

  async function refreshAiUsage() {
    setAiUsage(await getAiUsage());
  }

  function handleOfflineManualDraft(text: string) {
    const parsed = parseTransactionLocally(text);

    setInput('');
    setDraft(parsed);
    setDraftSource('manual');
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user-offline`, role: 'user', text },
      {
        id: `${Date.now()}-system-offline`,
        role: 'system',
        text: 'Offline aktif. Aku buat draft manual dari teksmu, cek lalu simpan.',
      },
    ]);
  }

  return (
    <ScreenShell>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={textStyles.pageTitle}>{isOnline ? 'Chat AI' : 'Catat transaksi'}</Text>
            <Text style={styles.subtitle}>
              {isOnline ? 'Cerita pengeluaranmu secara natural' : 'Mode offline, simpan manual dari teksmu'}
            </Text>
          </View>
          <HeaderIcon icon={IconHistory} />
        </View>

        <AiUsagePanel usage={aiUsage} inputLength={inputLength} isOnline={isOnline} />

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
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          ) : null}

          {draft ? (
            <ConfirmationCard
              draft={draft}
              lowConfidence={hasLowConfidence}
              saving={isSaving}
              source={draftSource}
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
            disabled={isLoading}
            onPress={handlePickReceipt}
            style={({ pressed }) => [
              styles.cameraButton,
              !isOnline && styles.cameraButtonOffline,
              (isLoading || pressed) && styles.pressed,
            ]}>
            {isLoading ? (
              <ActivityIndicator color={Palette.text} size="small" />
            ) : (
              <IconCamera
                size={20}
                color={isOnline ? Palette.text : Palette.textTertiary}
                strokeWidth={1.8}
              />
            )}
          </Pressable>
          <TextInput
            editable={!isLoading}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder={
              inputLength > AI_USAGE_LIMITS.chatMaxCharacters
                ? 'Teks terlalu panjang'
                : 'Tulis transaksi...'
            }
            placeholderTextColor={Palette.textTertiary}
            returnKeyType="send"
            style={[
              styles.input,
              inputLength > AI_USAGE_LIMITS.chatMaxCharacters && styles.inputWarning,
            ]}
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

function AiUsagePanel({
  inputLength,
  isOnline,
  usage,
}: {
  inputLength: number;
  isOnline: boolean;
  usage: AiUsage | null;
}) {
  const chatCount = usage?.chatCount ?? 0;
  const receiptCount = usage?.receiptCount ?? 0;
  const chatPercent = Math.round((chatCount / AI_USAGE_LIMITS.chatDaily) * 100);
  const receiptPercent = Math.round((receiptCount / AI_USAGE_LIMITS.receiptDaily) * 100);
  const inputPercent = Math.round((inputLength / AI_USAGE_LIMITS.chatMaxCharacters) * 100);
  const isInputWarning = inputLength > AI_USAGE_LIMITS.chatMaxCharacters * 0.85;

  return (
    <Card style={styles.usageCard}>
      <View style={styles.usageHeader}>
        <View style={styles.usageTitleRow}>
          <IconSparkles size={15} color={Palette.accent} strokeWidth={1.9} />
          <Text style={styles.usageTitle}>Mode AI Gratis</Text>
        </View>
        <Text style={styles.usageProvider}>OpenRouter</Text>
      </View>

      <View style={isOnline ? styles.connectionOnline : styles.connectionOffline}>
        <Text style={isOnline ? styles.connectionOnlineText : styles.connectionOfflineText}>
          {isOnline ? 'Online: AI aktif' : 'Offline: gunakan input manual'}
        </Text>
      </View>

      <View style={styles.usageGrid}>
        <UsageMeter
          label="Chat"
          value={chatCount}
          limit={AI_USAGE_LIMITS.chatDaily}
          percent={chatPercent}
        />
        <UsageMeter
          label="Struk"
          value={receiptCount}
          limit={AI_USAGE_LIMITS.receiptDaily}
          percent={receiptPercent}
        />
      </View>

      <View style={styles.inputMeter}>
        <View style={styles.inputMeterHeader}>
          <Text style={styles.usageLabel}>Panjang chat</Text>
          <Text style={isInputWarning ? styles.usageWarningValue : styles.usageValue}>
            {inputLength}/{AI_USAGE_LIMITS.chatMaxCharacters}
          </Text>
        </View>
        <ProgressBar value={inputPercent} warning={isInputWarning} />
      </View>
    </Card>
  );
}

function UsageMeter({
  label,
  value,
  limit,
  percent,
}: {
  label: string;
  limit: number;
  percent: number;
  value: number;
}) {
  const warning = percent >= 80;

  return (
    <View style={styles.usageMeter}>
      <View style={styles.inputMeterHeader}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={warning ? styles.usageWarningValue : styles.usageValue}>
          {value}/{limit}
        </Text>
      </View>
      <ProgressBar value={percent} warning={warning} />
    </View>
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
  source,
  onChange,
  onCancel,
  onSave,
}: {
  draft: ParsedTransaction;
  lowConfidence: boolean;
  saving: boolean;
  source: 'chat' | 'photo' | 'manual';
  onChange: (draft: ParsedTransaction) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const amountText = draft.amount ? String(draft.amount) : '';
  const sourceLabel = source === 'manual' ? 'Manual' : source === 'photo' ? 'Foto' : 'Chat AI';

  function update(field: keyof ParsedTransaction, value: ParsedTransaction[keyof ParsedTransaction]) {
    onChange({ ...draft, [field]: value });
  }

  return (
    <Card accent style={styles.confirmCard}>
      <View style={styles.confirmHeader}>
        <View style={styles.confirmTitleWrap}>
          <Text style={textStyles.title}>Konfirmasi transaksi</Text>
          <Text style={styles.confidenceText}>
            {source === 'manual' ? 'Draft manual dari input offline' : `Keyakinan AI ${Math.round(draft.confidence * 100)}%`}
          </Text>
        </View>
        <View style={styles.confirmBadges}>
          <Badge tone="gray">{sourceLabel}</Badge>
          <Badge tone={draft.type === 'income' ? 'green' : 'red'}>
            {draft.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </Badge>
        </View>
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
  usageCard: {
    gap: 12,
    marginTop: 16,
    paddingVertical: 12,
  },
  usageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  usageTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  usageTitle: {
    color: Palette.text,
    fontSize: 12,
    fontWeight: '500',
  },
  usageProvider: {
    color: Palette.textTertiary,
    fontSize: 11,
  },
  connectionOnline: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accentDark,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  connectionOffline: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.orangeBg,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  connectionOnlineText: {
    color: Palette.accent,
    fontSize: 11,
  },
  connectionOfflineText: {
    color: Palette.orange,
    fontSize: 11,
  },
  usageGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  usageMeter: {
    flex: 1,
    gap: 7,
  },
  inputMeter: {
    gap: 7,
  },
  inputMeterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  usageLabel: {
    color: Palette.textSecondary,
    fontSize: 11,
  },
  usageValue: {
    color: Palette.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  usageWarningValue: {
    color: Palette.orange,
    fontSize: 11,
    fontWeight: '500',
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
  confirmBadges: {
    alignItems: 'flex-end',
    gap: 6,
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
  cameraButtonOffline: {
    borderColor: Palette.orangeBg,
    borderWidth: StyleSheet.hairlineWidth,
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
  inputWarning: {
    borderColor: Palette.orange,
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
