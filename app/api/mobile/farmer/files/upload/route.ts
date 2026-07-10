import { NextRequest } from 'next/server'
import { getCurrentFarmer } from '@/lib/auth/farmer-session'
import { uploadFile } from '@/lib/upload/service'
import prisma from '@/lib/prisma/client'
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_MOBILE_SIZE = 8 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const farmer = await getCurrentFarmer(request)
    if (!farmer) return unauthorizedResponse()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const purpose = (formData.get('purpose') as string | null) || 'DISPUTE_EVIDENCE'

    if (!file) return errorResponse('VALIDATION_ERROR', 'File wajib diunggah.', undefined, 422)

    if (!IMAGE_TYPES.has(file.type)) {
      return errorResponse(
        'INVALID_FILE_TYPE',
        'Hanya foto (JPG, PNG, WebP) yang diperbolehkan.',
        undefined,
        422
      )
    }

    if (file.size > MAX_MOBILE_SIZE) {
      return errorResponse(
        'FILE_TOO_LARGE',
        'Ukuran file tidak boleh lebih dari 8MB.',
        undefined,
        422
      )
    }

    try {
      const record = await uploadFile(
        file,
        undefined,
        'FarmerDisputeEvidence',
        farmer.id
      )
      await prisma.fileUpload.update({
        where: { id: record.id },
        data: { entity_type: `FarmerDisputeEvidence:${purpose}` },
      })
      return successResponse(
        {
          file_id: record.id,
          url: record.file_url,
          file_name: record.file_name,
          file_type: record.file_type,
          size: record.file_size,
          purpose,
        },
        undefined,
        201
      )
    } catch (err: any) {
      if (err?.message?.includes('Ukuran file')) {
        return errorResponse('FILE_TOO_LARGE', err.message, undefined, 422)
      }
      if (err?.message?.includes('Tipe file')) {
        return errorResponse('INVALID_FILE_TYPE', err.message, undefined, 422)
      }
      throw err
    }
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
