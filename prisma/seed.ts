import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 0. Clean up in FK-safe order
  await prisma.auditLog.deleteMany()
  await prisma.farmerSalePhoto.deleteMany()
  await prisma.qcGradeBreakdown.deleteMany()
  await prisma.qcResultItem.deleteMany()
  await prisma.qcResult.deleteMany()
  await prisma.dispute.deleteMany()
  await prisma.farmerWalletMutation.deleteMany()
  await prisma.farmerPayout.deleteMany()
  await prisma.farmerWallet.deleteMany()
  await prisma.farmerSale.deleteMany()
  await prisma.qcTemplateItem.deleteMany()
  await prisma.qcTemplate.deleteMany()
  await prisma.priceListItem.deleteMany()
  await prisma.priceList.deleteMany()
  await prisma.farmerRepresentative.deleteMany()
  await prisma.farmer.deleteMany()
  await prisma.cooperative.deleteMany()
  await prisma.commodityVariant.deleteMany()
  await prisma.commodity.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.user.deleteMany()
  console.log('🧹 Cleaned existing data')

  // 1. Permissions
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
    { code: 'price_lists.edit', name: 'Edit Daftar Harga', module: 'price_lists' },
    { code: 'qc_templates.view', name: 'Lihat Template QC', module: 'qc_templates' },
    { code: 'qc_templates.create', name: 'Buat Template QC', module: 'qc_templates' },
    { code: 'qc_templates.update', name: 'Ubah Template QC', module: 'qc_templates' },
    { code: 'qc_templates.edit', name: 'Edit Template QC', module: 'qc_templates' },
    { code: 'farmer_sales.view', name: 'Lihat Penjualan', module: 'farmer_sales' },
    { code: 'farmer_sales.create', name: 'Buat Penjualan', module: 'farmer_sales' },
    { code: 'farmer_sales.update', name: 'Ubah Penjualan', module: 'farmer_sales' },
    { code: 'farmer_sales.edit', name: 'Edit Penjualan', module: 'farmer_sales' },
    { code: 'qc_results.view', name: 'Lihat Hasil QC', module: 'qc_results' },
    { code: 'qc_results.create', name: 'Buat Hasil QC', module: 'qc_results' },
    { code: 'qc_history.view', name: 'Lihat Riwayat QC', module: 'qc_history' },
    { code: 'farmer_payouts.view', name: 'Lihat Bayar Petani', module: 'farmer_payouts' },
    { code: 'farmer_payouts.create', name: 'Buat Pembayaran', module: 'farmer_payouts' },
    { code: 'farmer_payouts.edit', name: 'Edit Pembayaran', module: 'farmer_payouts' },
    { code: 'farmer_wallets.view', name: 'Lihat Saldo Petani', module: 'farmer_wallets' },
    { code: 'farmer_wallet_mutations.view', name: 'Lihat Riwayat Saldo', module: 'farmer_wallet_mutations' },
    { code: 'disputes.view', name: 'Lihat Keberatan', module: 'disputes' },
    { code: 'disputes.create', name: 'Buat Keberatan', module: 'disputes' },
    { code: 'disputes.resolve', name: 'Selesaikan Keberatan', module: 'disputes' },
    { code: 'disputes.edit', name: 'Edit Keberatan', module: 'disputes' },
    { code: 'batch.view', name: 'Lihat Batch', module: 'batch' },
    { code: 'reports.view', name: 'Lihat Laporan', module: 'reports' },
    { code: 'reports.export', name: 'Ekspor Laporan', module: 'reports' },
    { code: 'audit_logs.view', name: 'Lihat Audit Log', module: 'audit_logs' },
    { code: 'users.view', name: 'Lihat Pengguna', module: 'users' },
    { code: 'users.create', name: 'Buat Pengguna', module: 'users' },
    { code: 'users.update', name: 'Ubah Pengguna', module: 'users' },
    { code: 'users.edit', name: 'Edit Pengguna', module: 'users' },
    { code: 'roles.view', name: 'Lihat Hak Akses', module: 'roles' },
    { code: 'roles.create', name: 'Buat Peran', module: 'roles' },
    { code: 'roles.update', name: 'Ubah Peran', module: 'roles' },
    { code: 'api_access.view', name: 'Lihat Akses API', module: 'api_access' },
    { code: 'settings.view', name: 'Lihat Pengaturan', module: 'settings' },
  ]

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

  // 2. Roles
  const roleDefinitions = [
    {
      code: 'SYSTEM_ADMIN', name: 'System Admin',
      description: 'Administrator sistem dengan akses penuh',
      permissions: Object.keys(permissions),
    },
    {
      code: 'COOPERATIVE_MANAGER', name: 'Manager Koperasi',
      description: 'Manajer koperasi dengan akses luas',
      permissions: [
        'dashboard.view', 'cooperatives.view', 'cooperatives.update',
        'farmers.view', 'farmers.create', 'farmers.update',
        'farmer_representatives.view', 'farmer_representatives.create', 'farmer_representatives.update',
        'commodities.view', 'commodities.create', 'commodities.update',
        'price_lists.view', 'price_lists.create', 'price_lists.update', 'price_lists.edit',
        'qc_templates.view', 'qc_templates.create', 'qc_templates.update', 'qc_templates.edit',
        'farmer_sales.view', 'farmer_sales.create', 'farmer_sales.update', 'farmer_sales.edit',
        'qc_results.view', 'qc_results.create', 'qc_history.view',
        'farmer_payouts.view', 'farmer_payouts.create', 'farmer_payouts.edit',
        'farmer_wallets.view', 'farmer_wallet_mutations.view',
        'disputes.view', 'disputes.create', 'disputes.resolve', 'disputes.edit',
        'batch.view', 'reports.view', 'reports.export', 'audit_logs.view', 'settings.view',
      ],
    },
    {
      code: 'QC_SUPERVISOR', name: 'Supervisor QC',
      description: 'Supervisor pemeriksaan kualitas',
      permissions: [
        'dashboard.view', 'farmers.view', 'farmer_representatives.view',
        'commodities.view', 'price_lists.view',
        'qc_templates.view', 'qc_templates.create', 'qc_templates.update', 'qc_templates.edit',
        'farmer_sales.view', 'farmer_sales.edit',
        'qc_results.view', 'qc_results.create', 'qc_history.view',
        'disputes.view', 'disputes.resolve', 'disputes.edit', 'batch.view', 'reports.view',
      ],
    },
    {
      code: 'QC_OFFICER', name: 'Petugas QC',
      description: 'Petugas pemeriksaan kualitas',
      permissions: [
        'dashboard.view', 'farmers.view', 'farmer_representatives.view',
        'commodities.view', 'price_lists.view', 'qc_templates.view',
        'farmer_sales.view', 'qc_results.view', 'qc_results.create', 'qc_history.view', 'batch.view',
      ],
    },
    {
      code: 'FINANCE_STAFF', name: 'Staff Keuangan',
      description: 'Staff bagian keuangan',
      permissions: [
        'dashboard.view', 'farmers.view', 'farmer_representatives.view',
        'commodities.view', 'price_lists.view',
        'farmer_sales.view', 'farmer_sales.edit', 'qc_results.view', 'qc_history.view',
        'farmer_payouts.view', 'farmer_payouts.create', 'farmer_payouts.edit',
        'farmer_wallets.view', 'farmer_wallet_mutations.view',
        'disputes.view', 'batch.view', 'reports.view', 'reports.export',
      ],
    },
    {
      code: 'ADMIN_KOPERASI', name: 'Admin Koperasi',
      description: 'Administrator koperasi',
      permissions: [
        'dashboard.view', 'cooperatives.view',
        'farmers.view', 'farmers.create', 'farmers.update',
        'farmer_representatives.view', 'farmer_representatives.create', 'farmer_representatives.update',
        'commodities.view', 'commodities.create', 'commodities.update',
        'price_lists.view', 'price_lists.create', 'price_lists.update', 'price_lists.edit',
        'qc_templates.view',
        'farmer_sales.view', 'farmer_sales.create', 'farmer_sales.update', 'farmer_sales.edit',
        'qc_results.view', 'qc_history.view',
        'farmer_payouts.view', 'farmer_wallets.view', 'farmer_wallet_mutations.view',
        'disputes.view', 'disputes.create', 'batch.view', 'reports.view', 'users.view', 'settings.view',
      ],
    },
    {
      code: 'VIEWER', name: 'Viewer',
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
    // rolePermissions already cleaned above
    for (const permCode of roleDef.permissions) {
      if (permissions[permCode]) {
        await prisma.rolePermission.create({
          data: { role_id: role.id, permission_id: permissions[permCode].id },
        })
      }
    }
  }
  console.log(`✅ ${roleDefinitions.length} roles seeded`)

  // 3. Users
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

  const users: Record<string, any> = {}
  for (const userDef of userDefinitions) {
    const user = await prisma.user.upsert({
      where: { email: userDef.email },
      update: { name: userDef.name, password_hash: passwordHash },
      create: { name: userDef.name, email: userDef.email, password_hash: passwordHash },
    })
    users[userDef.email] = user
    // userRoles already cleaned above
    await prisma.userRole.create({
      data: { user_id: user.id, role_id: roles[userDef.role].id },
    })
  }
  console.log(`✅ ${userDefinitions.length} users seeded`)

  // 4. Cooperative
  const cooperative = await prisma.cooperative.upsert({
    where: { code: 'KOP-001' },
    update: { name: 'Koperasi Desa Merah Putih Sukamaju' },
    create: {
      code: 'KOP-001', name: 'Koperasi Desa Merah Putih Sukamaju',
      province: 'Jawa Barat', city: 'Bandung', district: 'Sukamaju',
      village: 'Merah Putih', address: 'Jl. Koperasi No. 1, Desa Merah Putih',
      legal_number: 'BH/12345/2024',
    },
  })
  console.log('✅ Cooperative seeded')

  // 5. Commodities + Variants
  const commodityDefinitions = [
    { code: 'CABAI', name: 'Cabai', category: 'Sayuran', default_unit: 'kg', variants: [
      { code: 'CABAI-MK', name: 'Cabai Merah Keriting', unit: 'kg' },
      { code: 'CABAI-RM', name: 'Cabai Rawit Merah', unit: 'kg' },
    ]},
    { code: 'BERAS', name: 'Beras', category: 'Padi-padian', default_unit: 'kg', variants: [
      { code: 'BERAS-MED', name: 'Beras Medium', unit: 'kg' },
      { code: 'BERAS-PREM', name: 'Beras Premium', unit: 'kg' },
    ]},
    { code: 'JAGUNG', name: 'Jagung', category: 'Padi-padian', default_unit: 'kg', variants: [
      { code: 'JAGUNG-PPL', name: 'Jagung Pipil', unit: 'kg' },
    ]},
    { code: 'KOPI', name: 'Kopi', category: 'Perkebunan', default_unit: 'kg', variants: [
      { code: 'KOPI-ARA', name: 'Kopi Arabika', unit: 'kg' },
      { code: 'KOPI-ROB', name: 'Kopi Robusta', unit: 'kg' },
    ]},
    { code: 'KAKAO', name: 'Kakao', category: 'Perkebunan', default_unit: 'kg', variants: [
      { code: 'KAKAO-FER', name: 'Kakao Fermentasi', unit: 'kg' },
    ]},
  ]

  const commodities: Record<string, any> = {}
  const variants: Record<string, any> = {}
  for (const def of commodityDefinitions) {
    const commodity = await prisma.commodity.upsert({
      where: { code: def.code },
      update: { name: def.name, category: def.category, default_unit: def.default_unit },
      create: { code: def.code, name: def.name, category: def.category, default_unit: def.default_unit },
    })
    commodities[def.code] = commodity
    for (const v of def.variants) {
      const variant = await prisma.commodityVariant.upsert({
        where: { code: v.code },
        update: { name: v.name, unit: v.unit },
        create: { commodity_id: commodity.id, code: v.code, name: v.name, unit: v.unit },
      })
      variants[v.code] = variant
    }
  }
  console.log('✅ Commodities and variants seeded')

  // 6. Farmers + Representatives
  const farmerDefinitions = [
    { farmer_number: 'PTN-001', name: 'Pak Budi Santoso', phone: '081234567001', seller_type: 'PEMILIK_LAHAN', village: 'Merah Putih', address: 'Jl. Sawah No. 1', reps: [
      { name: 'Andi', phone: '081234567011', relationship_type: 'PEGAWAI' },
    ]},
    { farmer_number: 'PTN-002', name: 'Bu Sari Wijaya', phone: '081234567002', seller_type: 'PEMILIK_LAHAN', village: 'Sukamaju', address: 'Jl. Kebun No. 5', reps: [
      { name: 'Rina', phone: '081234567012', relationship_type: 'KELUARGA' },
    ]},
    { farmer_number: 'PTN-003', name: 'Pak Joko Prasetyo', phone: '081234567003', seller_type: 'PENGGARAP', village: 'Cikembar', address: 'Jl. Ladang No. 3', reps: [] },
    { farmer_number: 'PTN-004', name: 'Bu Lina Marlina', phone: '081234567004', seller_type: 'PEMILIK_LAHAN', village: 'Sukamaju', address: 'Jl. Tani No. 7', reps: [] },
  ]

  const farmers: Record<string, any> = {}
  const reps: Record<string, any> = {}
  for (const def of farmerDefinitions) {
    const farmer = await prisma.farmer.upsert({
      where: { farmer_number: def.farmer_number },
      update: { name: def.name, phone: def.phone, seller_type: def.seller_type, village: def.village, address: def.address },
      create: {
        cooperative_id: cooperative.id, farmer_number: def.farmer_number, name: def.name,
        phone: def.phone, seller_type: def.seller_type, verification_status: 'TERVERIFIKASI',
        village: def.village, address: def.address,
      },
    })
    farmers[def.farmer_number] = farmer
    for (const r of def.reps) {
      const existing = await prisma.farmerRepresentative.findFirst({
        where: { farmer_id: farmer.id, name: r.name },
      })
      const rep = existing || await prisma.farmerRepresentative.create({
        data: { farmer_id: farmer.id, name: r.name, phone: r.phone, relationship_type: r.relationship_type },
      })
      reps[r.name] = rep
    }
  }
  console.log('✅ Farmers and representatives seeded')

  // 7. Price List with items
  const priceList = await prisma.priceList.upsert({
    where: { id: (await prisma.priceList.findFirst({ where: { cooperative_id: cooperative.id, name: 'Daftar Harga Minggu Ini' } }))?.id || 'new-id' },
    update: {},
    create: {
      cooperative_id: cooperative.id,
      name: 'Daftar Harga Minggu Ini',
      valid_from: new Date('2026-07-07'),
      valid_until: new Date('2026-07-13'),
      status: 'AKTIF',
    },
  })

  const priceItems = [
    { commodity_id: commodities['CABAI'].id, commodity_variant_id: variants['CABAI-MK'].id, grade_name: 'Grade A', grade_code: 'A', price_per_unit: 12000, unit: 'kg', is_reject: false, sort_order: 1 },
    { commodity_id: commodities['CABAI'].id, commodity_variant_id: variants['CABAI-MK'].id, grade_name: 'Grade B', grade_code: 'B', price_per_unit: 9000, unit: 'kg', is_reject: false, sort_order: 2 },
    { commodity_id: commodities['CABAI'].id, commodity_variant_id: variants['CABAI-MK'].id, grade_name: 'Grade C', grade_code: 'C', price_per_unit: 5000, unit: 'kg', is_reject: false, sort_order: 3 },
    { commodity_id: commodities['CABAI'].id, commodity_variant_id: variants['CABAI-MK'].id, grade_name: 'Reject', grade_code: 'REJECT', price_per_unit: 0, unit: 'kg', is_reject: true, sort_order: 4 },
    { commodity_id: commodities['BERAS'].id, commodity_variant_id: variants['BERAS-MED'].id, grade_name: 'Grade A', grade_code: 'A', price_per_unit: 7000, unit: 'kg', is_reject: false, sort_order: 1 },
    { commodity_id: commodities['BERAS'].id, commodity_variant_id: variants['BERAS-MED'].id, grade_name: 'Grade B', grade_code: 'B', price_per_unit: 6000, unit: 'kg', is_reject: false, sort_order: 2 },
    { commodity_id: commodities['BERAS'].id, commodity_variant_id: variants['BERAS-MED'].id, grade_name: 'Grade C', grade_code: 'C', price_per_unit: 4500, unit: 'kg', is_reject: false, sort_order: 3 },
    { commodity_id: commodities['BERAS'].id, commodity_variant_id: variants['BERAS-MED'].id, grade_name: 'Reject', grade_code: 'REJECT', price_per_unit: 0, unit: 'kg', is_reject: true, sort_order: 4 },
    { commodity_id: commodities['KOPI'].id, commodity_variant_id: variants['KOPI-ARA'].id, grade_name: 'Grade A', grade_code: 'A', price_per_unit: 45000, unit: 'kg', is_reject: false, sort_order: 1 },
    { commodity_id: commodities['KOPI'].id, commodity_variant_id: variants['KOPI-ARA'].id, grade_name: 'Grade B', grade_code: 'B', price_per_unit: 35000, unit: 'kg', is_reject: false, sort_order: 2 },
    { commodity_id: commodities['KOPI'].id, commodity_variant_id: variants['KOPI-ARA'].id, grade_name: 'Grade C', grade_code: 'C', price_per_unit: 25000, unit: 'kg', is_reject: false, sort_order: 3 },
    { commodity_id: commodities['KOPI'].id, commodity_variant_id: variants['KOPI-ARA'].id, grade_name: 'Reject', grade_code: 'REJECT', price_per_unit: 0, unit: 'kg', is_reject: true, sort_order: 4 },
  ]

  // priceListItems already cleaned above
  for (const item of priceItems) {
    await prisma.priceListItem.create({ data: { price_list_id: priceList.id, ...item } })
  }
  console.log('✅ Price list and items seeded')

  // 8. QC Templates
  const cabaiTemplate = await prisma.qcTemplate.upsert({
    where: { id: (await prisma.qcTemplate.findFirst({ where: { cooperative_id: cooperative.id, commodity_id: commodities['CABAI'].id, name: 'Template QC Cabai' } }))?.id || 'new-id' },
    update: {},
    create: {
      cooperative_id: cooperative.id, commodity_id: commodities['CABAI'].id,
      commodity_variant_id: variants['CABAI-MK'].id,
      name: 'Template QC Cabai', version: 1,
      valid_from: new Date('2026-01-01'), status: 'AKTIF',
    },
  })

  // qcTemplateItems already cleaned above
  const cabaiItems = [
    { item_name: 'Warna', item_code: 'WARNA', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Merah Dominan', 'Campuran', 'Hijau'], sort_order: 1 },
    { item_name: 'Kesegaran', item_code: 'SEGAR', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Segar', 'Mulai Layu', 'Layu'], sort_order: 2 },
    { item_name: 'Kerusakan', item_code: 'RUSAK', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 3 },
    { item_name: 'Kotoran', item_code: 'KOTOR', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 4 },
    { item_name: 'Foto QC', item_code: 'FOTO', input_type: 'FOTO', is_required: true, requires_proof: true, sort_order: 5 },
    { item_name: 'Catatan', item_code: 'CATATAN', input_type: 'CATATAN', is_required: false, requires_proof: false, sort_order: 6 },
  ]
  for (const item of cabaiItems) {
    await prisma.qcTemplateItem.create({ data: { qc_template_id: cabaiTemplate.id, ...item } })
  }

  const berasTemplate = await prisma.qcTemplate.upsert({
    where: { id: (await prisma.qcTemplate.findFirst({ where: { cooperative_id: cooperative.id, commodity_id: commodities['BERAS'].id, name: 'Template QC Beras' } }))?.id || 'new-id' },
    update: {},
    create: {
      cooperative_id: cooperative.id, commodity_id: commodities['BERAS'].id,
      commodity_variant_id: variants['BERAS-MED'].id,
      name: 'Template QC Beras', version: 1,
      valid_from: new Date('2026-01-01'), status: 'AKTIF',
    },
  })

  // qcTemplateItems already cleaned above
  const berasItems = [
    { item_name: 'Kadar Air', item_code: 'AIR', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 1 },
    { item_name: 'Butir Patah', item_code: 'PATAH', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 2 },
    { item_name: 'Kotoran', item_code: 'KOTOR', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 3 },
    { item_name: 'Bau', item_code: 'BAU', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Normal', 'Apek', 'Tidak Layak'], sort_order: 4 },
    { item_name: 'Foto QC', item_code: 'FOTO', input_type: 'FOTO', is_required: true, requires_proof: true, sort_order: 5 },
  ]
  for (const item of berasItems) {
    await prisma.qcTemplateItem.create({ data: { qc_template_id: berasTemplate.id, ...item } })
  }
  console.log('✅ QC templates seeded')

  // 9. Demo Sale - Pak Budi sells Cabai Merah Keriting, 100kg, QC done, price calculated
  const adminUser = users['admin@karyatani.local']
  const qcUser = users['qc@karyatani.local']
  const pakBudi = farmers['PTN-001']
  const andi = reps['Andi']

  const existingSale = await prisma.farmerSale.findFirst({ where: { sale_number: 'JUAL-20260710-0001' } })
  if (!existingSale) {
    const sale = await prisma.farmerSale.create({
      data: {
        cooperative_id: cooperative.id, farmer_id: pakBudi.id,
        representative_id: andi.id, commodity_id: commodities['CABAI'].id,
        commodity_variant_id: variants['CABAI-MK'].id,
        price_list_id: priceList.id, qc_template_id: cabaiTemplate.id,
        sale_number: 'JUAL-20260710-0001', batch_number: 'BATCH-CABAI-20260710-0001',
        initial_weight: 102, received_weight: 100, total_amount: 995000,
        status: 'MENUNGGU_PEMBAYARAN', notes: 'Demo penjualan cabai merah keriting',
        received_by_user_id: adminUser.id, received_at: new Date(),
        calculated_at: new Date(),
      },
    })

    // QC Result
    const qcTemplateItems = await prisma.qcTemplateItem.findMany({ where: { qc_template_id: cabaiTemplate.id }, orderBy: { sort_order: 'asc' } })

    const qcResult = await prisma.qcResult.create({
      data: {
        farmer_sale_id: sale.id, cooperative_id: cooperative.id,
        farmer_id: pakBudi.id, qc_template_id: cabaiTemplate.id,
        qc_officer_user_id: qcUser.id, final_grade_code: 'A',
        total_weight_checked: 100, final_accepted_weight: 95,
        total_rejected_weight: 5, notes: 'Kualitas cabai baik secara keseluruhan.',
        status: 'DIKIRIM', submitted_at: new Date(),
      },
    })

    // QC Result Items
    for (const ti of qcTemplateItems) {
      let value_text = null
      let value_number = null
      if (ti.item_code === 'WARNA') value_text = 'Merah Dominan'
      else if (ti.item_code === 'SEGAR') value_text = 'Segar'
      else if (ti.item_code === 'RUSAK') value_number = 3
      else if (ti.item_code === 'KOTOR') value_number = 2
      else if (ti.item_code === 'CATATAN') value_text = 'Cabai dalam kondisi baik.'
      else continue

      await prisma.qcResultItem.create({
        data: { qc_result_id: qcResult.id, qc_template_item_id: ti.id, value_text, value_number },
      })
    }

    // Grade Breakdown
    const gradeBreakdowns = [
      { grade_name: 'Grade A', grade_code: 'A', weight: 60, price_per_unit: 12000, estimated_amount: 720000 },
      { grade_name: 'Grade B', grade_code: 'B', weight: 25, price_per_unit: 9000, estimated_amount: 225000 },
      { grade_name: 'Grade C', grade_code: 'C', weight: 10, price_per_unit: 5000, estimated_amount: 50000 },
      { grade_name: 'Reject', grade_code: 'REJECT', weight: 5, price_per_unit: 0, estimated_amount: 0 },
    ]
    for (const gb of gradeBreakdowns) {
      await prisma.qcGradeBreakdown.create({
        data: { qc_result_id: qcResult.id, ...gb },
      })
    }

    // Wallet + Mutation
    const wallet = await prisma.farmerWallet.upsert({
      where: { id: (await prisma.farmerWallet.findFirst({ where: { farmer_id: pakBudi.id, cooperative_id: cooperative.id } }))?.id || 'new-id' },
      update: { available_balance: 995000 },
      create: {
        cooperative_id: cooperative.id, farmer_id: pakBudi.id,
        available_balance: 995000, held_balance: 0, total_paid: 0,
      },
    })

    await prisma.farmerWalletMutation.create({
      data: {
        cooperative_id: cooperative.id, farmer_id: pakBudi.id, wallet_id: wallet.id,
        mutation_type: 'HASIL_PENJUALAN', reference_type: 'FARMER_SALE', reference_id: sale.id,
        amount_in: 995000, amount_out: 0, balance_before: 0, balance_after: 995000,
        notes: 'Hasil penjualan JUAL-20260710-0001', created_by_user_id: adminUser.id,
      },
    })

    // Audit logs
    await prisma.auditLog.create({
      data: {
        actor_user_id: adminUser.id, entity_type: 'FARMER_SALE', entity_id: sale.id,
        action: 'CREATE', source_client: 'SYSTEM',
        after_json: { sale_number: sale.sale_number, farmer: pakBudi.name, commodity: 'Cabai Merah Keriting' },
      },
    })
    await prisma.auditLog.create({
      data: {
        actor_user_id: qcUser.id, entity_type: 'QC_RESULT', entity_id: qcResult.id,
        action: 'SUBMIT', source_client: 'SYSTEM',
        after_json: { final_grade: 'A', accepted_weight: 95, rejected_weight: 5 },
      },
    })
    await prisma.auditLog.create({
      data: {
        actor_user_id: adminUser.id, entity_type: 'FARMER_SALE', entity_id: sale.id,
        action: 'CALCULATE_PRICE', source_client: 'SYSTEM',
        after_json: { total_amount: 995000 },
      },
    })

    console.log('✅ Demo sale (Pak Budi - Cabai Merah Keriting, Rp995.000) seeded')
  } else {
    console.log('⏭️ Demo sale already exists, skipping')
  }

  // 10. Second demo sale - Bu Sari, Beras, waiting for QC
  const buSari = farmers['PTN-002']
  const existingSale2 = await prisma.farmerSale.findFirst({ where: { sale_number: 'JUAL-20260710-0002' } })
  if (!existingSale2) {
    await prisma.farmerSale.create({
      data: {
        cooperative_id: cooperative.id, farmer_id: buSari.id,
        commodity_id: commodities['BERAS'].id, commodity_variant_id: variants['BERAS-MED'].id,
        price_list_id: priceList.id, qc_template_id: berasTemplate.id,
        sale_number: 'JUAL-20260710-0002', batch_number: 'BATCH-BERAS-20260710-0001',
        initial_weight: 55, received_weight: 50,
        status: 'MENUNGGU_QC', notes: 'Beras medium dari Bu Sari',
        received_by_user_id: adminUser.id, received_at: new Date(),
      },
    })
    console.log('✅ Demo sale 2 (Bu Sari - Beras Medium, menunggu QC) seeded')
  }

  // 11. Third demo sale - Pak Joko, Kopi, waiting for QC
  const pakJoko = farmers['PTN-003']
  const existingSale3 = await prisma.farmerSale.findFirst({ where: { sale_number: 'JUAL-20260710-0003' } })
  if (!existingSale3) {
    await prisma.farmerSale.create({
      data: {
        cooperative_id: cooperative.id, farmer_id: pakJoko.id,
        commodity_id: commodities['KOPI'].id, commodity_variant_id: variants['KOPI-ARA'].id,
        price_list_id: priceList.id,
        sale_number: 'JUAL-20260710-0003', batch_number: 'BATCH-KOPI-20260710-0001',
        initial_weight: 30, received_weight: 28,
        status: 'MENUNGGU_QC', notes: 'Kopi arabika dari Pak Joko',
        received_by_user_id: adminUser.id, received_at: new Date(),
      },
    })
    console.log('✅ Demo sale 3 (Pak Joko - Kopi Arabika, menunggu QC) seeded')
  }

  // Create wallets for other farmers
  for (const fn of ['PTN-002', 'PTN-003', 'PTN-004']) {
    const f = farmers[fn]
    await prisma.farmerWallet.upsert({
      where: { id: (await prisma.farmerWallet.findFirst({ where: { farmer_id: f.id, cooperative_id: cooperative.id } }))?.id || 'new-wallet' },
      update: {},
      create: {
        cooperative_id: cooperative.id, farmer_id: f.id,
        available_balance: 0, held_balance: 0, total_paid: 0,
      },
    })
  }
  console.log('✅ Farmer wallets seeded')

  console.log('\n🌾 Seed selesai!')
  console.log('\nAkun demo:')
  console.log('─'.repeat(50))
  userDefinitions.forEach(u => {
    console.log(`  ${u.email} / password123 (${u.role})`)
  })
  console.log('\nDemo penjualan:')
  console.log('  JUAL-20260710-0001 — Pak Budi, Cabai Merah Keriting, 100kg, QC selesai, Rp995.000')
  console.log('  JUAL-20260710-0002 — Bu Sari, Beras Medium, 50kg, menunggu QC')
  console.log('  JUAL-20260710-0003 — Pak Joko, Kopi Arabika, 28kg, menunggu QC')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
