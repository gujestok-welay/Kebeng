import type { ParsedTransaction, TransactionType } from './geminiService';

export type SavedTransaction = {
  id: number;
  type: TransactionType;
  amount: number;
  category_id: number | null;
  category_name: string | null;
  description: string | null;
  source: 'chat' | 'photo' | 'manual';
  date: string;
  created_at: string;
};

const STORAGE_KEY = 'kebeng_transactions';

export async function initDatabase() {
  try {
    readTransactions();
    return true;
  } catch (error) {
    throw toDatabaseError(error, 'Penyimpanan web belum bisa disiapkan.');
  }
}

export async function saveParsedTransaction(transaction: ParsedTransaction) {
  try {
    if (!transaction.type || !transaction.amount || !transaction.date) {
      throw new Error('Data transaksi belum lengkap.');
    }

    const transactions = readTransactions();
    const id = Date.now();
    const nextTransaction: SavedTransaction = {
      id,
      type: transaction.type,
      amount: transaction.amount,
      category_id: null,
      category_name: transaction.category,
      description: transaction.description,
      source: 'chat',
      date: transaction.date,
      created_at: new Date().toISOString(),
    };

    writeTransactions([nextTransaction, ...transactions]);

    return id;
  } catch (error) {
    throw toDatabaseError(error, 'Transaksi belum bisa disimpan.');
  }
}

export async function getRecentTransactions(limit = 10) {
  try {
    return readTransactions().slice(0, limit);
  } catch (error) {
    throw toDatabaseError(error, 'Transaksi belum bisa dibaca.');
  }
}

function readTransactions() {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  const value = JSON.parse(rawValue);

  return Array.isArray(value) ? (value as SavedTransaction[]) : [];
}

function writeTransactions(transactions: SavedTransaction[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function toDatabaseError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return new Error(error.message || fallbackMessage);
  }

  return new Error(fallbackMessage);
}
