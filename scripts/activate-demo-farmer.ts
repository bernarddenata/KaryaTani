/**
 * Activate a demo farmer for Karya Taniku mobile app testing.
 * Usage: npx tsx scripts/activate-demo-farmer.ts <farmer_number> <pin>
 * Default: PTN-001 with PIN 123456.
 */
import prisma from '../lib/prisma/client'
import { hashPassword } from '../lib/auth/password'

async function main() {
  const farmerNumber = process.argv[2] || 'PTN-001'
  const pin = process.argv[3] || '123456'

  if (!/^\d{6}$/.test(pin)) {
    console.error('PIN harus 6 digit angka.')
    process.exit(1)
  }

  const farmer = await prisma.farmer.findUnique({
    where: { farmer_number: farmerNumber },
  })
  if (!farmer) {
    console.error(`Farmer ${farmerNumber} tidak ditemukan.`)
    process.exit(1)
  }

  const pinHash = await hashPassword(pin)
  await prisma.farmer.update({
    where: { id: farmer.id },
    data: { pin_hash: pinHash, app_activated_at: new Date() },
  })

  console.log(`Farmer ${farmer.farmer_number} (${farmer.name}) diaktifkan.`)
  console.log(`Login credential:`)
  console.log(`  identifier: ${farmer.phone} atau ${farmer.farmer_number}`)
  console.log(`  pin: ${pin}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
