import { prisma } from '@/lib/prisma/client'

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export async function generateSaleNumber(date?: Date): Promise<string> {
  const d = date || new Date()
  const dateStr = formatDate(d)
  const pattern = `JUAL-${dateStr}-%`

  const result = await prisma.$queryRaw<{ max_num: string | null }[]>`
    SELECT MAX(right(sale_number, 4)) as max_num
    FROM "KaryaTani_farmer_sales"
    WHERE sale_number LIKE ${pattern}
  `
  const current = parseInt(result[0]?.max_num || '0', 10)
  return `JUAL-${dateStr}-${String(current + 1).padStart(4, '0')}`
}

export async function generateBatchNumber(commodityCode: string, date?: Date): Promise<string> {
  const d = date || new Date()
  const dateStr = formatDate(d)
  const code = commodityCode.toUpperCase()
  const pattern = `BATCH-${code}-${dateStr}-%`

  const result = await prisma.$queryRaw<{ max_num: string | null }[]>`
    SELECT MAX(right(batch_number, 4)) as max_num
    FROM "KaryaTani_farmer_sales"
    WHERE batch_number LIKE ${pattern}
  `
  const current = parseInt(result[0]?.max_num || '0', 10)
  return `BATCH-${code}-${dateStr}-${String(current + 1).padStart(4, '0')}`
}

export async function generatePayoutNumber(date?: Date): Promise<string> {
  const d = date || new Date()
  const dateStr = formatDate(d)
  const pattern = `BAYAR-${dateStr}-%`

  const result = await prisma.$queryRaw<{ max_num: string | null }[]>`
    SELECT MAX(right(payout_number, 4)) as max_num
    FROM "KaryaTani_farmer_payouts"
    WHERE payout_number LIKE ${pattern}
  `
  const current = parseInt(result[0]?.max_num || '0', 10)
  return `BAYAR-${dateStr}-${String(current + 1).padStart(4, '0')}`
}

export async function generateFarmerNumber(cooperativeCode: string): Promise<string> {
  const code = cooperativeCode.toUpperCase()
  const pattern = `${code}-%`

  const result = await prisma.$queryRaw<{ max_num: string | null }[]>`
    SELECT MAX(right(farmer_number, 6)) as max_num
    FROM "KaryaTani_farmers"
    WHERE farmer_number LIKE ${pattern}
  `
  const current = parseInt(result[0]?.max_num || '0', 10)
  return `${code}-${String(current + 1).padStart(6, '0')}`
}

export async function generateDisputeNumber(date?: Date): Promise<string> {
  const d = date || new Date()
  const dateStr = formatDate(d)
  const pattern = `KBT-${dateStr}-%`

  const result = await prisma.$queryRaw<{ max_num: string | null }[]>`
    SELECT MAX(right(dispute_number, 4)) as max_num
    FROM "KaryaTani_disputes"
    WHERE dispute_number LIKE ${pattern}
  `
  const current = parseInt(result[0]?.max_num || '0', 10)
  return `KBT-${dateStr}-${String(current + 1).padStart(4, '0')}`
}
