import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

/** Utas pesan keberatan antara petani dan pengurus koperasi. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { disputeId } = await params
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, farmer_id: farmer.id },
      select: { id: true },
    })
    if (!dispute) return notFoundResponse('Keberatan tidak ditemukan.')

    const messages = await prisma.disputeMessage.findMany({
      where: { dispute_id: disputeId },
      include: {
        sender_farmer: { select: { id: true, name: true } },
        sender_user: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'asc' },
    })

    return successResponse(
      messages.map((m) => ({
        id: m.id,
        sender_type: m.sender_type,
        sender_name: m.sender_type === 'FARMER' ? m.sender_farmer?.name : m.sender_user?.name,
        message: m.message,
        created_at: m.created_at,
      }))
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const { disputeId } = await params
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, farmer_id: farmer.id },
      select: { id: true, status: true },
    })
    if (!dispute) return notFoundResponse('Keberatan tidak ditemukan.')

    if (['DISETUJUI', 'DITOLAK', 'SELESAI', 'DIBATALKAN'].includes(dispute.status)) {
      return errorResponse(
        'DISPUTE_CLOSED',
        'Keberatan sudah selesai — tidak dapat menambah pesan.',
        undefined,
        409
      )
    }

    const body = await request.json().catch(() => ({}))
    const message = (body?.message || '').toString().trim()
    if (!message || message.length > 2000) {
      return validationErrorResponse([
        { field: 'message', message: 'Pesan wajib diisi (maks 2000 karakter).' },
      ])
    }

    const created = await prisma.disputeMessage.create({
      data: {
        dispute_id: disputeId,
        sender_type: 'FARMER',
        sender_farmer_id: farmer.id,
        message,
      },
    })

    return successResponse(
      {
        id: created.id,
        sender_type: 'FARMER',
        sender_name: farmer.name,
        message: created.message,
        created_at: created.created_at,
      },
      undefined,
      201
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
