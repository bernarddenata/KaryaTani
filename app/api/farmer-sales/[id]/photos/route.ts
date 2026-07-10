import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { uploadFile } from '@/lib/upload/service'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const VALID_PHOTO_TYPES = ['FOTO_PENERIMAAN', 'FOTO_QC', 'FOTO_KEBERATAN']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_sales.view')) return forbiddenResponse()

    const { id } = await params

    const sale = await prisma.farmerSale.findUnique({ where: { id } })
    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')

    const photos = await prisma.farmerSalePhoto.findMany({
      where: { farmer_sale_id: id },
      include: {
        file: true,
        uploaded_by: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    return successResponse(photos)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'farmer_sales.edit')) return forbiddenResponse()

    const { id } = await params

    const sale = await prisma.farmerSale.findUnique({ where: { id } })
    if (!sale) return notFoundResponse('Penjualan tidak ditemukan.')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const photoType = formData.get('photo_type') as string

    if (!file) {
      return validationErrorResponse([
        { field: 'file', message: 'File wajib diunggah.' },
      ])
    }

    if (!photoType || !VALID_PHOTO_TYPES.includes(photoType)) {
      return validationErrorResponse([
        { field: 'photo_type', message: 'Tipe foto tidak valid. Gunakan: FOTO_PENERIMAAN, FOTO_QC, atau FOTO_KEBERATAN.' },
      ])
    }

    const fileRecord = await uploadFile(file, user.id, 'FarmerSale', id)

    const photo = await prisma.farmerSalePhoto.create({
      data: {
        farmer_sale_id: id,
        file_id: fileRecord.id,
        photo_type: photoType,
        uploaded_by_user_id: user.id,
      },
      include: {
        file: true,
        uploaded_by: { select: { id: true, name: true } },
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'FarmerSale',
      entityId: id,
      action: 'UPLOAD_PHOTO',
      afterJson: photo,
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(photo, undefined, 201)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
