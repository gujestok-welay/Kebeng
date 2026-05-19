import {
  IconBook,
  IconBus,
  IconCash,
  IconCoffee,
  IconDeviceGamepad2,
  IconDotsCircleHorizontal,
  IconHeartRateMonitor,
  IconShoppingCart,
  IconToolsKitchen2,
} from '@tabler/icons-react-native';

import { Palette } from '@/constants/theme';

export type TransactionType = 'expense' | 'income';
export type CategoryKey =
  | 'makanan'
  | 'kopi'
  | 'transport'
  | 'belanja'
  | 'hiburan'
  | 'pemasukan'
  | 'kesehatan'
  | 'pendidikan'
  | 'lainnya';

export const categoryMeta = {
  makanan: {
    label: 'Makanan',
    icon: IconToolsKitchen2,
    color: Palette.accent,
    background: Palette.accentDark,
  },
  kopi: {
    label: 'Minuman',
    icon: IconCoffee,
    color: Palette.coffee,
    background: Palette.coffeeBg,
  },
  transport: {
    label: 'Transport',
    icon: IconBus,
    color: Palette.blue,
    background: Palette.blueBg,
  },
  belanja: {
    label: 'Belanja',
    icon: IconShoppingCart,
    color: Palette.orange,
    background: Palette.orangeBg,
  },
  hiburan: {
    label: 'Hiburan',
    icon: IconDeviceGamepad2,
    color: Palette.purple,
    background: Palette.purpleBg,
  },
  pemasukan: {
    label: 'Pemasukan',
    icon: IconCash,
    color: Palette.accent,
    background: Palette.accentDark,
  },
  kesehatan: {
    label: 'Kesehatan',
    icon: IconHeartRateMonitor,
    color: Palette.expense,
    background: Palette.expenseBg,
  },
  pendidikan: {
    label: 'Pendidikan',
    icon: IconBook,
    color: Palette.blue,
    background: Palette.blueBg,
  },
  lainnya: {
    label: 'Lainnya',
    icon: IconDotsCircleHorizontal,
    color: Palette.textSecondary,
    background: Palette.grayBg,
  },
} as const;

export const transactions = [
  {
    id: 't1',
    title: 'Makan siang',
    category: 'makanan',
    source: 'chat',
    time: '12:40',
    day: 'Hari ini',
    amount: 25000,
    type: 'expense',
  },
  {
    id: 't2',
    title: 'Kopi susu',
    category: 'kopi',
    source: 'foto',
    time: '09:15',
    day: 'Hari ini',
    amount: 18000,
    type: 'expense',
  },
  {
    id: 't3',
    title: 'Gaji freelance',
    category: 'pemasukan',
    source: 'manual',
    time: '08:00',
    day: 'Hari ini',
    amount: 750000,
    type: 'income',
  },
  {
    id: 't4',
    title: 'Ojek ke kantor',
    category: 'transport',
    source: 'chat',
    time: '18:20',
    day: 'Kemarin',
    amount: 22000,
    type: 'expense',
  },
  {
    id: 't5',
    title: 'Belanja bulanan',
    category: 'belanja',
    source: 'manual',
    time: '16:30',
    day: 'Kemarin',
    amount: 185000,
    type: 'expense',
  },
  {
    id: 't6',
    title: 'Tiket bioskop',
    category: 'hiburan',
    source: 'chat',
    time: '20:10',
    day: 'Senin, 18/05/2026',
    amount: 50000,
    type: 'expense',
  },
] satisfies {
  id: string;
  title: string;
  category: CategoryKey;
  source: 'chat' | 'foto' | 'manual';
  time: string;
  day: string;
  amount: number;
  type: TransactionType;
}[];

export const categoryReports = [
  { key: 'makanan', amount: 420000, progress: 84 },
  { key: 'transport', amount: 210000, progress: 42 },
  { key: 'belanja', amount: 185000, progress: 37 },
  { key: 'kopi', amount: 126000, progress: 63 },
  { key: 'hiburan', amount: 90000, progress: 45 },
] satisfies { key: CategoryKey; amount: number; progress: number }[];
