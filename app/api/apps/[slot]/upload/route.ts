import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { hasPermission } from '@/lib/rbac/permissions'
import { createAuditLog, getRequestMeta } from '@/lib/audit/logger'
import { getSlot, APK_DIR, APK_ENTITY_TYPE, MAX_APK_SIZE } from '@/lib/apps/slots'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slot: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()
    if (!hasPermission(user, 'settings.view')) return forbiddenResponse()

    const { slot: slug } = await params
    const slot = getSlot(slug)
    if (!slot) return notFoundResponse('Aplikasi tidak ditemukan.')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return errorResponse('VALIDATION_ERROR', 'File APK wajib diunggah.', undefined, 422)
    }
    if (!file.name.toLowerCase().endsWith('.apk')) {
      return errorResponse(
        'INVALID_FILE_TYPE',
        'Hanya file .apk yang diperbolehkan.',
        undefined,
        422
      )
    }
    if (file.size > MAX_APK_SIZE) {
      return errorResponse(
        'FILE_TOO_LARGE',
        'Ukuran file tidak boleh lebih dari 300MB.',
        undefined,
        422
      )
    }

    await fs.mkdir(APK_DIR, { recursive: true })
    const target = path.join(APK_DIR, `${slug}.apk`)
    const buffer = Buffer.from(await file.arrayBuffer())
    // Tulis ke file sementara dulu agar unduhan yang sedang berjalan tidak korup.
    const tmp = `${target}.tmp`
    await fs.writeFile(tmp, buffer)
    await fs.rename(tmp, target)

    const record = await prisma.fileUpload.create({
      data: {
        file_url: `/api/apps/${slug}/download`,
        file_name: file.name,
        file_type: 'application/vnd.android.package-archive',
        file_size: file.size,
        storage_provider: 'LOCAL',
        uploaded_by_user_id: user.id,
        entity_type: APK_ENTITY_TYPE,
        entity_id: slug,
      },
    })

    const meta = getRequestMeta(request)
    await createAuditLog({
      actorUserId: user.id,
      entityType: 'ApkRelease',
      entityId: record.id,
      action: 'UPLOAD',
      afterJson: { slot: slug, file_name: file.name, file_size: file.size },
      sourceClient: 'web',
      ...meta,
    })

    return successResponse(
      {
        slug,
        name: slot.name,
        file_name: record.file_name,
        file_size: record.file_size,
        uploaded_at: record.created_at,
        download_url: `/api/apps/${slug}/download`,
      },
      undefined,
      201
    )
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
