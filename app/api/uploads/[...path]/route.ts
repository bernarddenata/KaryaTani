import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getFromR2, isR2Configured } from '@/lib/storage/r2-client'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const key = segments.join('/')

  if (key.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const ext = path.extname(key).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  try {
    let buffer: Buffer | null = null

    if (isR2Configured()) {
      buffer = await getFromR2(key)
    }

    if (!buffer) {
      const filePath = path.join(process.cwd(), 'uploads', ...segments)
      buffer = await readFile(filePath)
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
