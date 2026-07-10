/**
 * Idempotent script to grant the QC_OFFICER role the additional permissions
 * required by TaniTrust Mobile QC without re-running the full seed.
 * Usage: npx tsx scripts/sync-qc-officer-perms.ts
 */
import prisma from '../lib/prisma/client'

const EXTRA_PERMISSIONS = [
  'cooperatives.view',
  'farmers.create',
  'farmer_sales.create',
  'farmer_sales.edit',
]

async function main() {
  const role = await prisma.role.findUnique({ where: { code: 'QC_OFFICER' } })
  if (!role) {
    console.error('QC_OFFICER role tidak ditemukan.')
    process.exit(1)
  }

  const perms = await prisma.permission.findMany({
    where: { code: { in: EXTRA_PERMISSIONS } },
  })

  for (const perm of perms) {
    const existing = await prisma.rolePermission.findFirst({
      where: { role_id: role.id, permission_id: perm.id },
    })
    if (existing) {
      console.log(`  = ${perm.code} sudah ada`)
      continue
    }
    await prisma.rolePermission.create({
      data: { role_id: role.id, permission_id: perm.id },
    })
    console.log(`  + ${perm.code} ditambahkan`)
  }

  const qcUser = await prisma.user.findUnique({
    where: { email: 'qc@karyatani.local' },
  })
  if (qcUser && !qcUser.phone) {
    await prisma.user.update({
      where: { id: qcUser.id },
      data: { phone: '081234567890', name: 'Siti Rahma' },
    })
    console.log('  = QC officer phone updated to 081234567890')
  }

  console.log('QC_OFFICER permissions synchronized.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
