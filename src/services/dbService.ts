import * as SQLite from 'expo-sqlite';

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

export type TransactionSource = 'chat' | 'photo' | 'manual';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDatabase() {
  try {
    const db = await getDatabase();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS categories (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        icon          TEXT,
        type          TEXT NOT NULL,
        is_default    INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        type          TEXT NOT NULL,
        amount        REAL NOT NULL,
        category_id   INTEGER,
        description   TEXT,
        source        TEXT,
        date          TEXT NOT NULL,
        created_at    TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        type          TEXT NOT NULL,
        category_id   INTEGER,
        amount        REAL NOT NULL,
        month         TEXT NOT NULL,
        created_at    TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      CREATE TABLE IF NOT EXISTS notifications_log (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        type          TEXT NOT NULL,
        message       TEXT,
        sent_at       TEXT DEFAULT (datetime('now')),
        is_read       INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS settings (
        key           TEXT PRIMARY KEY,
        value         TEXT
      );
    `);

    await seedDefaultCategories(db);

    return db;
  } catch (error) {
    throw toDatabaseError(error, 'Database belum bisa disiapkan.');
  }
}

export async function saveParsedTransaction(transaction: ParsedTransaction, source: TransactionSource = 'chat') {
  try {
    if (!transaction.type || !transaction.amount || !transaction.date) {
      throw new Error('Data transaksi belum lengkap.');
    }

    const db = await initDatabase();
    const categoryId = transaction.category
      ? await findOrCreateCategory(db, transaction.category, transaction.type)
      : null;

    const result = await db.runAsync(
      `
      INSERT INTO transactions (type, amount, category_id, description, source, date)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      transaction.type,
      transaction.amount,
      categoryId,
      transaction.description ?? null,
      source,
      transaction.date,
    );

    return result.lastInsertRowId;
  } catch (error) {
    throw toDatabaseError(error, 'Transaksi belum bisa disimpan.');
  }
}

export async function getRecentTransactions(limit = 10) {
  try {
    const db = await initDatabase();

    return await db.getAllAsync<SavedTransaction>(
      `
      SELECT
        transactions.*,
        categories.name AS category_name
      FROM transactions
      LEFT JOIN categories ON categories.id = transactions.category_id
      ORDER BY date DESC, created_at DESC
      LIMIT ?
      `,
      limit,
    );
  } catch (error) {
    throw toDatabaseError(error, 'Transaksi belum bisa dibaca.');
  }
}

async function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync('kebeng.db');
  return databasePromise;
}

async function seedDefaultCategories(db: SQLite.SQLiteDatabase) {
  const defaults = [
    { name: 'Makanan', icon: 'utensils', type: 'expense' },
    { name: 'Minuman', icon: 'coffee', type: 'expense' },
    { name: 'Transport', icon: 'bus', type: 'expense' },
    { name: 'Belanja', icon: 'shopping-cart', type: 'expense' },
    { name: 'Hiburan', icon: 'gamepad', type: 'expense' },
    { name: 'Kesehatan', icon: 'heart', type: 'expense' },
    { name: 'Pendidikan', icon: 'book', type: 'expense' },
    { name: 'Lainnya', icon: 'dots', type: 'expense' },
    { name: 'Pemasukan', icon: 'cash', type: 'income' },
  ];

  for (const category of defaults) {
    await db.runAsync(
      `
      INSERT INTO categories (name, icon, type, is_default)
      SELECT ?, ?, ?, 1
      WHERE NOT EXISTS (
        SELECT 1 FROM categories WHERE lower(name) = lower(?) AND type = ?
      )
      `,
      category.name,
      category.icon,
      category.type,
      category.name,
      category.type,
    );
  }
}

async function findOrCreateCategory(
  db: SQLite.SQLiteDatabase,
  categoryName: string,
  type: TransactionType,
) {
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM categories WHERE lower(name) = lower(?) AND type = ? LIMIT 1',
    categoryName,
    type,
  );

  if (existing) {
    return existing.id;
  }

  const result = await db.runAsync(
    'INSERT INTO categories (name, icon, type, is_default) VALUES (?, ?, ?, 0)',
    categoryName,
    'dots',
    type,
  );

  return result.lastInsertRowId;
}

function toDatabaseError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return new Error(error.message || fallbackMessage);
  }

  return new Error(fallbackMessage);
}
