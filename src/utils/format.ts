export function formatRupiah(amount: number) {
  return `Rp ${Math.abs(amount).toLocaleString('id-ID')}`;
}

export function formatSignedRupiah(amount: number, type: 'income' | 'expense') {
  return `${type === 'income' ? '+' : '-'}${formatRupiah(amount)}`;
}
