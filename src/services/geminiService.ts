export type TransactionType = 'expense' | 'income';

export type ParsedTransaction = {
  type: TransactionType | null;
  amount: number | null;
  category: string | null;
  description: string | null;
  date: string | null;
  confidence: number;
};

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export async function parseTransactionFromChat(input: string): Promise<ParsedTransaction> {
  try {
    if (!input.trim()) {
      throw new Error('Tulis transaksi dulu ya.');
    }

    if (!GEMINI_API_KEY) {
      return parseTransactionLocally(input);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: buildParsingPrompt(input),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Koneksi ke Gemini bermasalah. Coba lagi sebentar.');
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== 'string') {
      throw new Error('Gemini belum mengembalikan data yang bisa dibaca.');
    }

    return normalizeParsedTransaction(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Hasil Gemini belum sesuai format JSON. Coba tulis transaksi lebih jelas.');
    }

    throw error instanceof Error
      ? error
      : new Error('Transaksi belum bisa diproses. Periksa internet lalu coba lagi.');
  }
}

function buildParsingPrompt(input: string) {
  const today = toISODate(new Date());

  return `
Kamu adalah parser transaksi untuk aplikasi keuangan personal Bahasa Indonesia.
Ekstrak data dari pesan user menjadi JSON valid saja, tanpa markdown.

Format wajib:
{
  "type": "expense" | "income",
  "amount": 25000,
  "category": "Makan",
  "description": "makan siang",
  "date": "YYYY-MM-DD",
  "confidence": 0.95
}

Aturan:
- Hari ini adalah ${today}.
- Jika nominal, kategori, deskripsi, atau tanggal tidak jelas, isi null dan turunkan confidence.
- Jangan mengarang data yang tidak ada.
- Gunakan kategori ringkas Bahasa Indonesia, misalnya Makanan, Transport, Belanja, Hiburan, Kesehatan, Pendidikan, Pemasukan, Lainnya.
- Expense untuk pengeluaran, income untuk pemasukan.

Pesan user:
"${input}"
`.trim();
}

function normalizeParsedTransaction(value: Partial<ParsedTransaction>): ParsedTransaction {
  const type = value.type === 'income' || value.type === 'expense' ? value.type : null;
  const amount = typeof value.amount === 'number' && Number.isFinite(value.amount) ? value.amount : null;
  const confidence =
    typeof value.confidence === 'number' && Number.isFinite(value.confidence)
      ? Math.max(0, Math.min(1, value.confidence))
      : 0.5;

  return {
    type,
    amount,
    category: typeof value.category === 'string' && value.category.trim() ? value.category.trim() : null,
    description:
      typeof value.description === 'string' && value.description.trim() ? value.description.trim() : null,
    date: typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date) ? value.date : null,
    confidence,
  };
}

function parseTransactionLocally(input: string): ParsedTransaction {
  const normalized = input.toLowerCase();
  const amount = parseAmount(normalized);
  const type: TransactionType = /(gaji|terima|dapat|masuk|pemasukan|bonus|bayaran)/i.test(normalized)
    ? 'income'
    : 'expense';
  const category = detectCategory(normalized, type);
  const description = cleanDescription(input);
  const confidence = amount ? 0.72 : 0.45;

  return {
    type,
    amount,
    category,
    description,
    date: toISODate(new Date()),
    confidence,
  };
}

function parseAmount(input: string) {
  const match = input.match(/(?:rp\s*)?(\d+(?:[.,]\d{3})*|\d+(?:[.,]\d+)?)(\s?rb|\s?ribu|\s?k|jt|juta)?/i);

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

function detectCategory(input: string, type: TransactionType) {
  if (type === 'income') {
    return 'Pemasukan';
  }

  const rules = [
    { category: 'Makanan', keywords: ['makan', 'nasi', 'ayam', 'bakso', 'mie', 'sarapan', 'siang', 'malam'] },
    { category: 'Minuman', keywords: ['kopi', 'teh', 'boba', 'minum'] },
    { category: 'Transport', keywords: ['ojek', 'gojek', 'grab', 'bensin', 'parkir', 'tol', 'bus', 'kereta'] },
    { category: 'Belanja', keywords: ['belanja', 'beli', 'market', 'mall', 'shopee', 'tokopedia'] },
    { category: 'Hiburan', keywords: ['bioskop', 'game', 'netflix', 'spotify', 'tiket'] },
    { category: 'Kesehatan', keywords: ['obat', 'dokter', 'klinik', 'vitamin'] },
    { category: 'Pendidikan', keywords: ['buku', 'kursus', 'kelas', 'sekolah'] },
  ];

  return rules.find((rule) => rule.keywords.some((keyword) => input.includes(keyword)))?.category ?? 'Lainnya';
}

function cleanDescription(input: string) {
  return (
    input
      .replace(/(?:rp\s*)?\d+(?:[.,]\d{3})*(?:\s?rb|\s?ribu|\s?k|jt|juta)?/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || input.trim()
  );
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
