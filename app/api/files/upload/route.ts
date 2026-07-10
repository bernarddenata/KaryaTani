import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { uploadFile } from '@/lib/upload/service'
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return errorResponse('VALIDATION_ERROR', 'File wajib diunggah.')
    }

    const entityType = formData.get('entity_type') as string | null
    const entityId = formData.get('entity_id') as string | null

    const record = await uploadFile(file, user.id, entityType || undefined, entityId || undefined)

    return successResponse(record, undefined, 201)
  } catch (error: any) {
    if (error.message?.includes('Ukuran file') || error.message?.includes('Tipe file')) {
      return errorResponse('VALIDATION_ERROR', error.message)
    }
    console.error(error)
    return serverErrorResponse()
  }
}
