import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma/client'
import { APP_SLOTS, APK_DIR, APK_ENTITY_TYPE } from '@/lib/apps/slots'
import { successResponse, serverErrorResponse } from '@/lib/api/response'

/**
 * Daftar aplikasi mobile + status APK terunggah.
 * Publik (dipakai halaman unduhan /download) — tidak memuat data sensitif.
 */
export async function GET(_request: NextRequest) {
  try {
    const releases = await prisma.fileUpload.findMany({
      where: { entity_type: APK_ENTITY_TYPE },
      orderBy: { created_at: 'desc' },
    })

    const apps = APP_SLOTS.map((slot) => {
      const latest = releases.find((r) => r.entity_id === slot.slug)
      const filePath = path.join(APK_DIR, `${slot.slug}.apk`)
      const fileExists = latest ? fs.existsSync(filePath) : false
      return {
        slug: slot.slug,
        name: slot.name,
        description: slot.description,
        audience: slot.audience,
        available: Boolean(latest && fileExists),
        file_name: latest?.file_name ?? null,
        file_size: latest && fileExists ? latest.file_size : null,
        uploaded_at: latest && fileExists ? latest.created_at : null,
        download_url: `/api/apps/${slot.slug}/download`,
      }
    })

    return successResponse(apps)
  } catch (error) {
    console.error(error)
    return serverErrorResponse()
  }
}
