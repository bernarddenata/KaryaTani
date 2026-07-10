import { successResponse, serverErrorResponse } from '@/lib/api/response'

export async function POST() {
  try {
    const response = successResponse({
      message: 'Berhasil keluar dari sistem.',
    })

    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
