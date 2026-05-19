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
const AI_PROVIDER = process.env.EXPO_PUBLIC_AI_PROVIDER?.toLowerCase();
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_TEXT_MODEL = process.env.EXPO_PUBLIC_OPENROUTER_TEXT_MODEL || 'openrouter/free';
const OPENROUTER_VISION_MODEL =
  process.env.EXPO_PUBLIC_OPENROUTER_VISION_MODEL || 'nvidia/nemotron-nano-12b-v2-vl:free';
const OPENROUTER_FALLBACK_VISION_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function parseTransactionFromChat(input: string): Promise<ParsedTransaction> {
  try {
    if (!input.trim()) {
      throw new Error('Tulis transaksi dulu ya.');
    }

    if (AI_PROVIDER === 'openrouter') {
      if (!OPENROUTER_API_KEY) {
        return parseTransactionLocally(input);
      }

      return parseTransactionWithOpenRouter(input);
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
      throw new Error(await getGeminiErrorMessage(response));
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

export async function parseTransactionFromReceiptImage({
  base64,
  mimeType = 'image/jpeg',
}: {
  base64: string;
  mimeType?: string | null;
}): Promise<ParsedTransaction> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('API key OpenRouter belum tersedia. Cek file .env lalu restart Expo.');
  }

  const firstResult = await parseReceiptImageWithOpenRouterModel({
    base64,
    mimeType,
    model: OPENROUTER_VISION_MODEL,
  }).catch((error: unknown) => error);

  if (isParsedTransaction(firstResult)) {
    return firstResult;
  }

  if (OPENROUTER_VISION_MODEL === OPENROUTER_FALLBACK_VISION_MODEL) {
    throw firstResult instanceof Error
      ? firstResult
      : new Error('OpenRouter belum mengembalikan data yang bisa dibaca.');
  }

  return parseReceiptImageWithOpenRouterModel({
    base64,
    mimeType,
    model: OPENROUTER_FALLBACK_VISION_MODEL,
  });
}

function isParsedTransaction(value: unknown): value is ParsedTransaction {
  return typeof value === 'object' && value !== null && 'confidence' in value;
}

async function parseReceiptImageWithOpenRouterModel({
  base64,
  mimeType = 'image/jpeg',
  model,
}: {
  base64: string;
  mimeType?: string | null;
  model: string;
}) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: getOpenRouterHeaders(),
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildReceiptPrompt(),
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${base64}`,
              },
            },
          ],
        },
      ],
      include_reasoning: false,
      max_tokens: 800,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(await getOpenRouterErrorMessage(response));
  }

  return normalizeParsedTransaction(parseOpenRouterJson(await response.json()));
}

async function parseTransactionWithOpenRouter(input: string) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: getOpenRouterHeaders(),
    body: JSON.stringify({
      model: OPENROUTER_TEXT_MODEL,
      messages: [
        {
          role: 'user',
          content: buildParsingPrompt(input),
        },
      ],
      include_reasoning: false,
      max_tokens: 500,
      temperature: 0.1,
      response_format: {
        type: 'json_object',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await getOpenRouterErrorMessage(response));
  }

  return normalizeParsedTransaction(parseOpenRouterJson(await response.json()));
}

function getOpenRouterHeaders() {
  return {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:8082',
    'X-Title': 'Kebeng',
  };
}

function parseOpenRouterJson(payload: unknown) {
  const content = getOpenRouterContent(payload);

  if (!content) {
    throw new Error('OpenRouter belum mengembalikan data yang bisa dibaca.');
  }

  try {
    return JSON.parse(content);
  } catch {
    const jsonText = content.match(/\{[\s\S]*\}/)?.[0];

    if (!jsonText) {
      throw new SyntaxError('JSON tidak ditemukan.');
    }

    return JSON.parse(jsonText);
  }
}

function getOpenRouterContent(payload: unknown) {
  const choice = (
    payload as {
      choices?: {
        message?: {
          content?: unknown;
          reasoning?: unknown;
          reasoning_details?: { text?: unknown }[];
        };
        text?: unknown;
      }[];
    }
  )?.choices?.[0];
  const content = choice?.message?.content;
  const reasoning = choice?.message?.reasoning;
  const text = choice?.text;
  const reasoningDetails = choice?.message?.reasoning_details;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text;
        }

        return '';
      })
      .join('');
  }

  if (typeof text === 'string') {
    return text;
  }

  if (typeof reasoning === 'string') {
    return reasoning;
  }

  if (Array.isArray(reasoningDetails)) {
    const detailsText = reasoningDetails
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('');

    if (detailsText) {
      return detailsText;
    }
  }

  return null;
}

async function getOpenRouterErrorMessage(response: Response) {
  const fallbackMessage = 'Koneksi ke OpenRouter bermasalah. Coba lagi sebentar.';

  try {
    const payload = await response.json();
    const message = typeof payload?.error?.message === 'string' ? payload.error.message : '';

    if (response.status === 400) {
      return 'Request OpenRouter belum valid. Cek model dan format input gambar.';
    }

    if (response.status === 401 || response.status === 403) {
      return 'API key OpenRouter belum valid atau belum punya izin.';
    }

    if (response.status === 404) {
      return 'Model OpenRouter tidak ditemukan. Cek nama model di file .env.';
    }

    if (response.status === 429) {
      return 'Kuota OpenRouter untuk model gratis sedang habis. Coba lagi nanti atau ganti model.';
    }

    return message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function getGeminiErrorMessage(response: Response) {
  const fallbackMessage = 'Koneksi ke Gemini bermasalah. Coba lagi sebentar.';

  try {
    const payload = await response.json();
    const message = typeof payload?.error?.message === 'string' ? payload.error.message : '';

    if (response.status === 400) {
      return 'API key Gemini belum valid atau request tidak diterima. Cek kembali file .env.';
    }

    if (response.status === 403) {
      return 'API key Gemini belum punya izin untuk model ini. Cek project Google AI Studio kamu.';
    }

    if (response.status === 429) {
      return 'Kuota Gemini untuk API key ini habis atau belum aktif. Cek quota/billing di Google AI Studio.';
    }

    if (message) {
      return message;
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
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

function buildReceiptPrompt() {
  const today = toISODate(new Date());

  return `
Kamu adalah OCR dan parser struk untuk aplikasi keuangan personal Bahasa Indonesia.
Baca foto struk/nota, lalu kembalikan JSON valid saja, tanpa markdown.

Format wajib:
{
  "type": "expense",
  "amount": 25000,
  "category": "Makanan",
  "description": "Belanja di nama toko atau ringkasan struk",
  "date": "YYYY-MM-DD",
  "confidence": 0.95
}

Aturan:
- Hari ini adalah ${today}.
- Gunakan total akhir struk sebagai amount.
- Jika tanggal tidak terlihat, gunakan hari ini dan turunkan confidence.
- Jika foto tidak terbaca, isi amount/category/description/date dengan null dan confidence 0.2.
- Jangan mengarang nominal.
- Gunakan kategori ringkas Bahasa Indonesia: Makanan, Minuman, Transport, Belanja, Hiburan, Kesehatan, Pendidikan, Lainnya.
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

export function parseTransactionLocally(input: string): ParsedTransaction {
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
