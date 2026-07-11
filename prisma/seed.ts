import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 0. Clean up in FK-safe order
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.stockBalance.deleteMany()
  await prisma.stockAdjustment.deleteMany()
  await prisma.stockDisposal.deleteMany()
  await prisma.stockDelivery.deleteMany()
  await prisma.warehouseLocation.deleteMany()
  await prisma.warehouse.deleteMany()
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
  await prisma.farmerSource.deleteMany()
  await prisma.farmer.deleteMany()
  await prisma.userCooperative.deleteMany()
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
    // Persediaan / Inventory
    { code: 'warehouses.view', name: 'Lihat Gudang', module: 'warehouses' },
    { code: 'warehouses.create', name: 'Buat Gudang', module: 'warehouses' },
    { code: 'warehouses.update', name: 'Ubah Gudang', module: 'warehouses' },
    { code: 'warehouse_locations.view', name: 'Lihat Lokasi Gudang', module: 'warehouse_locations' },
    { code: 'warehouse_locations.create', name: 'Buat Lokasi Gudang', module: 'warehouse_locations' },
    { code: 'warehouse_locations.update', name: 'Ubah Lokasi Gudang', module: 'warehouse_locations' },
    { code: 'stock.view', name: 'Lihat Stok', module: 'stock' },
    { code: 'stock_movements.view', name: 'Lihat Kartu Stok', module: 'stock_movements' },
    { code: 'stock_adjustments.view', name: 'Lihat Penyesuaian Stok', module: 'stock_adjustments' },
    { code: 'stock_adjustments.create', name: 'Buat Penyesuaian Stok', module: 'stock_adjustments' },
    { code: 'stock_adjustments.approve', name: 'Setujui Penyesuaian Stok', module: 'stock_adjustments' },
    { code: 'stock_disposals.view', name: 'Lihat Pemusnahan Stok', module: 'stock_disposals' },
    { code: 'stock_disposals.create', name: 'Buat Pemusnahan Stok', module: 'stock_disposals' },
    { code: 'stock_disposals.approve', name: 'Setujui Pemusnahan Stok', module: 'stock_disposals' },
    { code: 'stock_deliveries.view', name: 'Lihat Pengiriman', module: 'stock_deliveries' },
    { code: 'stock_deliveries.create', name: 'Buat Pengiriman', module: 'stock_deliveries' },
    { code: 'stock_deliveries.complete', name: 'Selesaikan Pengiriman', module: 'stock_deliveries' },
    { code: 'stock_reports.view', name: 'Lihat Laporan Stok', module: 'stock_reports' },
    { code: 'stock_reports.export', name: 'Ekspor Laporan Stok', module: 'stock_reports' },
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
        'warehouses.view', 'warehouses.create', 'warehouses.update',
        'warehouse_locations.view', 'warehouse_locations.create', 'warehouse_locations.update',
        'stock.view', 'stock_movements.view',
        'stock_adjustments.view', 'stock_adjustments.create', 'stock_adjustments.approve',
        'stock_disposals.view', 'stock_disposals.create', 'stock_disposals.approve',
        'stock_deliveries.view', 'stock_deliveries.create', 'stock_deliveries.complete',
        'stock_reports.view', 'stock_reports.export',
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
        'warehouses.view', 'warehouse_locations.view',
        'stock.view', 'stock_movements.view',
        'stock_adjustments.view', 'stock_adjustments.create',
        'stock_disposals.view', 'stock_disposals.create',
        'stock_deliveries.view',
        'stock_reports.view', 'stock_reports.export',
      ],
    },
    {
      code: 'QC_OFFICER', name: 'Petugas QC',
      description: 'Petugas pemeriksaan kualitas (dapat digunakan untuk aplikasi TaniTrust Mobile QC)',
      permissions: [
        'dashboard.view',
        'cooperatives.view',
        'farmers.view', 'farmers.create',
        'farmer_representatives.view',
        'commodities.view', 'price_lists.view', 'qc_templates.view',
        'farmer_sales.view', 'farmer_sales.create', 'farmer_sales.edit',
        'qc_results.view', 'qc_results.create',
        'qc_history.view', 'batch.view',
        'warehouses.view', 'warehouse_locations.view',
        'stock.view', 'stock_movements.view',
        'stock_adjustments.view', 'stock_disposals.view',
        'stock_reports.view',
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
        'stock.view', 'stock_movements.view', 'stock_deliveries.view',
        'stock_reports.view', 'stock_reports.export',
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
        'warehouses.view', 'warehouse_locations.view',
        'stock.view', 'stock_movements.view',
        'stock_adjustments.view', 'stock_adjustments.create',
        'stock_disposals.view', 'stock_disposals.create',
        'stock_deliveries.view', 'stock_deliveries.create',
        'stock_reports.view',
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
        'stock.view', 'stock_movements.view', 'stock_reports.view',
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
    { name: 'System Admin', email: 'admin@karyatani.local', phone: '081200000001', role: 'SYSTEM_ADMIN' },
    { name: 'Manager Koperasi', email: 'manager@karyatani.local', phone: '081200000002', role: 'COOPERATIVE_MANAGER' },
    { name: 'Supervisor QC', email: 'supervisor.qc@karyatani.local', phone: '081200000003', role: 'QC_SUPERVISOR' },
    { name: 'Siti Rahma', email: 'qc@karyatani.local', phone: '081234567890', role: 'QC_OFFICER' },
    { name: 'Staff Keuangan', email: 'finance@karyatani.local', phone: '081200000005', role: 'FINANCE_STAFF' },
    { name: 'Admin Koperasi', email: 'koperasi@karyatani.local', phone: '081200000006', role: 'ADMIN_KOPERASI' },
    { name: 'Viewer', email: 'viewer@karyatani.local', phone: '081200000007', role: 'VIEWER' },
  ]

  const users: Record<string, any> = {}
  for (const userDef of userDefinitions) {
    const user = await prisma.user.upsert({
      where: { email: userDef.email },
      update: { name: userDef.name, phone: userDef.phone, password_hash: passwordHash },
      create: { name: userDef.name, email: userDef.email, phone: userDef.phone, password_hash: passwordHash },
    })
    users[userDef.email] = user
    await prisma.userRole.create({
      data: { user_id: user.id, role_id: roles[userDef.role].id },
    })
  }
  console.log(`✅ ${userDefinitions.length} users seeded`)

  // 4. Cooperatives
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
  const cooperative2 = await prisma.cooperative.upsert({
    where: { code: 'KOP-002' },
    update: { name: 'Koperasi Desa Makmur Sentosa' },
    create: {
      code: 'KOP-002', name: 'Koperasi Desa Makmur Sentosa',
      province: 'Jawa Barat', city: 'Bandung', district: 'Cikembar',
      village: 'Makmur', address: 'Jl. Koperasi No. 2, Desa Makmur',
      legal_number: 'BH/67890/2024',
    },
  })
  console.log('✅ Cooperatives seeded (KOP-001, KOP-002)')

  // 4b. User-Cooperative mapping
  const userCooperativeMap = [
    { email: 'manager@karyatani.local', assignments: [
      { cooperative_id: cooperative.id, assignment_type: 'MANAGER', is_primary: true },
      { cooperative_id: cooperative2.id, assignment_type: 'MANAGER', is_primary: false },
    ]},
    { email: 'supervisor.qc@karyatani.local', assignments: [
      { cooperative_id: cooperative.id, assignment_type: 'SUPERVISOR_QC', is_primary: true },
      { cooperative_id: cooperative2.id, assignment_type: 'SUPERVISOR_QC', is_primary: false },
    ]},
    { email: 'qc@karyatani.local', assignments: [
      { cooperative_id: cooperative.id, assignment_type: 'PETUGAS_QC', is_primary: true },
    ]},
    { email: 'finance@karyatani.local', assignments: [
      { cooperative_id: cooperative.id, assignment_type: 'STAFF_KEUANGAN', is_primary: true },
    ]},
    { email: 'koperasi@karyatani.local', assignments: [
      { cooperative_id: cooperative.id, assignment_type: 'ADMIN_KOPERASI', is_primary: true },
    ]},
    { email: 'viewer@karyatani.local', assignments: [
      { cooperative_id: cooperative2.id, assignment_type: 'VIEWER', is_primary: true },
    ]},
  ]
  for (const map of userCooperativeMap) {
    const u = users[map.email]
    if (!u) continue
    await prisma.userCooperative.deleteMany({ where: { user_id: u.id } })
    for (const a of map.assignments) {
      await prisma.userCooperative.create({
        data: {
          user_id: u.id,
          cooperative_id: a.cooperative_id,
          assignment_type: a.assignment_type,
          is_primary: a.is_primary,
          status: 'AKTIF',
        },
      })
    }
  }
  console.log(`✅ User-cooperative mappings seeded (${userCooperativeMap.length} users)`)

  // 5. Commodities + Variants — expanded across Hasil Tani, Hasil Kebun, Hasil Ternak
  // Images use Wikimedia Commons Special:FilePath which redirects to the CDN.
  const wm = (file: string) =>
    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=400`

  const commodityDefinitions = [
    // ============= HASIL TANI (Tanaman Pangan & Hortikultura) =============
    { code: 'BERAS', name: 'Beras', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Beras hasil giling dari padi kering.',
      image_url: wm('Reisberg.jpg'), variants: [
      { code: 'BERAS-MED', name: 'Beras Medium', unit: 'kg' },
      { code: 'BERAS-PREM', name: 'Beras Premium', unit: 'kg' },
    ]},
    { code: 'PADI', name: 'Padi', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Gabah kering panen (GKP) atau gabah kering giling (GKG).',
      image_url: wm('Rice_p1160004.jpg'), variants: [
      { code: 'PADI-GKP', name: 'Gabah Kering Panen', unit: 'kg' },
      { code: 'PADI-GKG', name: 'Gabah Kering Giling', unit: 'kg' },
    ]},
    { code: 'JAGUNG', name: 'Jagung', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Jagung pipilan atau tongkol.',
      image_url: wm('Corn_on_the_cob.jpg'), variants: [
      { code: 'JAGUNG-PPL', name: 'Jagung Pipil', unit: 'kg' },
      { code: 'JAGUNG-MDA', name: 'Jagung Manis', unit: 'kg' },
    ]},
    { code: 'KEDELAI', name: 'Kedelai', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Kedelai kering untuk bahan tempe, tahu, dan susu kedelai.',
      image_url: wm('Soybean.USDA.jpg'), variants: [] },
    { code: 'KACANG-TANAH', name: 'Kacang Tanah', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Kacang tanah dengan atau tanpa kulit.',
      image_url: wm('Arachis_hypogaea_003.JPG'), variants: [] },
    { code: 'CABAI', name: 'Cabai', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Cabai segar dari petani, berbagai varian.',
      image_url: wm('Capsicum_annuum_fruits_IMGP0049.jpg'), variants: [
      { code: 'CABAI-MK', name: 'Cabai Merah Keriting', unit: 'kg' },
      { code: 'CABAI-RM', name: 'Cabai Rawit Merah', unit: 'kg' },
      { code: 'CABAI-BSR', name: 'Cabai Merah Besar', unit: 'kg' },
    ]},
    { code: 'BAWANG-MERAH', name: 'Bawang Merah', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Umbi bawang merah kering.',
      image_url: wm('Shallots.jpg'), variants: [] },
    { code: 'BAWANG-PUTIH', name: 'Bawang Putih', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Umbi bawang putih.',
      image_url: wm('Garlic.jpg'), variants: [] },
    { code: 'TOMAT', name: 'Tomat', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Tomat segar hasil panen.',
      image_url: wm('Bright_red_tomato_and_cross_section02.jpg'), variants: [] },
    { code: 'KENTANG', name: 'Kentang', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Umbi kentang segar.',
      image_url: wm('Patates.jpg'), variants: [] },
    { code: 'UBI-KAYU', name: 'Ubi Kayu (Singkong)', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Umbi singkong segar.',
      image_url: wm('Manihot_esculenta_dsc07325.jpg'), variants: [] },
    { code: 'UBI-JALAR', name: 'Ubi Jalar', category: 'Hasil Tani', default_unit: 'kg',
      description: 'Umbi ubi jalar segar, berbagai warna.',
      image_url: wm('Ipomoea_batatas_006.JPG'), variants: [] },

    // ============= HASIL KEBUN (Perkebunan) =============
    { code: 'KOPI', name: 'Kopi', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Biji kopi hasil panen dari petani.',
      image_url: wm('Roasted_coffee_beans.jpg'), variants: [
      { code: 'KOPI-ARA', name: 'Kopi Arabika', unit: 'kg' },
      { code: 'KOPI-ROB', name: 'Kopi Robusta', unit: 'kg' },
    ]},
    { code: 'KAKAO', name: 'Kakao', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Biji kakao untuk industri cokelat.',
      image_url: wm('Cocoa_Pods.JPG'), variants: [
      { code: 'KAKAO-FER', name: 'Kakao Fermentasi', unit: 'kg' },
      { code: 'KAKAO-NFR', name: 'Kakao Non-Fermentasi', unit: 'kg' },
    ]},
    { code: 'SAWIT', name: 'Kelapa Sawit', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Tandan Buah Segar (TBS) kelapa sawit.',
      image_url: wm('Elaeis_guineensis1.jpg'), variants: [
      { code: 'SAWIT-TBS', name: 'TBS Sawit', unit: 'kg' },
    ]},
    { code: 'KARET', name: 'Karet', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Lateks atau bokar karet.',
      image_url: wm('Rubber_tapping_2.jpg'), variants: [
      { code: 'KARET-BKR', name: 'Bokar', unit: 'kg' },
      { code: 'KARET-LTX', name: 'Lateks Cair', unit: 'liter' },
    ]},
    { code: 'TEH', name: 'Teh', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Pucuk daun teh basah dari kebun.',
      image_url: wm('Tea_leaves.jpg'), variants: [] },
    { code: 'KELAPA', name: 'Kelapa', category: 'Hasil Kebun', default_unit: 'butir',
      description: 'Kelapa utuh atau kopra kering.',
      image_url: wm('Coconut_and_oil.jpg'), variants: [
      { code: 'KELAPA-UTH', name: 'Kelapa Butir', unit: 'butir' },
      { code: 'KELAPA-KPR', name: 'Kopra Kering', unit: 'kg' },
    ]},
    { code: 'PISANG', name: 'Pisang', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Pisang segar berbagai varian.',
      image_url: wm('Bananas.jpg'), variants: [
      { code: 'PISANG-MAS', name: 'Pisang Emas', unit: 'kg' },
      { code: 'PISANG-KPK', name: 'Pisang Kepok', unit: 'kg' },
    ]},
    { code: 'MANGGA', name: 'Mangga', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Mangga segar dari kebun.',
      image_url: wm('Hapus_Mango.jpg'), variants: [
      { code: 'MANGGA-HMS', name: 'Mangga Harum Manis', unit: 'kg' },
      { code: 'MANGGA-GDG', name: 'Mangga Gedong Gincu', unit: 'kg' },
    ]},
    { code: 'DURIAN', name: 'Durian', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Durian utuh dengan kulit.',
      image_url: wm('Durian_in_black.jpg'), variants: [] },
    { code: 'MANGGIS', name: 'Manggis', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Buah manggis segar.',
      image_url: wm('Mangosteen.jpg'), variants: [] },
    { code: 'VANILI', name: 'Vanili', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Polong vanili kering hasil kurasi.',
      image_url: wm('Vanilla_6beans.JPG'), variants: [] },
    { code: 'LADA', name: 'Lada', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Lada hitam atau lada putih kering.',
      image_url: wm('Black_pepper.jpg'), variants: [
      { code: 'LADA-HTM', name: 'Lada Hitam', unit: 'kg' },
      { code: 'LADA-PTH', name: 'Lada Putih', unit: 'kg' },
    ]},
    { code: 'CENGKEH', name: 'Cengkeh', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Bunga cengkeh kering.',
      image_url: wm('Cengkeh.jpg'), variants: [] },
    { code: 'PALA', name: 'Pala', category: 'Hasil Kebun', default_unit: 'kg',
      description: 'Biji pala dan fuli.',
      image_url: wm('Muscade.jpg'), variants: [] },

    // ============= HASIL TERNAK =============
    { code: 'SAPI-POTONG', name: 'Sapi Potong', category: 'Hasil Ternak', default_unit: 'ekor',
      description: 'Sapi hidup siap potong (bobot hidup).',
      image_url: wm('Angus_cattle_18.jpg'), variants: [] },
    { code: 'SAPI-PERAH', name: 'Sapi Perah', category: 'Hasil Ternak', default_unit: 'ekor',
      description: 'Sapi perah produksi susu.',
      image_url: wm('Cow_female_black_white.jpg'), variants: [] },
    { code: 'KAMBING', name: 'Kambing', category: 'Hasil Ternak', default_unit: 'ekor',
      description: 'Kambing hidup untuk konsumsi atau kurban.',
      image_url: wm('Domestic_goat_kid_in_capeweed.jpg'), variants: [
      { code: 'KAMBING-JW', name: 'Kambing Jawa', unit: 'ekor' },
      { code: 'KAMBING-ETW', name: 'Kambing Etawa', unit: 'ekor' },
    ]},
    { code: 'DOMBA', name: 'Domba', category: 'Hasil Ternak', default_unit: 'ekor',
      description: 'Domba hidup untuk konsumsi atau kurban.',
      image_url: wm('Flock_of_sheep.jpg'), variants: [] },
    { code: 'AYAM-KPG', name: 'Ayam Kampung', category: 'Hasil Ternak', default_unit: 'ekor',
      description: 'Ayam kampung hidup atau karkas.',
      image_url: wm('Ayam_Kampung.jpg'), variants: [] },
    { code: 'AYAM-BLR', name: 'Ayam Broiler', category: 'Hasil Ternak', default_unit: 'kg',
      description: 'Ayam pedaging (broiler) hidup atau karkas.',
      image_url: wm('Poultry_farm.jpg'), variants: [] },
    { code: 'BEBEK', name: 'Bebek / Itik', category: 'Hasil Ternak', default_unit: 'ekor',
      description: 'Bebek atau itik pedaging maupun petelur.',
      image_url: wm('Anas_platyrhynchos_male_female_quadrat.jpg'), variants: [] },
    { code: 'SUSU-SAPI', name: 'Susu Sapi Segar', category: 'Hasil Ternak', default_unit: 'liter',
      description: 'Susu sapi segar hasil pemerahan harian.',
      image_url: wm('Milk_glass.jpg'), variants: [] },
    { code: 'TELUR-AYM', name: 'Telur Ayam', category: 'Hasil Ternak', default_unit: 'kg',
      description: 'Telur ayam ras atau kampung.',
      image_url: wm('Chicken_eggs.jpg'), variants: [
      { code: 'TELUR-RAS', name: 'Telur Ayam Ras', unit: 'kg' },
      { code: 'TELUR-KPG', name: 'Telur Ayam Kampung', unit: 'kg' },
    ]},
    { code: 'TELUR-BBK', name: 'Telur Bebek', category: 'Hasil Ternak', default_unit: 'butir',
      description: 'Telur itik untuk konsumsi atau bahan asinan.',
      image_url: wm('Anas_platyrhynchos_egg.jpg'), variants: [] },
    { code: 'MADU', name: 'Madu', category: 'Hasil Ternak', default_unit: 'kg',
      description: 'Madu murni dari lebah ternak.',
      image_url: wm('Honey_comb.jpg'), variants: [] },
  ]

  const commodities: Record<string, any> = {}
  const variants: Record<string, any> = {}
  for (const def of commodityDefinitions) {
    const commodity = await prisma.commodity.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        category: def.category,
        default_unit: def.default_unit,
        description: def.description,
        image_url: def.image_url,
      },
      create: {
        code: def.code,
        name: def.name,
        category: def.category,
        default_unit: def.default_unit,
        description: def.description,
        image_url: def.image_url,
      },
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
  console.log(`✅ ${commodityDefinitions.length} commodities + variants seeded (Hasil Tani / Kebun / Ternak, dengan gambar)`)

  // 6. Farmers + Representatives
  const farmerDefinitions = [
    { farmer_number: 'PTN-001', name: 'Pak Budi Santoso', phone: '081234567001', seller_type: 'PEMILIK_LAHAN', village: 'Merah Putih', address: 'Jl. Sawah No. 1', cooperative_id: cooperative.id, reps: [
      { name: 'Andi', phone: '081234567011', relationship_type: 'PEGAWAI' },
    ]},
    { farmer_number: 'PTN-002', name: 'Bu Sari Wijaya', phone: '081234567002', seller_type: 'PEMILIK_LAHAN', village: 'Sukamaju', address: 'Jl. Kebun No. 5', cooperative_id: cooperative.id, reps: [
      { name: 'Rina', phone: '081234567012', relationship_type: 'KELUARGA' },
    ]},
    { farmer_number: 'PTN-003', name: 'Pak Joko Prasetyo', phone: '081234567003', seller_type: 'PENGGARAP', village: 'Cikembar', address: 'Jl. Ladang No. 3', cooperative_id: cooperative2.id, reps: [] },
    { farmer_number: 'PTN-004', name: 'Bu Lina Marlina', phone: '081234567004', seller_type: 'PEMILIK_LAHAN', village: 'Makmur', address: 'Jl. Tani No. 7', cooperative_id: cooperative2.id, reps: [] },
  ]

  const farmers: Record<string, any> = {}
  const reps: Record<string, any> = {}
  for (const def of farmerDefinitions) {
    // PIN demo 123456 — petani langsung aktif di aplikasi Karya Taniku
    // tanpa perlu registrasi ulang setiap kali database di-seed.
    const farmerPinHash = await bcrypt.hash('123456', 12)
    const farmer = await prisma.farmer.upsert({
      where: { farmer_number: def.farmer_number },
      update: { name: def.name, phone: def.phone, seller_type: def.seller_type, village: def.village, address: def.address, cooperative_id: def.cooperative_id, pin_hash: farmerPinHash, app_activated_at: new Date() },
      create: {
        cooperative_id: def.cooperative_id, farmer_number: def.farmer_number, name: def.name,
        phone: def.phone, seller_type: def.seller_type, verification_status: 'TERVERIFIKASI',
        village: def.village, address: def.address,
        pin_hash: farmerPinHash, app_activated_at: new Date(),
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

  // 8. QC Templates — metode pemeriksaan untuk SEMUA komoditas, per kategori.
  // Profil parameter QC:
  const QC_PROFILES: Record<string, Array<Record<string, any>>> = {
    // Sayur & umbi segar (mudah rusak)
    SAYUR: [
      { item_name: 'Warna', item_code: 'WARNA', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Normal / Cerah', 'Campuran', 'Kusam / Menyimpang'], sort_order: 1 },
      { item_name: 'Kesegaran', item_code: 'SEGAR', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Segar', 'Mulai Layu', 'Layu'], sort_order: 2 },
      { item_name: 'Ukuran', item_code: 'UKURAN', input_type: 'PILIHAN', is_required: false, requires_proof: false, options_json: ['Besar', 'Sedang', 'Kecil', 'Campuran'], sort_order: 3 },
      { item_name: 'Kerusakan', item_code: 'RUSAK', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, help_text: 'Perkiraan persentase yang busuk, memar, atau cacat.', sort_order: 4 },
      { item_name: 'Kotoran', item_code: 'KOTOR', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 5 },
      { item_name: 'Foto QC', item_code: 'FOTO', input_type: 'FOTO', is_required: true, requires_proof: true, sort_order: 6 },
      { item_name: 'Catatan', item_code: 'CATATAN', input_type: 'CATATAN', is_required: false, requires_proof: false, sort_order: 7 },
    ],
    // Biji-bijian & serealia (beras, padi, jagung, kedelai, kacang)
    BIJI: [
      { item_name: 'Kadar Air', item_code: 'AIR', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, help_text: 'Ukur dengan moisture meter bila tersedia.', sort_order: 1 },
      { item_name: 'Butir Patah / Cacat', item_code: 'PATAH', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 2 },
      { item_name: 'Kotoran / Benda Asing', item_code: 'KOTOR', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 3 },
      { item_name: 'Bau', item_code: 'BAU', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Normal', 'Apek', 'Tidak Layak'], sort_order: 4 },
      { item_name: 'Serangan Hama', item_code: 'HAMA', input_type: 'YA_TIDAK', is_required: true, requires_proof: false, help_text: 'Ada tanda kutu, ulat, atau lubang gerekan?', sort_order: 5 },
      { item_name: 'Foto QC', item_code: 'FOTO', input_type: 'FOTO', is_required: true, requires_proof: true, sort_order: 6 },
      { item_name: 'Catatan', item_code: 'CATATAN', input_type: 'CATATAN', is_required: false, requires_proof: false, sort_order: 7 },
    ],
    // Hasil kebun (kopi, kakao, buah, rempah, karet, sawit, dll.)
    KEBUN: [
      { item_name: 'Kematangan', item_code: 'MATANG', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Matang Optimal', 'Setengah Matang', 'Mentah', 'Terlalu Matang'], sort_order: 1 },
      { item_name: 'Kadar Air', item_code: 'AIR', input_type: 'PERSENTASE', is_required: false, requires_proof: false, min_value: 0, max_value: 100, help_text: 'Untuk komoditas kering (kopi, kakao, rempah).', sort_order: 2 },
      { item_name: 'Cacat / Kerusakan', item_code: 'CACAT', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 3 },
      { item_name: 'Kotoran / Benda Asing', item_code: 'KOTOR', input_type: 'PERSENTASE', is_required: true, requires_proof: false, min_value: 0, max_value: 100, sort_order: 4 },
      { item_name: 'Aroma', item_code: 'AROMA', input_type: 'PILIHAN', is_required: false, requires_proof: false, options_json: ['Normal / Khas', 'Menyimpang'], sort_order: 5 },
      { item_name: 'Foto QC', item_code: 'FOTO', input_type: 'FOTO', is_required: true, requires_proof: true, sort_order: 6 },
      { item_name: 'Catatan', item_code: 'CATATAN', input_type: 'CATATAN', is_required: false, requires_proof: false, sort_order: 7 },
    ],
    // Hasil ternak (hewan hidup, telur, susu, madu)
    TERNAK: [
      { item_name: 'Kondisi Fisik', item_code: 'FISIK', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Sehat / Baik', 'Kurang Sehat', 'Buruk'], sort_order: 1 },
      { item_name: 'Bebas Tanda Penyakit', item_code: 'SEHAT', input_type: 'YA_TIDAK', is_required: true, requires_proof: false, help_text: 'Tidak ada luka, kudis, mata sayu, atau gejala penyakit.', sort_order: 2 },
      { item_name: 'Berat Rata-rata', item_code: 'BERAT', input_type: 'ANGKA', is_required: false, requires_proof: false, min_value: 0, max_value: 2000, help_text: 'Kg per ekor / per satuan (jika relevan).', sort_order: 3 },
      { item_name: 'Kebersihan', item_code: 'BERSIH', input_type: 'PILIHAN', is_required: true, requires_proof: false, options_json: ['Bersih', 'Cukup', 'Kotor'], sort_order: 4 },
      { item_name: 'Cacat / Kerusakan', item_code: 'CACAT', input_type: 'PERSENTASE', is_required: false, requires_proof: false, min_value: 0, max_value: 100, help_text: 'Mis. telur retak, susu menggumpal.', sort_order: 5 },
      { item_name: 'Foto QC', item_code: 'FOTO', input_type: 'FOTO', is_required: true, requires_proof: true, sort_order: 6 },
      { item_name: 'Catatan', item_code: 'CATATAN', input_type: 'CATATAN', is_required: false, requires_proof: false, sort_order: 7 },
    ],
  }

  const GRAIN_CODES = new Set(['BERAS', 'PADI', 'JAGUNG', 'KEDELAI', 'KACANG-TANAH'])
  function qcProfileFor(def: { code: string; category: string }): string {
    if (def.category === 'Hasil Ternak') return 'TERNAK'
    if (def.category === 'Hasil Kebun') return 'KEBUN'
    return GRAIN_CODES.has(def.code) ? 'BIJI' : 'SAYUR'
  }

  // Template AKTIF untuk setiap komoditas di setiap koperasi.
  const templatesByCoopCommodity: Record<string, any> = {}
  let templateCount = 0
  for (const coop of [cooperative, cooperative2]) {
    for (const def of commodityDefinitions) {
      const commodity = commodities[def.code]
      const template = await prisma.qcTemplate.create({
        data: {
          cooperative_id: coop.id,
          commodity_id: commodity.id,
          name: `Template QC ${def.name}`,
          version: 1,
          valid_from: new Date('2026-01-01'),
          status: 'AKTIF',
        },
      })
      const items = QC_PROFILES[qcProfileFor(def)]
      for (const item of items) {
        await prisma.qcTemplateItem.create({ data: { qc_template_id: template.id, ...item } })
      }
      templatesByCoopCommodity[`${coop.id}:${def.code}`] = template
      templateCount++
    }
  }
  const cabaiTemplate = templatesByCoopCommodity[`${cooperative.id}:CABAI`]
  const berasTemplate = templatesByCoopCommodity[`${cooperative.id}:BERAS`]
  console.log(`✅ ${templateCount} QC templates seeded (${commodityDefinitions.length} komoditas × 2 koperasi)`)

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

  // 11. Third demo sale - Pak Joko, Kopi, waiting for QC (di KOP-002)
  const pakJoko = farmers['PTN-003']
  const existingSale3 = await prisma.farmerSale.findFirst({ where: { sale_number: 'JUAL-20260710-0003' } })
  if (!existingSale3) {
    await prisma.farmerSale.create({
      data: {
        cooperative_id: pakJoko.cooperative_id, farmer_id: pakJoko.id,
        commodity_id: commodities['KOPI'].id, commodity_variant_id: variants['KOPI-ARA'].id,
        qc_template_id: templatesByCoopCommodity[`${pakJoko.cooperative_id}:KOPI`]?.id ?? null,
        sale_number: 'JUAL-20260710-0003', batch_number: 'BATCH-KOPI-20260710-0001',
        initial_weight: 30, received_weight: 28,
        status: 'MENUNGGU_QC', notes: 'Kopi arabika dari Pak Joko',
        received_by_user_id: adminUser.id, received_at: new Date(),
      },
    })
    console.log('✅ Demo sale 3 (Pak Joko - Kopi Arabika, KOP-002, menunggu QC) seeded')
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

  // 12. Persediaan: gudang default + stok demo lewat service produksi (idempoten)
  const {
    getOrCreateDefaultWarehouse,
    receiveSaleToTransit,
    moveQcResultToStock,
  } = await import('../lib/inventory/service')

  await getOrCreateDefaultWarehouse(cooperative.id)
  await getOrCreateDefaultWarehouse(cooperative2.id)
  console.log('✅ Gudang Utama + lokasi default seeded (KOP-001, KOP-002)')

  const demoSales = await prisma.farmerSale.findMany({
    where: { sale_number: { in: ['JUAL-20260710-0001', 'JUAL-20260710-0002', 'JUAL-20260710-0003'] } },
    include: { qc_results: { where: { status: { in: ['DIKIRIM', 'DISETUJUI'] } }, take: 1 } },
  })
  for (const s of demoSales) {
    await receiveSaleToTransit(s.id)
    if (s.qc_results[0]) {
      await moveQcResultToStock(s.qc_results[0].id)
    }
  }
  console.log('✅ Stok demo seeded (transit + hasil QC per grade)')

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
