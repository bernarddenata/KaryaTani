import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create Permissions
  const permissionsList = [
    { code: 'dashboard.view', name: 'Lihat Dasbor', module: 'dashboard' },
    { code: 'cooperatives.view', name: 'Lihat Koperasi', module: 'cooperatives' },
    { code: 'cooperatives.create', name: 'Buat Koperasi', module: 'cooperatives' },
    { code: 'cooperatives.update', name: 'Ubah Koperasi', module: 'cooperatives' },
    { code: 'farmers.view', name: 'Lihat Petani', module: 'farmers' },
    { code: 'farmers.create', name: 'Buat Petani', module: 'farmers' },
    { code: 'farmers.update', name: 'Ubah Petani', module: 'farmers' },
    { code: 'farmer_representatives.view', name: 'Lihat Pengantar', module: 'farmer_representatives' },
    { code: 'farmer_representatives.create', name: 'Buat Pengantar', module: 'farmer_representatives' },
    { code: 'farmer_representatives.update', name: 'Ubah Pengantar', module: 'farmer_representatives' },
    { code: 'commodities.view', name: 'Lihat Komoditas', module: 'commodities' },
    { code: 'commodities.create', name: 'Buat Komoditas', module: 'commodities' },
    { code: 'commodities.update', name: 'Ubah Komoditas', module: 'commodities' },
    { code: 'price_lists.view', name: 'Lihat Daftar Harga', module: 'price_lists' },
    { code: 'price_lists.create', name: 'Buat Daftar Harga', module: 'price_lists' },
    { code: 'price_lists.update', name: 'Ubah Daftar Harga', module: 'price_lists' },
    { code: 'qc_templates.view', name: 'Lihat Template QC', module: 'qc_templates' },
    { code: 'qc_templates.create', name: 'Buat Template QC', module: 'qc_templates' },
    { code: 'qc_templates.update', name: 'Ubah Template QC', module: 'qc_templates' },
    { code: 'farmer_sales.view', name: 'Lihat Penjualan', module: 'farmer_sales' },
    { code: 'farmer_sales.create', name: 'Buat Penjualan', module: 'farmer_sales' },
    { code: 'farmer_sales.update', name: 'Ubah Penjualan', module: 'farmer_sales' },
    { code: 'qc_results.view', name: 'Lihat Hasil QC', module: 'qc_results' },
    { code: 'qc_results.create', name: 'Buat Hasil QC', module: 'qc_results' },
    { code: 'qc_history.view', name: 'Lihat Riwayat QC', module: 'qc_history' },
    { code: 'farmer_payouts.view', name: 'Lihat Bayar Petani', module: 'farmer_payouts' },
    { code: 'farmer_payouts.create', name: 'Buat Pembayaran', module: 'farmer_payouts' },
    { code: 'farmer_wallets.view', name: 'Lihat Saldo Petani', module: 'farmer_wallets' },
    { code: 'farmer_wallet_mutations.view', name: 'Lihat Riwayat Saldo', module: 'farmer_wallet_mutations' },
    { code: 'disputes.view', name: 'Lihat Keberatan', module: 'disputes' },
    { code: 'disputes.create', name: 'Buat Keberatan', module: 'disputes' },
    { code: 'disputes.resolve', name: 'Selesaikan Keberatan', module: 'disputes' },
    { code: 'batch.view', name: 'Lihat Batch', module: 'batch' },
    { code: 'reports.view', name: 'Lihat Laporan', module: 'reports' },
    { code: 'audit_logs.view', name: 'Lihat Audit Log', module: 'audit_logs' },
    { code: 'users.view', name: 'Lihat Pengguna', module: 'users' },
    { code: 'users.create', name: 'Buat Pengguna', module: 'users' },
    { code: 'users.update', name: 'Ubah Pengguna', module: 'users' },
    { code: 'roles.view', name: 'Lihat Hak Akses', module: 'roles' },
    { code: 'roles.create', name: 'Buat Peran', module: 'roles' },
    { code: 'roles.update', name: 'Ubah Peran', module: 'roles' },
    { code: 'api_access.view', name: 'Lihat Akses API', module: 'api_access' },
    { code: 'settings.view', name: 'Lihat Pengaturan', module: 'settings' },
  ]

  // Use upsert for each permission (based on code)
  const permissions: Record<string, any> = {}
  for (const perm of permissionsList) {
    const p = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module },
      create: perm,
    })
    permissions[perm.code] = p
  }
  console.log(`✅ ${permissionsList.length} permissions seeded`)

  // 2. Create Roles with their permissions
  // SYSTEM_ADMIN gets ALL permissions
  // COOPERATIVE_MANAGER gets most except users/roles management
  // QC_SUPERVISOR gets QC related + farmers + commodities + view permissions
  // QC_OFFICER gets QC results create + view permissions
  // FINANCE_STAFF gets financial + view permissions
  // ADMIN_KOPERASI gets most except system admin specific
  // VIEWER gets only view permissions

  const roleDefinitions = [
    {
      code: 'SYSTEM_ADMIN',
      name: 'System Admin',
      description: 'Administrator sistem dengan akses penuh',
      permissions: Object.keys(permissions), // ALL permissions
    },
    {
      code: 'COOPERATIVE_MANAGER',
      name: 'Manager Koperasi',
      description: 'Manajer koperasi dengan akses luas',
      permissions: [
        'dashboard.view', 'cooperatives.view', 'cooperatives.update',
        'farmers.view', 'farmers.create', 'farmers.update',
        'farmer_representatives.view', 'farmer_representatives.create', 'farmer_representatives.update',
        'commodities.view', 'commodities.create', 'commodities.update',
        'price_lists.view', 'price_lists.create', 'price_lists.update',
        'qc_templates.view', 'qc_templates.create', 'qc_templates.update',
        'farmer_sales.view', 'farmer_sales.create', 'farmer_sales.update',
        'qc_results.view', 'qc_results.create', 'qc_history.view',
        'farmer_payouts.view', 'farmer_payouts.create',
        'farmer_wallets.view', 'farmer_wallet_mutations.view',
        'disputes.view', 'disputes.create', 'disputes.resolve',
        'batch.view', 'reports.view', 'audit_logs.view',
        'settings.view',
      ],
    },
    {
      code: 'QC_SUPERVISOR',
      name: 'Supervisor QC',
      description: 'Supervisor pemeriksaan kualitas',
      permissions: [
        'dashboard.view', 'farmers.view', 'farmer_representatives.view',
        'commodities.view', 'price_lists.view',
        'qc_templates.view', 'qc_templates.create', 'qc_templates.update',
        'farmer_sales.view', 'qc_results.view', 'qc_results.create', 'qc_history.view',
        'disputes.view', 'disputes.resolve', 'batch.view', 'reports.view',
      ],
    },
    {
      code: 'QC_OFFICER',
      name: 'Petugas QC',
      description: 'Petugas pemeriksaan kualitas',
      permissions: [
        'dashboard.view', 'farmers.view', 'farmer_representatives.view',
        'commodities.view', 'price_lists.view', 'qc_templates.view',
        'farmer_sales.view', 'qc_results.view', 'qc_results.create', 'qc_history.view',
        'batch.view',
      ],
    },
    {
      code: 'FINANCE_STAFF',
      name: 'Staff Keuangan',
      description: 'Staff bagian keuangan',
      permissions: [
        'dashboard.view', 'farmers.view', 'farmer_representatives.view',
        'commodities.view', 'price_lists.view',
        'farmer_sales.view', 'qc_results.view', 'qc_history.view',
        'farmer_payouts.view', 'farmer_payouts.create',
        'farmer_wallets.view', 'farmer_wallet_mutations.view',
        'disputes.view', 'batch.view', 'reports.view',
      ],
    },
    {
      code: 'ADMIN_KOPERASI',
      name: 'Admin Koperasi',
      description: 'Administrator koperasi',
      permissions: [
        'dashboard.view', 'cooperatives.view',
        'farmers.view', 'farmers.create', 'farmers.update',
        'farmer_representatives.view', 'farmer_representatives.create', 'farmer_representatives.update',
        'commodities.view', 'commodities.create', 'commodities.update',
        'price_lists.view', 'price_lists.create', 'price_lists.update',
        'qc_templates.view',
        'farmer_sales.view', 'farmer_sales.create', 'farmer_sales.update',
        'qc_results.view', 'qc_history.view',
        'farmer_payouts.view', 'farmer_wallets.view', 'farmer_wallet_mutations.view',
        'disputes.view', 'disputes.create',
        'batch.view', 'reports.view',
        'users.view', 'settings.view',
      ],
    },
    {
      code: 'VIEWER',
      name: 'Viewer',
      description: 'Pengguna dengan akses lihat saja',
      permissions: [
        'dashboard.view', 'cooperatives.view', 'farmers.view',
        'farmer_representatives.view', 'commodities.view', 'price_lists.view',
        'qc_templates.view', 'farmer_sales.view', 'qc_results.view', 'qc_history.view',
        'farmer_wallets.view', 'farmer_wallet_mutations.view',
        'disputes.view', 'batch.view', 'reports.view',
      ],
    },
  ]

  const roles: Record<string, any> = {}
  for (const roleDef of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { code: roleDef.code },
      update: { name: roleDef.name, description: roleDef.description },
      create: { code: roleDef.code, name: roleDef.name, description: roleDef.description },
    })
    roles[roleDef.code] = role

    // Delete existing role permissions and recreate
    await prisma.rolePermission.deleteMany({ where: { role_id: role.id } })
    for (const permCode of roleDef.permissions) {
      if (permissions[permCode]) {
        await prisma.rolePermission.create({
          data: { role_id: role.id, permission_id: permissions[permCode].id },
        })
      }
    }
  }
  console.log(`✅ ${roleDefinitions.length} roles seeded with permissions`)

  // 3. Create Users
  const passwordHash = await bcrypt.hash('password123', 12)

  const userDefinitions = [
    { name: 'System Admin', email: 'admin@karyatani.local', role: 'SYSTEM_ADMIN' },
    { name: 'Manager Koperasi', email: 'manager@karyatani.local', role: 'COOPERATIVE_MANAGER' },
    { name: 'Supervisor QC', email: 'supervisor.qc@karyatani.local', role: 'QC_SUPERVISOR' },
    { name: 'Petugas QC', email: 'qc@karyatani.local', role: 'QC_OFFICER' },
    { name: 'Staff Keuangan', email: 'finance@karyatani.local', role: 'FINANCE_STAFF' },
    { name: 'Admin Koperasi', email: 'koperasi@karyatani.local', role: 'ADMIN_KOPERASI' },
    { name: 'Viewer', email: 'viewer@karyatani.local', role: 'VIEWER' },
  ]

  for (const userDef of userDefinitions) {
    const user = await prisma.user.upsert({
      where: { email: userDef.email },
      update: { name: userDef.name, password_hash: passwordHash },
      create: { name: userDef.name, email: userDef.email, password_hash: passwordHash },
    })

    // Delete existing user roles and recreate
    await prisma.userRole.deleteMany({ where: { user_id: user.id } })
    await prisma.userRole.create({
      data: { user_id: user.id, role_id: roles[userDef.role].id },
    })
  }
  console.log(`✅ ${userDefinitions.length} users seeded`)

  // 4. Create Cooperative
  const cooperative = await prisma.cooperative.upsert({
    where: { code: 'KOP-001' },
    update: { name: 'Koperasi Desa Merah Putih Sukamaju' },
    create: {
      code: 'KOP-001',
      name: 'Koperasi Desa Merah Putih Sukamaju',
      province: 'Jawa Barat',
      city: 'Bandung',
      district: 'Sukamaju',
      village: 'Merah Putih',
      address: 'Jl. Koperasi No. 1, Desa Merah Putih',
      legal_number: 'BH/12345/2024',
    },
  })
  console.log('✅ Cooperative seeded')

  // 5. Create Commodities
  const commodityDefinitions = [
    { code: 'CABAI', name: 'Cabai', category: 'Sayuran', default_unit: 'kg', variants: [
      { code: 'CABAI-MK', name: 'Cabai Merah Keriting', unit: 'kg' },
      { code: 'CABAI-RM', name: 'Cabai Rawit Merah', unit: 'kg' },
    ]},
    { code: 'BERAS', name: 'Beras', category: 'Padi-padian', default_unit: 'kg', variants: [
      { code: 'BERAS-MED', name: 'Beras Medium', unit: 'kg' },
      { code: 'BERAS-PREM', name: 'Beras Premium', unit: 'kg' },
    ]},
    { code: 'JAGUNG', name: 'Jagung', category: 'Padi-padian', default_unit: 'kg', variants: [] },
    { code: 'KOPI', name: 'Kopi', category: 'Perkebunan', default_unit: 'kg', variants: [
      { code: 'KOPI-ARA', name: 'Kopi Arabika', unit: 'kg' },
      { code: 'KOPI-ROB', name: 'Kopi Robusta', unit: 'kg' },
    ]},
    { code: 'KAKAO', name: 'Kakao', category: 'Perkebunan', default_unit: 'kg', variants: [] },
  ]

  for (const commDef of commodityDefinitions) {
    const commodity = await prisma.commodity.upsert({
      where: { code: commDef.code },
      update: { name: commDef.name, category: commDef.category, default_unit: commDef.default_unit },
      create: { code: commDef.code, name: commDef.name, category: commDef.category, default_unit: commDef.default_unit },
    })

    for (const variant of commDef.variants) {
      await prisma.commodityVariant.upsert({
        where: { code: variant.code },
        update: { name: variant.name, unit: variant.unit },
        create: { commodity_id: commodity.id, code: variant.code, name: variant.name, unit: variant.unit },
      })
    }
  }
  console.log('✅ Commodities and variants seeded')

  // 6. Create Farmers
  const farmerDefinitions = [
    { farmer_number: 'PTN-001', name: 'Pak Budi Santoso', phone: '081234567001', seller_type: 'PEMILIK_LAHAN', representatives: [
      { name: 'Andi', phone: '081234567011', relationship_type: 'PEGAWAI' },
    ]},
    { farmer_number: 'PTN-002', name: 'Bu Sari Wijaya', phone: '081234567002', seller_type: 'PEMILIK_LAHAN', representatives: [
      { name: 'Rina', phone: '081234567012', relationship_type: 'KELUARGA' },
    ]},
    { farmer_number: 'PTN-003', name: 'Pak Joko Prasetyo', phone: '081234567003', seller_type: 'PENGGARAP', representatives: [] },
    { farmer_number: 'PTN-004', name: 'Bu Lina Marlina', phone: '081234567004', seller_type: 'PEMILIK_LAHAN', representatives: [] },
  ]

  for (const farmerDef of farmerDefinitions) {
    const farmer = await prisma.farmer.upsert({
      where: { farmer_number: farmerDef.farmer_number },
      update: { name: farmerDef.name, phone: farmerDef.phone, seller_type: farmerDef.seller_type },
      create: {
        cooperative_id: cooperative.id,
        farmer_number: farmerDef.farmer_number,
        name: farmerDef.name,
        phone: farmerDef.phone,
        seller_type: farmerDef.seller_type,
        verification_status: 'TERVERIFIKASI',
      },
    })

    for (const repDef of farmerDef.representatives) {
      // Check if representative already exists for this farmer
      const existing = await prisma.farmerRepresentative.findFirst({
        where: { farmer_id: farmer.id, name: repDef.name },
      })
      if (!existing) {
        await prisma.farmerRepresentative.create({
          data: {
            farmer_id: farmer.id,
            name: repDef.name,
            phone: repDef.phone,
            relationship_type: repDef.relationship_type,
          },
        })
      }
    }
  }
  console.log('✅ Farmers and representatives seeded')

  console.log('\n🌾 Seed selesai!')
  console.log('\nAkun demo:')
  console.log('─'.repeat(50))
  userDefinitions.forEach(u => {
    console.log(`  ${u.email} / password123 (${u.role})`)
  })
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
