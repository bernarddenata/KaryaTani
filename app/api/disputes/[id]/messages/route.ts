import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { canAccessCooperative } from '@/lib/rbac/cooperative-scope'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

/** Utas pesan keberatan — sisi pengurus koperasi (web dashboard). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'disputes.view')) return forbiddenResponse()

    const { id } = await params
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      select: { id: true, cooperative_id: true },
    })
    if (!dispute) return notFoundResponse('Keberatan tidak ditemukan.')
    if (!(await canAccessCooperative(user, dispute.cooperative_id)))
      return notFoundResponse('Keberatan tidak ditemukan.')

    const messages = await prisma.disputeMessage.findMany({
      where: { dispute_id: id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'disputes.edit') && !hasPermission(user, 'disputes.resolve')) {
      return forbiddenResponse()
    }

    const { id } = await params
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      select: { id: true, cooperative_id: true, farmer_id: true, dispute_number: true, status: true },
    })
    if (!dispute) return notFoundResponse('Keberatan tidak ditemukan.')
    if (!(await canAccessCooperative(user, dispute.cooperative_id)))
      return notFoundResponse('Keberatan tidak ditemukan.')

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

    const created = await prisma.$transaction(async (tx) => {
      const msg = await tx.disputeMessage.create({
        data: {
          dispute_id: id,
          sender_type: 'KOPERASI',
          sender_user_id: user.id,
          message,
        },
      })
      await tx.notification.create({
        data: {
          farmer_id: dispute.farmer_id,
          title: 'Balasan keberatan dari koperasi',
          message: `Ada balasan baru untuk keberatan ${dispute.dispute_number}.`,
          notification_type: 'DISPUTE_MESSAGE',
          related_entity_type: 'Dispute',
          related_entity_id: id,
        },
      })
      return msg
    })

    return successResponse(
      {
        id: created.id,
        sender_type: 'KOPERASI',
        sender_name: user.name,
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
