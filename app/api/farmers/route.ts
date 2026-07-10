import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createFarmerSchema, quickCreateFarmerSchema } from '@/lib/validations/farmer'
import { generateFarmerNumber } from '@/lib/utils/numbering'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmers.view')) return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const phone = searchParams.get('phone')
    const memberNumber = searchParams.get('member_number') || searchParams.get('farmer_number')
    const village = searchParams.get('village')
    const cooperativeId = searchParams.get('cooperative_id')
    const commodityId = searchParams.get('commodity_id')
    const status = searchParams.get('status')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const pageParam = searchParams.get('page')

    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : undefined
    let skip: number | undefined
    let page: number | undefined
    if (offsetParam) {
      skip = Math.max(0, parseInt(offsetParam, 10))
      if (limit) page = Math.floor(skip / limit) + 1
    } else if (pageParam && limit) {
      page = Math.max(1, parseInt(pageParam, 10))
      skip = (page - 1) * limit
    }

    const where: any = {}
    if (phone) where.phone = phone
    if (memberNumber) where.farmer_number = memberNumber
    if (village) where.village = { contains: village, mode: 'insensitive' }
    if (cooperativeId) where.cooperative_id = cooperativeId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { farmer_number: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (commodityId) {
      where.sources = { some: { main_commodity_id: commodityId } }
    }

    const [total, farmers] = await Promise.all([
      prisma.farmer.count({ where }),
      prisma.farmer.findMany({
        where,
        include: {
          cooperative: { select: { id: true, code: true, name: true } },
          sources: {
            select: {
              main_commodity: { select: { id: true, name: true } },
              location: true,
            },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ])

    const items = farmers.map((f) => ({
      ...f,
      member_number: f.farmer_number,
      main_commodity: f.sources[0]?.main_commodity?.name || null,
      farm_location: f.sources[0]?.location || null,
    }))

    const meta = limit
      ? { total, limit, page: page ?? 1, totalPages: Math.ceil(total / limit) }
      : { total }

    return successResponse(items, meta)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmers.create')) return forbiddenResponse()

    const body = await request.json()

    const fullParsed = createFarmerSchema.safeParse(body)
    if (fullParsed.success) {
      const existing = await prisma.farmer.findFirst({ where: { phone: fullParsed.data.phone } })
      if (existing) {
        return errorResponse(
          'CONFLICT',
          'Petani dengan nomor telepon ini sudah terdaftar.',
          [{ field: 'phone', message: 'Nomor telepon sudah digunakan.' }],
          409
        )
      }
      const farmer = await prisma.farmer.create({
        data: fullParsed.data,
        include: { cooperative: { select: { id: true, code: true, name: true } } },
      })
      const rMeta = getRequestMeta(request)
      await createAuditLog({
        actorUserId: user.id,
        entityType: 'Farmer',
        entityId: farmer.id,
        action: 'CREATE',
        afterJson: farmer,
        sourceClient: 'web',
        ...rMeta,
      })
      return successResponse(farmer, undefined, 201)
    }

    const quickParsed = quickCreateFarmerSchema.safeParse(body)
    if (!quickParsed.success) {
      return validationErrorResponse(
        fullParsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const existing = await prisma.farmer.findFirst({
      where: { phone: quickParsed.data.phone },
      include: { cooperative: { select: { id: true, code: true, name: true } } },
    })
    if (existing) {
      return errorResponse(
        'CONFLICT',
        'Petani dengan nomor telepon ini sudah terdaftar.',
        [{ field: 'phone', message: 'Nomor telepon sudah digunakan.' }],
        409
      )
    }

    let cooperativeId = quickParsed.data.cooperative_id
    if (!cooperativeId) {
      const firstCoop = await prisma.cooperative.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { created_at: 'asc' },
        select: { id: true },
      })
      if (!firstCoop) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Tidak ada koperasi aktif. Sertakan cooperative_id.',
          undefined,
          422
        )
      }
      cooperativeId = firstCoop.id
    }

    const coop = await prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      select: { id: true, code: true, name: true, status: true },
    })
    if (!coop) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Koperasi tidak ditemukan.',
        [{ field: 'cooperative_id', message: 'Koperasi tidak ditemukan.' }],
        422
      )
    }

    let commodityId: string | null = null
    if (quickParsed.data.main_commodity) {
      const commodity = await prisma.commodity.findFirst({
        where: {
          OR: [
            { name: { equals: quickParsed.data.main_commodity, mode: 'insensitive' } },
            { code: { equals: quickParsed.data.main_commodity, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      })
      commodityId = commodity?.id || null
    }

    const farmerNumber = await generateFarmerNumber(coop.code)

    const farmer = await prisma.$transaction(async (tx) => {
      const created = await tx.farmer.create({
        data: {
          cooperative_id: cooperativeId!,
          farmer_number: farmerNumber,
          name: quickParsed.data.name,
          phone: quickParsed.data.phone,
          nik: quickParsed.data.nik || null,
          address: quickParsed.data.address || null,
          village: quickParsed.data.village || null,
          seller_type: quickParsed.data.seller_type || 'PEMILIK_LAHAN',
          verification_status: 'BELUM_DIVERIFIKASI',
          status: 'ACTIVE',
        },
      })
      if (commodityId) {
        await tx.farmerSource.create({
          data: {
            farmer_id: created.id,
            source_type: 'LAHAN_SENDIRI',
            main_commodity_id: commodityId,
            location: quickParsed.data.village || null,
          },
        })
      }
      return created
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'Farmer',
      entityId: farmer.id,
      action: 'QUICK_CREATE',
      afterJson: farmer,
      sourceClient: 'mobile_qc',
      ...meta,
    })

    const fullFarmer = await prisma.farmer.findUnique({
      where: { id: farmer.id },
      include: {
        cooperative: { select: { id: true, code: true, name: true } },
        sources: {
          select: {
            main_commodity: { select: { id: true, name: true } },
            location: true,
          },
        },
      },
    })

    return successResponse(
      {
        ...fullFarmer,
        member_number: fullFarmer!.farmer_number,
        main_commodity: fullFarmer!.sources[0]?.main_commodity?.name || null,
      },
      undefined,
      201
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
