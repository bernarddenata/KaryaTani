import { NextResponse } from 'next/server'

export function successResponse(data: any, meta?: any, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  )
}

export function errorResponse(code: string, message: string, details?: any[], status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  )
}

export function notFoundResponse(message = 'Data tidak ditemukan.') {
  return errorResponse('NOT_FOUND', message, undefined, 404)
}

export function unauthorizedResponse(message = 'Anda belum masuk ke sistem.') {
  return errorResponse('UNAUTHORIZED', message, undefined, 401)
}

export function forbiddenResponse(message = 'Anda tidak memiliki akses.') {
  return errorResponse('FORBIDDEN', message, undefined, 403)
}

export function validationErrorResponse(details: any[]) {
  return errorResponse('VALIDATION_ERROR', 'Data yang dikirim tidak valid.', details, 422)
}

export function serverErrorResponse(message = 'Terjadi kesalahan pada server.') {
  return errorResponse('SERVER_ERROR', message, undefined, 500)
}
