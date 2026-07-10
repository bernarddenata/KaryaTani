import { prisma } from '@/lib/prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function uploadFile(
  file: File,
  userId?: string,
  entityType?: string,
  entityId?: string
) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file tidak boleh lebih dari 10MB.')
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.')
  }

  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${randomUUID()}.${ext}`
  const dateDir = new Date().toISOString().slice(0, 10)
  const dirPath = path.join(UPLOAD_DIR, dateDir)

  await mkdir(dirPath, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = path.join(dirPath, fileName)
  await writeFile(filePath, buffer)

  const fileUrl = `/uploads/${dateDir}/${fileName}`

  const record = await prisma.fileUpload.create({
    data: {
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_provider: 'LOCAL',
      uploaded_by_user_id: userId || null,
      entity_type: entityType || null,
      entity_id: entityId || null,
    },
  })

  return record
}

export async function getFileById(id: string) {
  return prisma.fileUpload.findUnique({ where: { id } })
}
