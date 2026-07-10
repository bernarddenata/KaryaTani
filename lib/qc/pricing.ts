import prisma from '@/lib/prisma/client'

interface BreakdownInput {
  grade_id?: string | null
  grade_code?: string | null
  grade_name?: string | null
  weight: number
}

interface PriceListItemForResolve {
  id: string
  grade_code: string
  grade_name: string
  price_per_unit: unknown
  unit: string
  is_reject: boolean
}

interface ResolvedBreakdown {
  grade_id: string | null
  grade_name: string
  grade_code: string
  weight: number
  price_per_unit: number
  estimated_amount: number
  is_reject: boolean
  unit: string | null
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber()
  }
  return 0
}

export function resolveBreakdownAgainstPriceList(
  breakdown: BreakdownInput,
  items: PriceListItemForResolve[]
): ResolvedBreakdown {
  let match: PriceListItemForResolve | undefined
  if (breakdown.grade_id) match = items.find((it) => it.id === breakdown.grade_id)
  if (!match && breakdown.grade_code) match = items.find((it) => it.grade_code === breakdown.grade_code)
  if (!match && breakdown.grade_name) {
    match = items.find(
      (it) => it.grade_name.toLowerCase() === breakdown.grade_name!.toLowerCase()
    )
  }

  const gradeName = match?.grade_name || breakdown.grade_name || breakdown.grade_code || 'Grade'
  const gradeCode = match?.grade_code || breakdown.grade_code || 'UNKNOWN'
  const pricePerUnit = match ? toNumber(match.price_per_unit) : 0
  const weight = toNumber(breakdown.weight)
  const isReject = match ? match.is_reject : gradeCode.toUpperCase().includes('REJECT')

  return {
    grade_id: match?.id || null,
    grade_name: gradeName,
    grade_code: gradeCode,
    weight,
    price_per_unit: pricePerUnit,
    estimated_amount: weight * pricePerUnit,
    is_reject: isReject,
    unit: match?.unit || null,
  }
}

export async function loadActivePriceListItems(
  cooperativeId: string,
  commodityId: string,
  priceListId?: string | null
): Promise<{ items: PriceListItemForResolve[]; priceListId: string | null }> {
  if (priceListId) {
    const list = await prisma.priceList.findUnique({
      where: { id: priceListId },
      include: { items: { where: { commodity_id: commodityId } } },
    })
    if (list) {
      return { items: list.items as PriceListItemForResolve[], priceListId: list.id }
    }
  }
  const now = new Date()
  const list = await prisma.priceList.findFirst({
    where: {
      cooperative_id: cooperativeId,
      status: 'AKTIF',
      valid_from: { lte: now },
      OR: [{ valid_until: null }, { valid_until: { gte: now } }],
      items: { some: { commodity_id: commodityId } },
    },
    include: { items: { where: { commodity_id: commodityId } } },
    orderBy: { valid_from: 'desc' },
  })
  if (!list) return { items: [], priceListId: null }
  return { items: list.items as PriceListItemForResolve[], priceListId: list.id }
}
