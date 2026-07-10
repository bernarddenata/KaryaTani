import { successResponse, serverErrorResponse } from '@/lib/api/response'

export async function GET() {
  try {
    return successResponse({
      status: 'ok',
      app: 'Karya Tani Center',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
