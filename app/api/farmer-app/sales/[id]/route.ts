import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { id } = await params

    const sale = await prisma.farmerSale.findFirst({
      where: { id, farmer_id: farmer.id },
      include: {
        commodity: { select: { id: true, name: true, code: true, image_url: true } },
        commodity_variant: { select: { id: true, name: true } },
        cooperative: { select: { id: true, name: true } },
        representative: { select: { id: true, name: true } },
        photos: {
          include: {
            file: { select: { id: true, file_url: true, file_name: true } },
          },
        },
        qc_results: {
          include: {
            items: {
              include: {
                qc_template_item: { select: { item_name: true, item_code: true } },
              },
            },
            grade_breakdowns: true,
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    })

    if (!sale) return notFoundResponse('Data penjualan tidak ditemukan.')

    return successResponse(sale)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
