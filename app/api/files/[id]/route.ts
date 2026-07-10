import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getFileById } from '@/lib/upload/service'
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
    const user = await getCurrentUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const file = await getFileById(id)
    if (!file) return notFoundResponse('File tidak ditemukan.')

    return successResponse(file)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
