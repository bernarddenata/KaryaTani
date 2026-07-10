import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const createVariantSchema = z.object({
  commodity_id: z.string().min(1, 'ID komoditas wajib diisi.'),
  code: z.string().min(1, 'Kode varian wajib diisi.'),
  name: z.string().min(1, 'Nama varian wajib diisi.'),
  unit: z.string().min(1, 'Satuan wajib diisi.'),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'commodities.create')) return forbiddenResponse()

    const body = await request.json()
    const parsed = createVariantSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      )
    }

    const variant = await prisma.commodityVariant.create({
      data: parsed.data,
      include: {
        commodity: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'CommodityVariant',
      entityId: variant.id,
      action: 'CREATE',
      afterJson: variant,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(variant, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
