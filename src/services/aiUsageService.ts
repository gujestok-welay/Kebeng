import { getSettingValue, setSettingValue } from './dbService';

export type AiUsage = {
  chatCount: number;
  date: string;
  receiptCount: number;
};

export type AiUsageKind = 'chat' | 'receipt';

export const AI_USAGE_LIMITS = {
  chatDaily: 30,
  chatMaxCharacters: 1000,
  receiptDaily: 5,
  receiptMaxBytes: 2_500_000,
} as const;

const STORAGE_KEY = 'ai_usage';
let memoryUsage: AiUsage | null = null;

export async function getAiUsage() {
  try {
    const today = getTodayKey();
    const usage = await readStoredUsage();

    if (usage?.date === today) {
      return usage;
    }

    const freshUsage = createEmptyUsage(today);
    writeUsage(freshUsage);
    return freshUsage;
  } catch {
    return createEmptyUsage(getTodayKey());
  }
}

export async function recordAiUsage(kind: AiUsageKind) {
  const usage = await getAiUsage();
  const nextUsage: AiUsage = {
    ...usage,
    chatCount: kind === 'chat' ? usage.chatCount + 1 : usage.chatCount,
    receiptCount: kind === 'receipt' ? usage.receiptCount + 1 : usage.receiptCount,
  };

  writeUsage(nextUsage);
  return nextUsage;
}

export function canUseAi(usage: AiUsage, kind: AiUsageKind) {
  if (kind === 'chat') {
    return usage.chatCount < AI_USAGE_LIMITS.chatDaily;
  }

  return usage.receiptCount < AI_USAGE_LIMITS.receiptDaily;
}

export function getImageSizeFromBase64(base64: string) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export function formatBytes(bytes: number) {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function readUsage() {
  return memoryUsage;
}

async function readStoredUsage() {
  const rawValue = await getSettingValue(STORAGE_KEY);

  if (!rawValue) {
    return readUsage();
  }

  const value = JSON.parse(rawValue) as Partial<AiUsage>;

  if (
    typeof value.date === 'string' &&
    typeof value.chatCount === 'number' &&
    typeof value.receiptCount === 'number'
  ) {
    return value as AiUsage;
  }

  return null;
}

function writeUsage(usage: AiUsage) {
  memoryUsage = usage;
  setSettingValue(STORAGE_KEY, JSON.stringify(usage)).catch(() => undefined);
}

function createEmptyUsage(date: string): AiUsage {
  return {
    chatCount: 0,
    date,
    receiptCount: 0,
  };
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
