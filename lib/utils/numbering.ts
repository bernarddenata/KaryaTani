// TODO: Implement concurrency-safe numbering with database sequence in production

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export function generateSaleNumber(date?: Date): string {
  const d = date || new Date()
  return `JUAL-${formatDate(d)}-0001`
}

export function generateBatchNumber(commodityCode: string, date?: Date): string {
  const d = date || new Date()
  return `BATCH-${commodityCode}-${formatDate(d)}-0001`
}

export function generatePayoutNumber(date?: Date): string {
  const d = date || new Date()
  return `BAYAR-${formatDate(d)}-0001`
}

export function generateDisputeNumber(date?: Date): string {
  const d = date || new Date()
  return `KBT-${formatDate(d)}-0001`
}
