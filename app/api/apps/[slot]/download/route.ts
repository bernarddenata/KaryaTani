import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import prisma from '@/lib/prisma/client'
import { getSlot, APK_DIR, APK_ENTITY_TYPE } from '@/lib/apps/slots'
import { notFoundResponse, serverErrorResponse } from '@/lib/api/response'

/**
 * Unduh APK terbaru untuk slot aplikasi. Publik — link ini dibagikan
 * ke petani/petugas koperasi.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slot: string }> }
) {
  try {
    const { slot: slug } = await params
    const slot = getSlot(slug)
    if (!slot) return notFoundResponse('Aplikasi tidak ditemukan.')

    const filePath = path.join(APK_DIR, `${slug}.apk`)
    if (!fs.existsSync(filePath)) {
      return notFoundResponse('Belum ada APK yang diunggah untuk aplikasi ini.')
    }

    const latest = await prisma.fileUpload.findFirst({
      where: { entity_type: APK_ENTITY_TYPE, entity_id: slug },
      orderBy: { created_at: 'desc' },
    })

    const stat = fs.statSync(filePath)
    const downloadName = latest?.file_name || `${slug}.apk`
    const stream = Readable.toWeb(
      fs.createReadStream(filePath)
    ) as ReadableStream

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': String(stat.size),
        'Content-Disposition': `attachment; filename="${downloadName.replace(/"/g, '')}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
