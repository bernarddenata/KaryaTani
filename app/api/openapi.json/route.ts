import { NextResponse } from 'next/server'

// TODO: Protect this endpoint in production (e.g., require auth or restrict by environment)
export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Karya Tani Center API',
      version: '0.1.0',
      description:
        'API untuk platform koperasi pertanian Karya Tani Center. Mengelola data koperasi, petani, komoditas, penjualan hasil tani, quality control, dompet petani, dan pembayaran.',
    },
    servers: [{ url: '/api', description: 'API Server' }],
    tags: [
      { name: 'Health', description: 'Status kesehatan aplikasi' },
      { name: 'Auth', description: 'Autentikasi dan otorisasi' },
      { name: 'Users', description: 'Manajemen pengguna' },
      { name: 'Roles', description: 'Manajemen peran' },
      { name: 'Permissions', description: 'Manajemen hak akses' },
      { name: 'Cooperatives', description: 'Manajemen koperasi' },
      { name: 'Farmers', description: 'Manajemen petani' },
      { name: 'Farmer Representatives', description: 'Manajemen perwakilan petani' },
      { name: 'Commodities', description: 'Manajemen komoditas' },
      { name: 'Commodity Variants', description: 'Manajemen varian komoditas' },
      { name: 'Price Lists', description: 'Manajemen daftar harga' },
      { name: 'Farmer Sales', description: 'Manajemen penjualan hasil tani' },
      { name: 'Batch', description: 'Informasi batch penjualan' },
      { name: 'QC Templates', description: 'Manajemen template quality control' },
      { name: 'QC', description: 'Proses quality control penjualan' },
      { name: 'QC Results', description: 'Hasil quality control' },
      { name: 'Wallets', description: 'Manajemen dompet petani' },
      { name: 'Payouts', description: 'Manajemen pembayaran ke petani' },
      { name: 'Disputes', description: 'Manajemen keberatan petani' },
      { name: 'Reports', description: 'Laporan dan ringkasan data' },
      { name: 'Files', description: 'Upload dan manajemen file' },
      { name: 'Audit Logs', description: 'Log aktivitas sistem' },
      { name: 'Mobile Farmer / Karya Taniku', description: 'API aplikasi mobile petani (Karya Taniku). Semua endpoint hanya dapat diakses oleh petani yang login dan hanya mengembalikan data milik petani sendiri.' },
      { name: 'Mobile QC / TaniTrust QC', description: 'API untuk aplikasi mobile petugas QC (TaniTrust Mobile QC). Endpoint dapat berupa endpoint baru khusus mobile QC atau endpoint dashboard yang direuse dengan permission QC_OFFICER.' },
    ],

    paths: {
      // ==================== Health ====================
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Cek status kesehatan API',
          description: 'Endpoint publik untuk mengecek apakah API berjalan normal.',
          responses: {
            '200': {
              description: 'API berjalan normal',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              status: { type: 'string', example: 'ok' },
                              app: { type: 'string', example: 'Karya Tani Center' },
                              version: { type: 'string', example: '0.1.0' },
                              timestamp: { type: 'string', format: 'date-time' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },

      // ==================== Auth ====================
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Masuk ke sistem',
          description: 'Autentikasi pengguna admin/QC officer dengan email atau nomor HP dan kata sandi. Mengembalikan access token JWT (valid 24 jam) dan refresh token (valid 30 hari).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'qc@karyatani.local', description: 'Email admin/QC officer. Salah satu dari email atau identifier wajib diisi.' },
                    identifier: { type: 'string', example: '081234567890', description: 'Email atau nomor HP. Alternatif dari field email.' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login berhasil',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              access_token: { type: 'string', description: 'JWT access token, valid 24 jam.' },
                              refresh_token: { type: 'string', description: 'JWT refresh token, valid 30 hari.' },
                              token: { type: 'string', description: 'Alias untuk access_token (backward compatibility).' },
                              user: { $ref: '#/components/schemas/User' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Email atau kata sandi salah',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Keluar dari sistem',
          description: 'Menghapus cookie token autentikasi.',
          responses: {
            '200': {
              description: 'Berhasil keluar',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              message: { type: 'string', example: 'Berhasil keluar dari sistem.' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Perbarui access token',
          description: 'Menukarkan refresh token yang masih valid dengan pasangan access token dan refresh token baru. Endpoint ini tidak memerlukan bearer token pada header — refresh token dikirim melalui request body.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refresh_token'],
                  properties: {
                    refresh_token: { type: 'string', description: 'Refresh token JWT yang didapat dari endpoint login.' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token baru berhasil diterbitkan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              access_token: { type: 'string', description: 'JWT access token baru, valid 24 jam.' },
                              refresh_token: { type: 'string', description: 'JWT refresh token baru, valid 30 hari.' },
                              token: { type: 'string', description: 'Alias untuk access_token (backward compatibility).' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Refresh token tidak valid atau sudah kadaluarsa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token tidak valid atau sudah kadaluarsa.' },
                  },
                },
              },
            },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Profil pengguna saat ini',
          description: 'Mengembalikan data pengguna yang sedang login beserta peran dan hak aksesnya.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Data pengguna',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', format: 'uuid' },
                              email: { type: 'string', format: 'email' },
                              name: { type: 'string' },
                              status: { type: 'string' },
                              roles: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    code: { type: 'string' },
                                    name: { type: 'string' },
                                  },
                                },
                              },
                              permissions: {
                                type: 'array',
                                items: { type: 'string' },
                                example: ['dashboard.view', 'farmers.view', 'farmers.create'],
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Belum login',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // ==================== Users ====================
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Daftar pengguna',
          description: 'Mengembalikan daftar pengguna dengan paginasi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar pengguna',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/User' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Detail pengguna',
          description: 'Mengembalikan detail pengguna berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID pengguna',
            },
          ],
          responses: {
            '200': {
              description: 'Detail pengguna',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/User' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ==================== Roles ====================
      '/roles': {
        get: {
          tags: ['Roles'],
          summary: 'Daftar peran',
          description: 'Mengembalikan semua peran beserta hak akses masing-masing.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Daftar peran',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Role' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ==================== Permissions ====================
      '/permissions': {
        get: {
          tags: ['Permissions'],
          summary: 'Daftar hak akses',
          description: 'Mengembalikan semua hak akses yang tersedia, dikelompokkan berdasarkan modul.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Hak akses dikelompokkan per modul',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            additionalProperties: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Permission' },
                            },
                            example: {
                              dashboard: [
                                { id: '...', code: 'dashboard.view', name: 'Lihat Dashboard', module: 'dashboard' },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ==================== Cooperatives ====================
      '/cooperatives': {
        get: {
          tags: ['Cooperatives'],
          summary: 'Daftar koperasi',
          description: 'Mengembalikan semua data koperasi.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Daftar koperasi',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Cooperative' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Cooperatives'],
          summary: 'Tambah koperasi baru',
          description: 'Membuat data koperasi baru.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCooperativeInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Koperasi berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Cooperative' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/cooperatives/{id}': {
        get: {
          tags: ['Cooperatives'],
          summary: 'Detail koperasi',
          description: 'Mengembalikan detail koperasi berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID koperasi',
            },
          ],
          responses: {
            '200': {
              description: 'Detail koperasi',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Cooperative' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Cooperatives'],
          summary: 'Ubah data koperasi',
          description: 'Memperbarui data koperasi berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID koperasi',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    province: { type: 'string' },
                    city: { type: 'string' },
                    district: { type: 'string' },
                    village: { type: 'string' },
                    address: { type: 'string' },
                    legal_number: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Koperasi berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Cooperative' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // ==================== Farmers ====================
      '/farmers': {
        get: {
          tags: ['Farmers'],
          summary: 'Daftar petani',
          description: 'Mengembalikan daftar petani beserta info koperasi. Mendukung pencarian dan berbagai filter. Response berisi field tambahan seperti member_number (alias farmer_number), main_commodity (nama komoditas utama dari FarmerSource pertama), dan farm_location.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Cari berdasarkan nama, telepon, nomor anggota, atau desa.',
            },
            {
              name: 'phone',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter exact nomor telepon.',
            },
            {
              name: 'member_number',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter exact nomor petani (juga menerima parameter farmer_number).',
            },
            {
              name: 'village',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter contains nama desa.',
            },
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan koperasi.',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter petani yang punya farmer_source dengan komoditas ini.',
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
              description: 'Filter status petani.',
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1, minimum: 1 },
              description: 'Nomor halaman.',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
              description: 'Jumlah data per halaman.',
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', minimum: 0 },
              description: 'Alternatif untuk page — jumlah data yang dilewati.',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar petani. Setiap item termasuk field tambahan: member_number (alias farmer_number), main_commodity (nama komoditas utama dari FarmerSource primary), dan farm_location.',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Farmer' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Farmers'],
          summary: 'Tambah petani baru',
          description: 'Membuat data petani baru. Endpoint menerima dua bentuk request body: (1) full-create body sesuai skema CreateFarmerInput (mencakup cooperative_id, farmer_number, name, phone, seller_type wajib), atau (2) quick-create body yang hanya wajib nama dan telepon — cocok untuk mobile QC yang perlu menambah petani baru saat check-in.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/CreateFarmerInput' },
                    {
                      type: 'object',
                      required: ['name', 'phone'],
                      description: 'Quick-create body: cocok untuk mobile QC. Sistem otomatis generate farmer_number dan menggunakan koperasi aktif pertama jika cooperative_id tidak diisi.',
                      properties: {
                        name: { type: 'string' },
                        phone: { type: 'string', minLength: 8 },
                        village: { type: 'string' },
                        address: { type: 'string' },
                        nik: { type: 'string' },
                        main_commodity: { type: 'string', description: 'Nama atau kode komoditas utama. Sistem akan mencari komoditas yang cocok.' },
                        cooperative_id: { type: 'string', format: 'uuid', description: 'Opsional — jika tidak diisi, koperasi aktif pertama digunakan.' },
                        seller_type: {
                          type: 'string',
                          enum: ['PEMILIK_LAHAN', 'PENGGARAP', 'PENYEWA_LAHAN', 'KELOMPOK_TANI', 'BADAN_USAHA', 'PENGEPUL_TERVERIFIKASI', 'LAINNYA'],
                          default: 'PEMILIK_LAHAN',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Petani berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Farmer' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '409': {
              description: 'Nomor telepon petani sudah terdaftar',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'CONFLICT', message: 'Nomor telepon petani sudah terdaftar.' },
                  },
                },
              },
            },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmers/{id}': {
        get: {
          tags: ['Farmers'],
          summary: 'Detail petani',
          description: 'Mengembalikan detail petani beserta info koperasi dan perwakilan.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID petani',
            },
          ],
          responses: {
            '200': {
              description: 'Detail petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Farmer' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Farmers'],
          summary: 'Ubah data petani',
          description: 'Memperbarui data petani berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID petani',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    nik: { type: 'string' },
                    address: { type: 'string' },
                    village: { type: 'string' },
                    seller_type: {
                      type: 'string',
                      enum: ['PEMILIK_LAHAN', 'PENGGARAP', 'PENYEWA_LAHAN', 'KELOMPOK_TANI', 'BADAN_USAHA', 'PENGEPUL_TERVERIFIKASI', 'LAINNYA'],
                    },
                    verification_status: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Petani berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Farmer' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmers/{id}/qc-history': {
        get: {
          tags: ['Farmers'],
          summary: 'Riwayat QC petani',
          description: 'Mengembalikan riwayat hasil quality control untuk petani tertentu. Maksimal 50 data terbaru.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID petani',
            },
          ],
          responses: {
            '200': {
              description: 'Riwayat QC petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/QcResult' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/farmers/{id}/representatives': {
        get: {
          tags: ['Farmers'],
          summary: 'Daftar perwakilan petani',
          description: 'Mengembalikan semua perwakilan untuk petani tertentu.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID petani',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar perwakilan petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerRepresentative' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/farmers/{id}/sales': {
        get: {
          tags: ['Farmers'],
          summary: 'Daftar penjualan petani',
          description: 'Mengembalikan riwayat penjualan petani tertentu. Maksimal 50 data terbaru.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID petani',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar penjualan petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerSale' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/farmers/{id}/wallet': {
        get: {
          tags: ['Farmers'],
          summary: 'Dompet petani',
          description: 'Mengembalikan data dompet petani tertentu beserta info koperasi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID petani',
            },
          ],
          responses: {
            '200': {
              description: 'Data dompet petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerWallet' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ==================== Farmer Representatives ====================
      '/farmer-representatives': {
        get: {
          tags: ['Farmer Representatives'],
          summary: 'Daftar perwakilan petani',
          description: 'Mengembalikan semua data perwakilan petani beserta info petani.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Daftar perwakilan petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerRepresentative' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Farmer Representatives'],
          summary: 'Tambah perwakilan petani',
          description: 'Membuat data perwakilan petani baru.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['farmer_id', 'name', 'relationship_type'],
                  properties: {
                    farmer_id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Ahmad Supardi' },
                    phone: { type: 'string', example: '081234567890' },
                    relationship_type: {
                      type: 'string',
                      enum: ['PEGAWAI', 'KELUARGA', 'SOPIR', 'BURUH_TANI', 'KETUA_KELOMPOK', 'KUASA', 'LAINNYA'],
                    },
                    identity_number: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Perwakilan berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerRepresentative' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmer-representatives/{id}': {
        get: {
          tags: ['Farmer Representatives'],
          summary: 'Detail perwakilan petani',
          description: 'Mengembalikan detail perwakilan petani berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID perwakilan',
            },
          ],
          responses: {
            '200': {
              description: 'Detail perwakilan petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerRepresentative' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Farmer Representatives'],
          summary: 'Ubah data perwakilan',
          description: 'Memperbarui data perwakilan petani berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID perwakilan',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    relationship_type: {
                      type: 'string',
                      enum: ['PEGAWAI', 'KELUARGA', 'SOPIR', 'BURUH_TANI', 'KETUA_KELOMPOK', 'KUASA', 'LAINNYA'],
                    },
                    identity_number: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Perwakilan berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerRepresentative' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // ==================== Commodities ====================
      '/commodities': {
        get: {
          tags: ['Commodities'],
          summary: 'Daftar komoditas',
          description: 'Mengembalikan daftar komoditas beserta varian.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Daftar komoditas',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Commodity' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Commodities'],
          summary: 'Tambah komoditas baru',
          description: 'Membuat data komoditas baru.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCommodityInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Komoditas berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Commodity' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/commodities/{id}': {
        get: {
          tags: ['Commodities'],
          summary: 'Detail komoditas',
          description: 'Mengembalikan detail komoditas beserta varian.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID komoditas',
            },
          ],
          responses: {
            '200': {
              description: 'Detail komoditas',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Commodity' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Commodities'],
          summary: 'Ubah data komoditas',
          description: 'Memperbarui data komoditas berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID komoditas',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    category: { type: 'string' },
                    default_unit: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Komoditas berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Commodity' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/commodities/{id}/grades': {
        get: {
          tags: ['Commodities', 'Mobile QC / TaniTrust QC'],
          summary: 'Daftar grade komoditas',
          description: 'Mengembalikan daftar grade (dari PriceListItem) untuk komoditas tertentu, diambil dari price list yang aktif. Endpoint ini dipakai oleh aplikasi mobile QC untuk menampilkan opsi grade saat pencatatan hasil QC. Membutuhkan permission price_lists.view.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID komoditas.',
            },
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Opsional — jika tidak diisi, koperasi aktif dari sesi digunakan.',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar grade beserta harga per unit.',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              commodity: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  code: { type: 'string' },
                                  name: { type: 'string' },
                                  default_unit: { type: 'string' },
                                },
                              },
                              price_list: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  name: { type: 'string' },
                                  valid_from: { type: 'string', format: 'date' },
                                  valid_until: { type: 'string', format: 'date', nullable: true },
                                  cooperative: {
                                    type: 'object',
                                    properties: {
                                      id: { type: 'string', format: 'uuid' },
                                      code: { type: 'string' },
                                      name: { type: 'string' },
                                    },
                                  },
                                },
                              },
                              grades: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    grade_name: { type: 'string', example: 'Grade A' },
                                    grade_code: { type: 'string', example: 'A' },
                                    price_per_unit: { type: 'number', example: 3200 },
                                    unit: { type: 'string', example: 'kg' },
                                    is_reject: { type: 'boolean', example: false },
                                    sort_order: { type: 'integer', example: 0 },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ==================== Commodity Variants ====================
      '/commodity-variants': {
        post: {
          tags: ['Commodity Variants'],
          summary: 'Tambah varian komoditas',
          description: 'Membuat varian baru untuk komoditas.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['commodity_id', 'code', 'name', 'unit'],
                  properties: {
                    commodity_id: { type: 'string', format: 'uuid' },
                    code: { type: 'string', example: 'KMD-001-TBS' },
                    name: { type: 'string', example: 'Tandan Buah Segar' },
                    unit: { type: 'string', example: 'kg' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Varian komoditas berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/CommodityVariant' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/commodity-variants/{id}': {
        get: {
          tags: ['Commodity Variants'],
          summary: 'Detail varian komoditas',
          description: 'Mengembalikan detail varian komoditas berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID varian komoditas',
            },
          ],
          responses: {
            '200': {
              description: 'Detail varian komoditas',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/CommodityVariant' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Commodity Variants'],
          summary: 'Ubah varian komoditas',
          description: 'Memperbarui data varian komoditas berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID varian komoditas',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    unit: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Varian berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/CommodityVariant' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // ==================== Price Lists ====================
      '/price-lists': {
        get: {
          tags: ['Price Lists'],
          summary: 'Daftar harga',
          description: 'Mengembalikan daftar harga dengan paginasi beserta jumlah item.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar harga',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              allOf: [
                                { $ref: '#/components/schemas/PriceList' },
                                {
                                  type: 'object',
                                  properties: {
                                    _count: {
                                      type: 'object',
                                      properties: {
                                        items: { type: 'integer' },
                                      },
                                    },
                                  },
                                },
                              ],
                            },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Price Lists'],
          summary: 'Tambah daftar harga',
          description: 'Membuat daftar harga baru.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['cooperative_id', 'name', 'valid_from'],
                  properties: {
                    cooperative_id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Harga Sawit Juli 2026' },
                    valid_from: { type: 'string', format: 'date-time' },
                    valid_until: { type: 'string', format: 'date-time' },
                    status: {
                      type: 'string',
                      enum: ['DRAFT', 'AKTIF', 'NONAKTIF', 'KEDALUWARSA'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Daftar harga berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/PriceList' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/price-lists/{id}': {
        get: {
          tags: ['Price Lists'],
          summary: 'Detail daftar harga',
          description: 'Mengembalikan detail daftar harga beserta semua item harga.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID daftar harga',
            },
          ],
          responses: {
            '200': {
              description: 'Detail daftar harga',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/PriceList' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Price Lists'],
          summary: 'Ubah daftar harga',
          description: 'Memperbarui data daftar harga berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID daftar harga',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    valid_from: { type: 'string', format: 'date-time' },
                    valid_until: { type: 'string', format: 'date-time' },
                    status: {
                      type: 'string',
                      enum: ['DRAFT', 'AKTIF', 'NONAKTIF', 'KEDALUWARSA'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Daftar harga berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/PriceList' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/price-lists/{id}/items': {
        get: {
          tags: ['Price Lists'],
          summary: 'Daftar item harga',
          description: 'Mengembalikan semua item dalam daftar harga tertentu.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID daftar harga',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar item harga',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/PriceListItem' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        post: {
          tags: ['Price Lists'],
          summary: 'Tambah item harga',
          description: 'Menambahkan item baru ke daftar harga.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID daftar harga',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['commodity_id', 'grade_name', 'grade_code', 'price_per_unit', 'unit'],
                  properties: {
                    commodity_id: { type: 'string', format: 'uuid' },
                    commodity_variant_id: { type: 'string', format: 'uuid' },
                    grade_name: { type: 'string', example: 'Grade A' },
                    grade_code: { type: 'string', example: 'A' },
                    price_per_unit: { type: 'number', minimum: 0, example: 2500 },
                    unit: { type: 'string', example: 'kg' },
                    is_reject: { type: 'boolean', default: false },
                    sort_order: { type: 'integer', default: 0 },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Item harga berhasil ditambahkan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/PriceListItem' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/price-lists/active': {
        get: {
          tags: ['Price Lists'],
          summary: 'Daftar harga aktif',
          description: 'Mengembalikan daftar harga yang sedang aktif (status AKTIF, dalam rentang tanggal berlaku) beserta item-itemnya.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan koperasi',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan komoditas',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar harga aktif beserta item',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/PriceList' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/price-list-items/{id}': {
        patch: {
          tags: ['Price Lists'],
          summary: 'Ubah item harga',
          description: 'Memperbarui item harga berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID item harga',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    grade_name: { type: 'string' },
                    grade_code: { type: 'string' },
                    price_per_unit: { type: 'number', minimum: 0 },
                    unit: { type: 'string' },
                    is_reject: { type: 'boolean' },
                    sort_order: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Item harga berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/PriceListItem' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Price Lists'],
          summary: 'Hapus item harga',
          description: 'Menghapus item harga berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID item harga',
            },
          ],
          responses: {
            '200': {
              description: 'Item harga berhasil dihapus',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              message: { type: 'string', example: 'Item harga berhasil dihapus.' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ==================== Farmer Sales ====================
      '/farmer-sales': {
        get: {
          tags: ['Farmer Sales'],
          summary: 'Daftar penjualan',
          description: 'Mengembalikan daftar penjualan hasil tani dengan paginasi dan filter.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter status penjualan',
            },
            {
              name: 'farmer_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan petani',
            },
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan koperasi',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan komoditas',
            },
            {
              name: 'date_from',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal mulai',
            },
            {
              name: 'date_to',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal akhir',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Cari berdasarkan nomor penjualan atau batch',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar penjualan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerSale' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Farmer Sales'],
          summary: 'Tambah penjualan baru',
          description: 'Membuat data penjualan hasil tani baru. Nomor penjualan dan batch akan di-generate otomatis.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateFarmerSaleInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Penjualan berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerSale' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmer-sales/{id}': {
        get: {
          tags: ['Farmer Sales'],
          summary: 'Detail penjualan',
          description: 'Mengembalikan detail penjualan beserta data petani, komoditas, foto, hasil QC, dan keberatan.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          responses: {
            '200': {
              description: 'Detail penjualan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerSale' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Farmer Sales'],
          summary: 'Ubah data penjualan',
          description: 'Memperbarui data penjualan berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    representative_id: { type: 'string', format: 'uuid' },
                    commodity_variant_id: { type: 'string', format: 'uuid' },
                    price_list_id: { type: 'string', format: 'uuid' },
                    qc_template_id: { type: 'string', format: 'uuid' },
                    initial_weight: { type: 'number', minimum: 0 },
                    received_weight: { type: 'number', minimum: 0 },
                    notes: { type: 'string' },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Penjualan berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerSale' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmer-sales/{id}/calculate-price': {
        post: {
          tags: ['Farmer Sales'],
          summary: 'Hitung harga penjualan',
          description:
            'Menghitung total harga penjualan berdasarkan hasil QC (grade breakdown) dan daftar harga yang berlaku. Memperbarui status penjualan menjadi HARGA_DIHITUNG dan menambahkan saldo ke dompet petani.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          responses: {
            '200': {
              description: 'Harga berhasil dihitung',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              sale_id: { type: 'string', format: 'uuid' },
                              total_amount: { type: 'number', example: 1250000 },
                              breakdown: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    grade_name: { type: 'string', example: 'Grade A' },
                                    grade_code: { type: 'string', example: 'A' },
                                    weight: { type: 'number', example: 500 },
                                    price_per_unit: { type: 'number', example: 2500 },
                                    estimated_amount: { type: 'number', example: 1250000 },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Status penjualan tidak sesuai atau data QC belum ada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmer-sales/{id}/cancel': {
        post: {
          tags: ['Farmer Sales'],
          summary: 'Batalkan penjualan',
          description: 'Membatalkan penjualan. Tidak dapat dibatalkan jika status sudah DIBAYAR atau DIBATALKAN.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          responses: {
            '200': {
              description: 'Penjualan berhasil dibatalkan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerSale' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Penjualan tidak dapat dibatalkan (status DIBAYAR atau sudah DIBATALKAN)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmer-sales/{id}/photos': {
        get: {
          tags: ['Farmer Sales'],
          summary: 'Daftar foto penjualan',
          description: 'Mengembalikan semua foto yang terkait dengan penjualan.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar foto penjualan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', format: 'uuid' },
                                farmer_sale_id: { type: 'string', format: 'uuid' },
                                file_id: { type: 'string', format: 'uuid' },
                                photo_type: {
                                  type: 'string',
                                  enum: ['FOTO_PENERIMAAN', 'FOTO_QC', 'FOTO_KEBERATAN'],
                                },
                                file: { $ref: '#/components/schemas/FileUpload' },
                                uploaded_by: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    name: { type: 'string' },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        post: {
          tags: ['Farmer Sales'],
          summary: 'Tambah foto penjualan',
          description: 'Menambahkan foto ke penjualan. File harus diupload terlebih dahulu via endpoint /files/upload.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['file_id', 'photo_type'],
                  properties: {
                    file_id: { type: 'string', format: 'uuid' },
                    photo_type: {
                      type: 'string',
                      enum: ['FOTO_PENERIMAAN', 'FOTO_QC', 'FOTO_KEBERATAN'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Foto berhasil ditambahkan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', format: 'uuid' },
                              farmer_sale_id: { type: 'string', format: 'uuid' },
                              file_id: { type: 'string', format: 'uuid' },
                              photo_type: { type: 'string' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmer-sales/{id}/timeline': {
        get: {
          tags: ['Farmer Sales'],
          summary: 'Timeline penjualan',
          description: 'Mengembalikan log aktivitas (audit trail) untuk penjualan tertentu.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          responses: {
            '200': {
              description: 'Timeline penjualan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AuditLog' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ==================== Batch ====================
      '/batch/{batchNumber}': {
        get: {
          tags: ['Batch'],
          summary: 'Detail batch',
          description:
            'Mengembalikan informasi lengkap batch penjualan berdasarkan nomor batch, termasuk data penjualan, mutasi dompet, pembayaran, dan log audit.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'batchNumber',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nomor batch (contoh: BATCH-KMD001-20260710-0001)',
            },
          ],
          responses: {
            '200': {
              description: 'Detail batch',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              sale: { $ref: '#/components/schemas/FarmerSale' },
                              walletMutations: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/FarmerWalletMutation' },
                              },
                              payouts: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/FarmerPayout' },
                              },
                              auditLogs: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/AuditLog' },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/batch/{batchNumber}/timeline': {
        get: {
          tags: ['Batch'],
          summary: 'Timeline batch',
          description: 'Mengembalikan log aktivitas (audit trail) untuk batch penjualan berdasarkan nomor batch.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'batchNumber',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nomor batch',
            },
          ],
          responses: {
            '200': {
              description: 'Timeline batch',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AuditLog' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/traceability': {
        get: {
          tags: ['Batch', 'Mobile QC / TaniTrust QC'],
          summary: 'Daftar traceability batch',
          description: 'Mengembalikan daftar batch penjualan untuk penelusuran (traceability). Mendukung pencarian bebas dan filter — dipakai oleh aplikasi mobile QC untuk mencari batch berdasarkan nomor batch, nomor penjualan, nama petani, atau komoditas.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Pencarian bebas pada batch_number, submission_number, atau nama petani.',
            },
            {
              name: 'batch_number',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter berdasarkan nomor batch.',
            },
            {
              name: 'submission_number',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter berdasarkan nomor penjualan/submission.',
            },
            {
              name: 'farmer_name',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter berdasarkan nama petani.',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan komoditas.',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
              description: 'Jumlah data yang dikembalikan.',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar batch untuk traceability.',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', format: 'uuid' },
                                submission_number: { type: 'string' },
                                batch_number: { type: 'string' },
                                farmer_name: { type: 'string' },
                                farmer_number: { type: 'string' },
                                commodity_name: { type: 'string' },
                                received_weight: { type: 'number', nullable: true },
                                status: { type: 'string' },
                                status_label: { type: 'string' },
                                created_at: { type: 'string', format: 'date-time' },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/traceability/{batchNumber}': {
        get: {
          tags: ['Batch', 'Mobile QC / TaniTrust QC'],
          summary: 'Detail traceability batch',
          description: 'Mengembalikan detail lengkap traceability untuk satu batch: data penjualan, petani, komoditas, koperasi, hasil QC, estimasi pembayaran, foto bukti, sengketa terkait, dan timeline status.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'batchNumber',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nomor batch (contoh: BATCH-KMD001-20260710-0001).',
            },
          ],
          responses: {
            '200': {
              description: 'Detail traceability batch.',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              batch_number: { type: 'string' },
                              current_status: { type: 'string' },
                              current_status_label: { type: 'string' },
                              submission: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  submission_number: { type: 'string' },
                                  batch_number: { type: 'string' },
                                  initial_weight: { type: 'number', nullable: true },
                                  received_weight: { type: 'number', nullable: true },
                                  received_at: { type: 'string', format: 'date-time', nullable: true },
                                  created_at: { type: 'string', format: 'date-time' },
                                  status: { type: 'string' },
                                  status_label: { type: 'string' },
                                  notes: { type: 'string', nullable: true },
                                },
                              },
                              farmer: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  name: { type: 'string' },
                                  farmer_number: { type: 'string' },
                                  phone: { type: 'string' },
                                  village: { type: 'string', nullable: true },
                                },
                              },
                              commodity: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  code: { type: 'string' },
                                  name: { type: 'string' },
                                  default_unit: { type: 'string' },
                                },
                              },
                              commodity_variant: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  name: { type: 'string' },
                                },
                              },
                              cooperative: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  code: { type: 'string' },
                                  name: { type: 'string' },
                                },
                              },
                              qc_result: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                  qc_result_id: { type: 'string', format: 'uuid' },
                                  qc_officer: { type: 'string' },
                                  submitted_at: { type: 'string', format: 'date-time', nullable: true },
                                  final_grade_code: { type: 'string', nullable: true },
                                  total_weight_checked: { type: 'number', nullable: true },
                                  final_accepted_weight: { type: 'number', nullable: true },
                                  total_rejected_weight: { type: 'number', nullable: true },
                                  grade_breakdown: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      properties: {
                                        grade_code: { type: 'string' },
                                        grade_name: { type: 'string' },
                                        weight: { type: 'number' },
                                        price_per_unit: { type: 'number', nullable: true },
                                        estimated_amount: { type: 'number', nullable: true },
                                      },
                                    },
                                  },
                                },
                              },
                              payment_estimation: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                  total_estimated_amount: { type: 'number' },
                                  payment_status: { type: 'string' },
                                  payment_status_label: { type: 'string' },
                                  calculated_at: { type: 'string', format: 'date-time' },
                                },
                              },
                              photos: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    url: { type: 'string' },
                                    file_name: { type: 'string' },
                                    type: { type: 'string' },
                                  },
                                },
                              },
                              disputes: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    dispute_number: { type: 'string' },
                                    status: { type: 'string' },
                                    status_label: { type: 'string' },
                                    created_at: { type: 'string', format: 'date-time' },
                                    resolved_at: { type: 'string', format: 'date-time', nullable: true },
                                  },
                                },
                              },
                              timeline: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    status: { type: 'string' },
                                    label: { type: 'string' },
                                    timestamp: { type: 'string', format: 'date-time' },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ==================== QC Templates ====================
      '/qc-templates': {
        get: {
          tags: ['QC Templates'],
          summary: 'Daftar template QC',
          description: 'Mengembalikan daftar template quality control dengan paginasi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan koperasi',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan komoditas',
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['DRAFT', 'AKTIF', 'NONAKTIF', 'ARSIP'] },
              description: 'Filter status template',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar template QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/QcTemplate' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['QC Templates'],
          summary: 'Tambah template QC',
          description: 'Membuat template quality control baru.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['cooperative_id', 'commodity_id', 'name', 'valid_from'],
                  properties: {
                    cooperative_id: { type: 'string', format: 'uuid' },
                    commodity_id: { type: 'string', format: 'uuid' },
                    commodity_variant_id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'QC Sawit Standar v1' },
                    version: { type: 'integer', minimum: 1, default: 1 },
                    valid_from: { type: 'string', format: 'date-time' },
                    valid_until: { type: 'string', format: 'date-time' },
                    status: {
                      type: 'string',
                      enum: ['DRAFT', 'AKTIF', 'NONAKTIF', 'ARSIP'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Template QC berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcTemplate' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/qc-templates/{id}': {
        get: {
          tags: ['QC Templates'],
          summary: 'Detail template QC',
          description: 'Mengembalikan detail template QC beserta semua item pemeriksaan.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID template QC',
            },
          ],
          responses: {
            '200': {
              description: 'Detail template QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcTemplate' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['QC Templates'],
          summary: 'Ubah template QC',
          description: 'Memperbarui data template QC berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID template QC',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    version: { type: 'integer', minimum: 1 },
                    valid_from: { type: 'string', format: 'date-time' },
                    valid_until: { type: 'string', format: 'date-time' },
                    status: {
                      type: 'string',
                      enum: ['DRAFT', 'AKTIF', 'NONAKTIF', 'ARSIP'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Template QC berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcTemplate' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/qc-templates/{id}/items': {
        get: {
          tags: ['QC Templates'],
          summary: 'Daftar item template QC',
          description: 'Mengembalikan semua item pemeriksaan dalam template QC.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID template QC',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar item template QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/QcTemplateItem' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        post: {
          tags: ['QC Templates'],
          summary: 'Tambah item template QC',
          description: 'Menambahkan item pemeriksaan baru ke template QC.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID template QC',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['item_name', 'item_code', 'input_type'],
                  properties: {
                    item_name: { type: 'string', example: 'Kadar Air' },
                    item_code: { type: 'string', example: 'KADAR_AIR' },
                    input_type: {
                      type: 'string',
                      enum: ['ANGKA', 'PERSENTASE', 'PILIHAN', 'CHECKLIST', 'YA_TIDAK', 'FOTO', 'CATATAN'],
                    },
                    is_required: { type: 'boolean', default: true },
                    requires_proof: { type: 'boolean', default: false },
                    options_json: {
                      type: 'object',
                      nullable: true,
                      description: 'Opsi pilihan dalam format JSON (untuk input_type PILIHAN)',
                    },
                    min_value: { type: 'number', nullable: true },
                    max_value: { type: 'number', nullable: true },
                    help_text: { type: 'string' },
                    sort_order: { type: 'integer', default: 0 },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Item template QC berhasil ditambahkan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcTemplateItem' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/qc-templates/active': {
        get: {
          tags: ['QC Templates'],
          summary: 'Template QC aktif',
          description:
            'Mengembalikan template QC yang sedang aktif berdasarkan koperasi dan komoditas, beserta item-itemnya.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'ID koperasi',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'ID komoditas',
            },
          ],
          responses: {
            '200': {
              description: 'Template QC aktif beserta item',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcTemplate' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/qc-template-items/{id}': {
        patch: {
          tags: ['QC Templates'],
          summary: 'Ubah item template QC',
          description: 'Memperbarui item pemeriksaan template QC berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID item template QC',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    item_name: { type: 'string' },
                    item_code: { type: 'string' },
                    input_type: {
                      type: 'string',
                      enum: ['ANGKA', 'PERSENTASE', 'PILIHAN', 'CHECKLIST', 'YA_TIDAK', 'FOTO', 'CATATAN'],
                    },
                    is_required: { type: 'boolean' },
                    requires_proof: { type: 'boolean' },
                    options_json: { type: 'object', nullable: true },
                    min_value: { type: 'number', nullable: true },
                    max_value: { type: 'number', nullable: true },
                    help_text: { type: 'string' },
                    sort_order: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Item berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcTemplateItem' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['QC Templates'],
          summary: 'Hapus item template QC',
          description: 'Menghapus item pemeriksaan template QC berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID item template QC',
            },
          ],
          responses: {
            '200': {
              description: 'Item berhasil dihapus',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              message: { type: 'string', example: 'Item template QC berhasil dihapus.' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ==================== QC Process ====================
      '/qc/pending': {
        get: {
          tags: ['QC'],
          summary: 'Penjualan menunggu QC',
          description:
            'Mengembalikan daftar penjualan yang menunggu proses QC (status DITERIMA_KOPERASI atau MENUNGGU_QC).',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar penjualan menunggu QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerSale' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/qc/{saleId}/start': {
        post: {
          tags: ['QC'],
          summary: 'Mulai proses QC',
          description:
            'Memulai proses quality control untuk penjualan. Membuat draft QcResult dan mengubah status penjualan menjadi QC_DIPROSES. Mengembalikan template QC beserta item pemeriksaan.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'saleId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          responses: {
            '201': {
              description: 'Proses QC dimulai',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcResult' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Status penjualan tidak sesuai atau template QC belum ditentukan',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/qc/{saleId}/draft': {
        post: {
          tags: ['QC', 'Mobile QC / TaniTrust QC'],
          summary: 'Simpan draft QC',
          description: 'Menyimpan draft hasil QC untuk penjualan tertentu. Endpoint ini idempotent — setiap pemanggilan akan mengganti state draft sebelumnya. Semua field opsional; petugas QC dapat menyimpan progres bertahap dari aplikasi mobile. Endpoint /qc/{saleId}/start wajib dipanggil terlebih dahulu untuk membuat draft.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'saleId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan.',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    parameter_values: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          qc_template_item_id: { type: 'string', format: 'uuid' },
                          parameter_id: { type: 'string', format: 'uuid', description: 'Alias untuk qc_template_item_id.' },
                          value_text: { type: 'string' },
                          value_number: { type: 'number' },
                          value_json: { type: 'object' },
                          notes: { type: 'string' },
                          proof_file_id: { type: 'string', format: 'uuid' },
                        },
                      },
                    },
                    grade_breakdowns: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          grade_id: { type: 'string', description: 'PriceListItem id — jika diisi, harga akan diambil dari price list.' },
                          grade_code: { type: 'string' },
                          grade_name: { type: 'string' },
                          weight: { type: 'number', minimum: 0 },
                          reason: { type: 'string' },
                        },
                      },
                    },
                    overall_notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Draft QC berhasil disimpan.',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcResult' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '409': {
              description: 'Draft QC belum dibuat — panggil /qc/{saleId}/start terlebih dahulu.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'NO_DRAFT_QC', message: 'Draft QC belum dibuat. Panggil endpoint start terlebih dahulu.' },
                  },
                },
              },
            },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/qc/{saleId}/preview-payment': {
        post: {
          tags: ['QC', 'Mobile QC / TaniTrust QC'],
          summary: 'Preview estimasi pembayaran QC',
          description: 'Menghitung preview estimasi pembayaran berdasarkan grade breakdown dan potongan. Endpoint ini tidak menyimpan data — hanya menghitung total. Harga per unit diambil dari price list aktif untuk komoditas terkait. Membutuhkan permission qc_results.create.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'saleId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan.',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['grade_breakdowns'],
                  properties: {
                    grade_breakdowns: {
                      type: 'array',
                      minItems: 1,
                      items: {
                        type: 'object',
                        required: ['weight'],
                        properties: {
                          grade_id: { type: 'string' },
                          grade_code: { type: 'string' },
                          grade_name: { type: 'string' },
                          weight: { type: 'number', minimum: 0 },
                        },
                      },
                    },
                    deduction_amount: { type: 'number', minimum: 0 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Estimasi pembayaran berhasil dihitung.',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              sale_id: { type: 'string', format: 'uuid' },
                              price_list_id: { type: 'string', format: 'uuid', nullable: true },
                              commodity_name: { type: 'string' },
                              unit: { type: 'string' },
                              subtotal_amount: { type: 'number' },
                              deduction_amount: { type: 'number' },
                              total_estimated_amount: { type: 'number' },
                              breakdown: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    grade_id: { type: 'string', nullable: true },
                                    grade_name: { type: 'string' },
                                    grade_code: { type: 'string' },
                                    weight: { type: 'number' },
                                    price_per_unit: { type: 'number' },
                                    estimated_amount: { type: 'number' },
                                    is_reject: { type: 'boolean' },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '409': {
              description: 'Tidak ada price list aktif untuk komoditas ini.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'NO_PRICE_LIST', message: 'Tidak ada price list aktif untuk komoditas ini.' },
                  },
                },
              },
            },
            '422': {
              description: 'Data tidak valid — total berat melebihi berat diterima.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Total berat grade breakdown melebihi berat diterima.' },
                  },
                },
              },
            },
          },
        },
      },
      '/qc/{saleId}/submit': {
        post: {
          tags: ['QC', 'Mobile QC / TaniTrust QC'],
          summary: 'Kirim hasil QC',
          description:
            'Mengirimkan hasil quality control final. Endpoint ini otomatis melakukan lookup harga dari price list aktif, menghitung total pembayaran, transisi submission ke MENUNGGU_PEMBAYARAN, membuat mutasi wallet HASIL_PENJUALAN, dan mengirim notifikasi ke petani. Validasi: total berat grade breakdown tidak boleh melebihi berat diterima. Mengubah status penjualan menjadi QC_SELESAI dan status QC menjadi DIKIRIM.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'saleId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID penjualan',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['grade_breakdowns'],
                  properties: {
                    parameter_values: {
                      type: 'array',
                      description: 'Alias untuk items — nilai parameter QC.',
                      items: {
                        type: 'object',
                        properties: {
                          qc_template_item_id: { type: 'string', format: 'uuid' },
                          parameter_id: { type: 'string', format: 'uuid', description: 'Alias untuk qc_template_item_id.' },
                          value_text: { type: 'string' },
                          value_number: { type: 'number' },
                          value_json: { type: 'object' },
                          notes: { type: 'string' },
                          proof_file_id: { type: 'string', format: 'uuid' },
                        },
                      },
                    },
                    items: {
                      type: 'array',
                      description: 'Nilai parameter QC (kompatibilitas lama).',
                      items: {
                        type: 'object',
                        required: ['qc_template_item_id'],
                        properties: {
                          qc_template_item_id: { type: 'string', format: 'uuid' },
                          value_text: { type: 'string' },
                          value_number: { type: 'number' },
                          value_json: { type: 'object' },
                          notes: { type: 'string' },
                          proof_file_id: { type: 'string', format: 'uuid' },
                        },
                      },
                    },
                    grade_breakdowns: {
                      type: 'array',
                      minItems: 1,
                      items: {
                        type: 'object',
                        required: ['weight'],
                        properties: {
                          grade_id: { type: 'string', description: 'PriceListItem id — jika diisi, harga akan diambil dari price list.' },
                          grade_code: { type: 'string' },
                          grade_name: { type: 'string' },
                          weight: { type: 'number', minimum: 0 },
                          reason: { type: 'string' },
                        },
                      },
                    },
                    qc_photo_file_ids: {
                      type: 'array',
                      items: { type: 'string', format: 'uuid' },
                      description: 'File IDs foto bukti QC.',
                    },
                    deduction_amount: { type: 'number', minimum: 0 },
                    final_grade_code: { type: 'string' },
                    recommended_grade_code: { type: 'string' },
                    overall_notes: { type: 'string' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Hasil QC berhasil dikirim beserta estimasi pembayaran.',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              qc_result: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  status: { type: 'string' },
                                  submitted_at: { type: 'string', format: 'date-time' },
                                  final_grade_code: { type: 'string', nullable: true },
                                  final_accepted_weight: { type: 'number', nullable: true },
                                  total_rejected_weight: { type: 'number', nullable: true },
                                  items: {
                                    type: 'array',
                                    items: { type: 'object' },
                                  },
                                  grade_breakdowns: {
                                    type: 'array',
                                    items: { type: 'object' },
                                  },
                                },
                              },
                              submission: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  sale_number: { type: 'string' },
                                  batch_number: { type: 'string' },
                                  status: { type: 'string' },
                                },
                              },
                              payment_estimation: {
                                type: 'object',
                                properties: {
                                  subtotal_amount: { type: 'number' },
                                  deduction_amount: { type: 'number' },
                                  total_estimated_amount: { type: 'number' },
                                  payment_status: { type: 'string' },
                                  payment_status_label: { type: 'string' },
                                  breakdown: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      properties: {
                                        grade_id: { type: 'string', nullable: true },
                                        grade_name: { type: 'string' },
                                        grade_code: { type: 'string' },
                                        weight: { type: 'number' },
                                        price_per_unit: { type: 'number' },
                                        estimated_amount: { type: 'number' },
                                        is_reject: { type: 'boolean' },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid atau berat breakdown melebihi berat diterima',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // ==================== QC Results ====================
      '/qc-results': {
        get: {
          tags: ['QC Results'],
          summary: 'Daftar hasil QC',
          description: 'Mengembalikan daftar hasil quality control dengan paginasi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar hasil QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/QcResult' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/qc-results/{id}': {
        get: {
          tags: ['QC Results'],
          summary: 'Detail hasil QC',
          description:
            'Mengembalikan detail hasil QC beserta item pemeriksaan, grade breakdown, dan data penjualan terkait.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID hasil QC',
            },
          ],
          responses: {
            '200': {
              description: 'Detail hasil QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/QcResult' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/qc-history': {
        get: {
          tags: ['QC Results'],
          summary: 'Riwayat QC',
          description:
            'Mengembalikan riwayat QC yang sudah dikirim atau disetujui, dengan paginasi dan filter.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
              description: 'Jumlah data per halaman',
            },
            {
              name: 'farmer_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan petani',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan komoditas',
            },
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan koperasi',
            },
            {
              name: 'grade',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter berdasarkan kode grade akhir',
            },
            {
              name: 'date_from',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal mulai (submitted_at)',
            },
            {
              name: 'date_to',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal akhir (submitted_at)',
            },
          ],
          responses: {
            '200': {
              description: 'Riwayat QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/QcResult' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ==================== Wallets ====================
      '/farmer-wallets': {
        get: {
          tags: ['Wallets'],
          summary: 'Daftar dompet petani',
          description: 'Mengembalikan daftar dompet petani dengan paginasi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar dompet petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerWallet' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/farmer-wallets/{id}': {
        get: {
          tags: ['Wallets'],
          summary: 'Detail dompet petani',
          description:
            'Mengembalikan detail dompet petani beserta 20 mutasi terakhir dan 10 pembayaran terakhir.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID dompet',
            },
          ],
          responses: {
            '200': {
              description: 'Detail dompet petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerWallet' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/farmer-wallet-mutations': {
        get: {
          tags: ['Wallets'],
          summary: 'Daftar mutasi dompet',
          description: 'Mengembalikan daftar mutasi dompet petani dengan paginasi dan filter.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            {
              name: 'farmer_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan petani',
            },
            {
              name: 'wallet_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan dompet',
            },
            {
              name: 'mutation_type',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter jenis mutasi (HASIL_PENJUALAN, PEMBAYARAN_TRANSFER, PENYESUAIAN_KEBERATAN)',
            },
            {
              name: 'date_from',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal mulai',
            },
            {
              name: 'date_to',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal akhir',
            },
          ],
          responses: {
            '200': {
              description: 'Daftar mutasi dompet',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerWalletMutation' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ==================== Payouts ====================
      '/farmer-payouts': {
        get: {
          tags: ['Payouts'],
          summary: 'Daftar pembayaran',
          description: 'Mengembalikan daftar pembayaran ke petani dengan paginasi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar pembayaran',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/FarmerPayout' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Payouts'],
          summary: 'Buat pembayaran baru',
          description:
            'Membuat pembayaran baru ke petani. Memvalidasi saldo dompet mencukupi, mengurangi saldo, dan membuat mutasi PEMBAYARAN_TRANSFER.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['farmer_id', 'cooperative_id', 'amount', 'payout_method'],
                  properties: {
                    farmer_id: { type: 'string', format: 'uuid' },
                    cooperative_id: { type: 'string', format: 'uuid' },
                    amount: { type: 'number', minimum: 0, example: 500000 },
                    payout_method: {
                      type: 'string',
                      enum: ['TRANSFER_BANK', 'TUNAI', 'LAINNYA'],
                    },
                    transfer_reference: { type: 'string' },
                    proof_file_id: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Pembayaran berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerPayout' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Saldo tidak mencukupi atau data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmer-payouts/{id}': {
        get: {
          tags: ['Payouts'],
          summary: 'Detail pembayaran',
          description: 'Mengembalikan detail pembayaran beserta ringkasan dompet.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID pembayaran',
            },
          ],
          responses: {
            '200': {
              description: 'Detail pembayaran',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerPayout' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Payouts'],
          summary: 'Ubah status pembayaran',
          description: 'Memperbarui status pembayaran atau referensi transfer.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID pembayaran',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['BELUM_DIBAYAR', 'MENUNGGU_TRANSFER', 'SUDAH_DITRANSFER', 'GAGAL_TRANSFER', 'DIBATALKAN'],
                    },
                    transfer_reference: { type: 'string' },
                    proof_file_id: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Pembayaran berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerPayout' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // ==================== Disputes ====================
      '/disputes': {
        get: {
          tags: ['Disputes'],
          summary: 'Daftar keberatan',
          description: 'Mengembalikan daftar keberatan petani dengan paginasi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar keberatan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Dispute' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Disputes'],
          summary: 'Buat keberatan baru',
          description: 'Membuat keberatan baru untuk penjualan tertentu.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['farmer_sale_id', 'reason_category', 'farmer_note'],
                  properties: {
                    farmer_sale_id: { type: 'string', format: 'uuid' },
                    reason_category: {
                      type: 'string',
                      enum: [
                        'BERAT_TIDAK_SESUAI',
                        'GRADE_TIDAK_SESUAI',
                        'BERAT_REJECT_TIDAK_SESUAI',
                        'HARGA_TIDAK_SESUAI',
                        'PEMBAYARAN_TIDAK_SESUAI',
                        'LAINNYA',
                      ],
                    },
                    farmer_note: { type: 'string', example: 'Berat yang dicatat tidak sesuai dengan timbangan saya.' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Keberatan berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Dispute' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '422': {
              description: 'Data tidak valid atau keberatan duplikat',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/disputes/{id}': {
        get: {
          tags: ['Disputes'],
          summary: 'Detail keberatan',
          description:
            'Mengembalikan detail keberatan beserta data penjualan, hasil QC, dan komoditas terkait.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID keberatan',
            },
          ],
          responses: {
            '200': {
              description: 'Detail keberatan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Dispute' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/disputes/{id}/review': {
        patch: {
          tags: ['Disputes'],
          summary: 'Review keberatan',
          description: 'Menandai keberatan sebagai DALAM_REVIEW dan menetapkan reviewer.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID keberatan',
            },
          ],
          responses: {
            '200': {
              description: 'Keberatan sedang di-review',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Dispute' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/disputes/{id}/resolve': {
        patch: {
          tags: ['Disputes'],
          summary: 'Selesaikan keberatan',
          description:
            'Menyelesaikan keberatan dengan keputusan. Jika disetujui dengan penyesuaian jumlah, otomatis membuat mutasi dompet PENYESUAIAN_KEBERATAN.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID keberatan',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['manager_decision', 'status'],
                  properties: {
                    manager_decision: { type: 'string', example: 'Setuju koreksi berat berdasarkan bukti foto.' },
                    resolution_note: { type: 'string' },
                    status: {
                      type: 'string',
                      enum: ['DISETUJUI', 'DITOLAK', 'SELESAI'],
                    },
                    adjustment_amount: {
                      type: 'number',
                      description: 'Jumlah penyesuaian saldo dompet (hanya jika status DISETUJUI)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Keberatan berhasil diselesaikan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Dispute' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // ==================== Reports ====================
      '/reports/commodities': {
        get: {
          tags: ['Reports'],
          summary: 'Laporan komoditas',
          description:
            'Mengembalikan ringkasan penjualan per komoditas: total berat, total nilai, dan jumlah transaksi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/DateFromParam' },
            { $ref: '#/components/parameters/DateToParam' },
          ],
          responses: {
            '200': {
              description: 'Laporan komoditas',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                commodity: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    code: { type: 'string' },
                                  },
                                },
                                total_weight: { type: 'number' },
                                total_amount: { type: 'number' },
                                total_sales: { type: 'integer' },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/reports/disputes': {
        get: {
          tags: ['Reports'],
          summary: 'Laporan keberatan',
          description: 'Mengembalikan daftar keberatan beserta ringkasan per status.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/DateFromParam' },
            { $ref: '#/components/parameters/DateToParam' },
          ],
          responses: {
            '200': {
              description: 'Laporan keberatan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              disputes: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Dispute' },
                              },
                              summary: {
                                type: 'object',
                                properties: {
                                  by_status: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      properties: {
                                        status: { type: 'string' },
                                        count: { type: 'integer' },
                                      },
                                    },
                                  },
                                  total: { type: 'integer' },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/reports/payouts': {
        get: {
          tags: ['Reports'],
          summary: 'Laporan pembayaran',
          description: 'Mengembalikan daftar pembayaran beserta ringkasan total.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/DateFromParam' },
            { $ref: '#/components/parameters/DateToParam' },
          ],
          responses: {
            '200': {
              description: 'Laporan pembayaran',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              payouts: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/FarmerPayout' },
                              },
                              summary: {
                                type: 'object',
                                properties: {
                                  total_count: { type: 'integer' },
                                  total_amount: { type: 'number' },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/reports/qc': {
        get: {
          tags: ['Reports'],
          summary: 'Laporan QC',
          description: 'Mengembalikan daftar hasil QC beserta ringkasan berat diperiksa, diterima, dan ditolak.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/DateFromParam' },
            { $ref: '#/components/parameters/DateToParam' },
          ],
          responses: {
            '200': {
              description: 'Laporan QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              results: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/QcResult' },
                              },
                              summary: {
                                type: 'object',
                                properties: {
                                  total_count: { type: 'integer' },
                                  total_weight_checked: { type: 'number' },
                                  total_accepted: { type: 'number' },
                                  total_rejected: { type: 'number' },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/reports/sales': {
        get: {
          tags: ['Reports'],
          summary: 'Laporan penjualan',
          description: 'Mengembalikan daftar penjualan beserta ringkasan total transaksi, nilai, dan berat.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/DateFromParam' },
            { $ref: '#/components/parameters/DateToParam' },
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan koperasi',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan komoditas',
            },
          ],
          responses: {
            '200': {
              description: 'Laporan penjualan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              sales: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/FarmerSale' },
                              },
                              summary: {
                                type: 'object',
                                properties: {
                                  total_count: { type: 'integer' },
                                  total_amount: { type: 'number' },
                                  total_weight: { type: 'number' },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/reports/wallets': {
        get: {
          tags: ['Reports'],
          summary: 'Laporan dompet',
          description:
            'Mengembalikan semua dompet petani beserta ringkasan total saldo tersedia, tertahan, dan dibayarkan.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Laporan dompet',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              wallets: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/FarmerWallet' },
                              },
                              summary: {
                                type: 'object',
                                properties: {
                                  total_wallets: { type: 'integer' },
                                  total_available: { type: 'number' },
                                  total_held: { type: 'number' },
                                  total_paid: { type: 'number' },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ==================== Files ====================
      '/files/upload': {
        post: {
          tags: ['Files'],
          summary: 'Upload file',
          description:
            'Mengupload file ke penyimpanan. Maks 10 MB. Format yang didukung: JPEG, PNG, WebP, PDF.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'File yang akan diupload (maks 10MB)',
                    },
                    entity_type: {
                      type: 'string',
                      description: 'Jenis entitas pemilik file',
                    },
                    entity_id: {
                      type: 'string',
                      description: 'ID entitas pemilik file',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'File berhasil diupload',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FileUpload' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '422': {
              description: 'File tidak valid (ukuran atau format)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/files/{id}': {
        get: {
          tags: ['Files'],
          summary: 'Detail file',
          description: 'Mengembalikan metadata file berdasarkan ID.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID file',
            },
          ],
          responses: {
            '200': {
              description: 'Detail file',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FileUpload' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ==================== Audit Logs ====================
      '/audit-logs': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Daftar log audit',
          description: 'Mengembalikan log aktivitas sistem dengan paginasi dan filter.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            {
              name: 'actor_user_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan ID pelaku',
            },
            {
              name: 'entity_type',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter jenis entitas (FarmerSale, QcResult, Dispute, dll)',
            },
            {
              name: 'action',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter aksi (CREATE, UPDATE, DELETE, CANCEL, dll)',
            },
            {
              name: 'source_client',
              in: 'query',
              schema: { type: 'string', enum: ['web', 'farmer_app'] },
              description: 'Filter sumber klien',
            },
            { $ref: '#/components/parameters/DateFromParam' },
            { $ref: '#/components/parameters/DateToParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar log audit',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AuditLog' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/audit-logs/entity/{entityType}/{entityId}': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Log audit per entitas',
          description: 'Mengembalikan semua log aktivitas untuk entitas tertentu, diurutkan dari terlama.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'entityType',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Jenis entitas (FarmerSale, QcResult, Dispute, Farmer, PriceList, dll)',
            },
            {
              name: 'entityId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'ID entitas',
            },
          ],
          responses: {
            '200': {
              description: 'Log audit entitas',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AuditLog' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ==================== Mobile QC / TaniTrust QC ====================
      '/mobile-qc/summary': {
        get: {
          tags: ['Mobile QC / TaniTrust QC'],
          summary: 'Ringkasan mobile QC',
          description: 'Mengembalikan ringkasan aktivitas quality control harian untuk aplikasi mobile QC officer: jumlah setoran hari ini, antrian yang menunggu QC, QC yang sedang diproses, QC selesai, dan aktivitas terkini. Membutuhkan permission qc_results.view.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'date',
              in: 'query',
              schema: { type: 'string', format: 'date', example: '2026-07-11' },
              description: 'Tanggal filter (format YYYY-MM-DD). Default hari ini.',
            },
            {
              name: 'cooperative_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Opsional — filter berdasarkan koperasi. Jika tidak diisi, koperasi aktif dari sesi digunakan.',
            },
          ],
          responses: {
            '200': {
              description: 'Ringkasan mobile QC.',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              date: { type: 'string', format: 'date' },
                              setoran_hari_ini: { type: 'integer', example: 12 },
                              menunggu_qc: { type: 'integer', example: 5 },
                              qc_diproses: { type: 'integer', example: 2 },
                              qc_selesai: { type: 'integer', example: 8 },
                              recent_activities: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string' },
                                    type: { type: 'string', example: 'QC_SUBMITTED' },
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    created_at: { type: 'string', format: 'date-time' },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ==================== Mobile Farmer / Karya Taniku ====================
      '/mobile/farmer/auth/login': {
        post: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Login petani',
          description: 'Autentikasi petani menggunakan nomor HP atau nomor anggota dan PIN 6 digit. Mengembalikan bearer token JWT.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MobileFarmerLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login berhasil',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileFarmerAuthResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Identifier atau PIN salah',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'Identifier atau PIN salah.' },
                  },
                },
              },
            },
            '403': {
              description: 'Akun petani tidak aktif',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Akun petani tidak aktif.' },
                  },
                },
              },
            },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Data yang dikirim tidak valid.' },
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/auth/register': {
        post: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Aktivasi akun petani',
          description: 'Mengaktifkan akun petani di aplikasi Karya Taniku. Identifier berupa nomor HP atau nomor anggota (farmer_number) dan PIN 6 digit. Petani harus sudah terdaftar oleh admin koperasi terlebih dahulu.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MobileFarmerLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Aktivasi berhasil',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileFarmerAuthResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '403': {
              description: 'Akun petani tidak aktif',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'Akun petani tidak aktif.' },
                  },
                },
              },
            },
            '404': {
              description: 'Identifier tidak dikenal',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Petani dengan identifier tersebut tidak ditemukan.' },
                  },
                },
              },
            },
            '409': {
              description: 'Akun sudah pernah diaktifkan',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Akun sudah diaktifkan sebelumnya.' },
                  },
                },
              },
            },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Data yang dikirim tidak valid.' },
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/auth/logout': {
        post: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Logout petani',
          description: 'Mengakhiri sesi petani. Endpoint publik yang menerima token jika diberikan namun tidak wajib.',
          responses: {
            '200': {
              description: 'Logout berhasil',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              message: { type: 'string', example: 'Berhasil keluar dari aplikasi.' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/auth/me': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Info petani yang sedang login',
          description: 'Mengembalikan info dasar petani yang sedang login termasuk identitas dan koperasi.',
          security: [{ mobileFarmerAuth: [] }],
          responses: {
            '200': {
              description: 'Info petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', format: 'uuid' },
                              farmer_id: { type: 'string', format: 'uuid' },
                              name: { type: 'string' },
                              phone: { type: 'string' },
                              member_number: { type: 'string' },
                              village: { type: 'string', nullable: true },
                              farm_location: { type: 'string', nullable: true },
                              main_commodity: { type: 'string', nullable: true },
                              cooperative_name: { type: 'string', nullable: true },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/mobile/farmer/auth/change-pin': {
        post: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Ganti PIN',
          description: 'Mengganti PIN petani. Membutuhkan PIN lama yang benar. PIN baru harus 6 digit.',
          security: [{ mobileFarmerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['current_pin', 'new_pin'],
                  properties: {
                    current_pin: { type: 'string', example: '123456' },
                    new_pin: { type: 'string', example: '654321' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'PIN berhasil diganti',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              message: { type: 'string', example: 'PIN berhasil diubah.' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'PIN lama salah atau token tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'PIN lama tidak sesuai.' },
                  },
                },
              },
            },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/profile': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Profil lengkap petani',
          description: 'Mengembalikan profil lengkap petani yang sedang login beserta info verifikasi dan koperasi.',
          security: [{ mobileFarmerAuth: [] }],
          responses: {
            '200': {
              description: 'Profil petani',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileFarmerProfile' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/mobile/farmer/submissions': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Daftar pengiriman hasil tani',
          description: 'Mengembalikan daftar pengiriman (submissions) milik petani yang sedang login. Mendukung filter status, komoditas, dan rentang tanggal.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['WAITING_QC', 'QC_IN_PROGRESS', 'QC_COMPLETED', 'PAYMENT_PENDING', 'PAID', 'DISPUTED', 'CANCELLED'],
              },
              description: 'Filter status pengiriman',
            },
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan ID komoditas',
            },
            {
              name: 'start_date',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal pengiriman mulai',
            },
            {
              name: 'end_date',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal pengiriman akhir',
            },
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar pengiriman',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MobileSubmissionListItem' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/mobile/farmer/submissions/{submissionId}': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Detail pengiriman',
          description: 'Mengembalikan detail lengkap satu pengiriman milik petani, termasuk timeline, foto intake, ringkasan QC dan pembayaran.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'submissionId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID pengiriman',
            },
          ],
          responses: {
            '200': {
              description: 'Detail pengiriman',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileSubmissionDetail' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': {
              description: 'Pengiriman tidak ditemukan atau bukan milik petani',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Data pengiriman tidak ditemukan.' },
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/submissions/{submissionId}/qc-result': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Hasil QC pengiriman',
          description: 'Mengembalikan hasil quality control untuk pengiriman tertentu, meliputi breakdown grade, parameter QC, foto bukti, dan ringkasan pembayaran.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'submissionId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID pengiriman',
            },
          ],
          responses: {
            '200': {
              description: 'Hasil QC',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileQcResultDetail' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': {
              description: 'Hasil QC belum tersedia atau pengiriman tidak ditemukan',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'QC_RESULT_NOT_AVAILABLE', message: 'Hasil QC belum tersedia untuk pengiriman ini.' },
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/submissions/{submissionId}/payment-estimation': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Estimasi pembayaran',
          description: 'Mengembalikan estimasi pembayaran untuk pengiriman tertentu, meliputi subtotal, potongan, dan total estimasi.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'submissionId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID pengiriman',
            },
          ],
          responses: {
            '200': {
              description: 'Estimasi pembayaran',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobilePaymentEstimation' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': {
              description: 'Estimasi belum tersedia atau pengiriman tidak ditemukan',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'PAYMENT_ESTIMATION_NOT_AVAILABLE', message: 'Estimasi pembayaran belum tersedia untuk pengiriman ini.' },
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/submissions/{submissionId}/disputes': {
        post: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Ajukan keberatan untuk pengiriman',
          description: 'Mengajukan keberatan (dispute) terhadap hasil pengiriman. Tidak dapat mengajukan keberatan jika sudah ada dispute aktif untuk pengiriman yang sama atau jika pengiriman tidak memenuhi syarat.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'submissionId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID pengiriman',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MobileCreateDisputeRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Keberatan berhasil diajukan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              dispute_id: { type: 'string', format: 'uuid' },
                              dispute_number: { type: 'string' },
                              submission_id: { type: 'string', format: 'uuid' },
                              status: { type: 'string', example: 'SUBMITTED' },
                              status_label: { type: 'string', example: 'Diajukan' },
                              created_at: { type: 'string', format: 'date-time' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': {
              description: 'Pengiriman tidak ditemukan',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '409': {
              description: 'Pengiriman tidak memenuhi syarat atau sudah ada dispute aktif',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    not_eligible: {
                      value: {
                        success: false,
                        error: { code: 'SUBMISSION_NOT_ELIGIBLE_FOR_DISPUTE', message: 'Pengiriman tidak memenuhi syarat untuk pengajuan keberatan.' },
                      },
                    },
                    active_exists: {
                      value: {
                        success: false,
                        error: { code: 'ACTIVE_DISPUTE_ALREADY_EXISTS', message: 'Sudah ada keberatan aktif untuk pengiriman ini.' },
                      },
                    },
                  },
                },
              },
            },
            '422': {
              description: 'Data tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/disputes': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Daftar keberatan',
          description: 'Mengembalikan daftar keberatan (disputes) yang diajukan oleh petani yang sedang login.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['SUBMITTED', 'UNDER_REVIEW', 'RE_QC_REQUIRED', 'APPROVED', 'REJECTED', 'CLOSED'],
              },
              description: 'Filter status keberatan',
            },
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar keberatan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MobileDisputeListItem' },
                          },
                          meta: { $ref: '#/components/schemas/PaginationMeta' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/mobile/farmer/disputes/{disputeId}': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Detail keberatan',
          description: 'Mengembalikan detail lengkap satu keberatan milik petani, termasuk timeline penanganan.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'disputeId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID keberatan',
            },
          ],
          responses: {
            '200': {
              description: 'Detail keberatan',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileDisputeDetail' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': {
              description: 'Keberatan tidak ditemukan atau bukan milik petani',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Data keberatan tidak ditemukan.' },
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/quality-history': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Riwayat kualitas hasil tani',
          description: 'Mengembalikan riwayat kualitas hasil tani petani yang sedang login, meliputi ringkasan, tren, insight, dan item detail. Mendukung filter komoditas dan rentang tanggal.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'commodity_id',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
              description: 'Filter berdasarkan ID komoditas',
            },
            {
              name: 'start_date',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal mulai',
            },
            {
              name: 'end_date',
              in: 'query',
              schema: { type: 'string', format: 'date' },
              description: 'Filter tanggal akhir',
            },
          ],
          responses: {
            '200': {
              description: 'Riwayat kualitas',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileQualityHistory' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/mobile/farmer/notifications': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Daftar notifikasi',
          description: 'Mengembalikan daftar notifikasi untuk petani yang sedang login. Meta menyertakan jumlah notifikasi yang belum dibaca.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'is_read',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Filter status baca (true=sudah dibaca, false=belum dibaca)',
            },
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: {
            '200': {
              description: 'Daftar notifikasi',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MobileNotification' },
                          },
                          meta: {
                            allOf: [
                              { $ref: '#/components/schemas/PaginationMeta' },
                              {
                                type: 'object',
                                properties: {
                                  unread_count: { type: 'integer', example: 3 },
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/mobile/farmer/notifications/{notificationId}/read': {
        patch: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Tandai notifikasi dibaca',
          description: 'Menandai satu notifikasi sebagai sudah dibaca.',
          security: [{ mobileFarmerAuth: [] }],
          parameters: [
            {
              name: 'notificationId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'ID notifikasi',
            },
          ],
          responses: {
            '200': {
              description: 'Notifikasi berhasil ditandai',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', format: 'uuid' },
                              is_read: { type: 'boolean', example: true },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': {
              description: 'Notifikasi tidak ditemukan atau bukan milik petani',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Data notifikasi tidak ditemukan.' },
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/files/upload': {
        post: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Upload file (bukti keberatan, dsb)',
          description: 'Upload file (foto/dokumen) untuk keperluan aplikasi mobile petani. Default purpose adalah DISPUTE_EVIDENCE (bukti keberatan).',
          security: [{ mobileFarmerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'File yang akan diupload' },
                    purpose: {
                      type: 'string',
                      default: 'DISPUTE_EVIDENCE',
                      example: 'DISPUTE_EVIDENCE',
                      description: 'Tujuan/kategori file',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'File berhasil diupload',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileFileUploadResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '422': {
              description: 'File tidak valid (ukuran terlalu besar atau tipe tidak diizinkan)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  examples: {
                    too_large: {
                      value: {
                        success: false,
                        error: { code: 'FILE_TOO_LARGE', message: 'Ukuran file melebihi batas yang diizinkan.' },
                      },
                    },
                    invalid_type: {
                      value: {
                        success: false,
                        error: { code: 'INVALID_FILE_TYPE', message: 'Tipe file tidak diizinkan.' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/mobile/farmer/home-summary': {
        get: {
          tags: ['Mobile Farmer / Karya Taniku'],
          summary: 'Ringkasan beranda',
          description: 'Mengembalikan data ringkasan untuk halaman beranda aplikasi Karya Taniku: sapaan, kartu ringkasan status, pengiriman terbaru, dan aktivitas terkini petani.',
          security: [{ mobileFarmerAuth: [] }],
          responses: {
            '200': {
              description: 'Ringkasan beranda',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MobileHomeSummary' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
    },

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT yang didapat dari endpoint login admin.',
        },
        mobileFarmerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer token yang didapat dari POST /mobile/farmer/auth/login. Token khusus untuk aplikasi Karya Taniku dan hanya dapat mengakses endpoint /mobile/farmer/*.',
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Nomor halaman',
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10, maximum: 100 },
          description: 'Jumlah data per halaman',
        },
        DateFromParam: {
          name: 'date_from',
          in: 'query',
          schema: { type: 'string', format: 'date' },
          description: 'Filter tanggal mulai',
        },
        DateToParam: {
          name: 'date_to',
          in: 'query',
          schema: { type: 'string', format: 'date' },
          description: 'Filter tanggal akhir',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            meta: { type: 'object', nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Data yang dikirim tidak valid.' },
                details: {
                  type: 'array',
                  nullable: true,
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 50 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Admin Utama' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            last_login_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'ADMIN' },
            name: { type: 'string', example: 'Administrator' },
            description: { type: 'string', nullable: true },
            status: { type: 'string' },
            role_permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  permission: { $ref: '#/components/schemas/Permission' },
                },
              },
            },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'farmers.view' },
            name: { type: 'string', example: 'Lihat Petani' },
            module: { type: 'string', example: 'farmers' },
            description: { type: 'string', nullable: true },
          },
        },
        Cooperative: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'KOP-001' },
            name: { type: 'string', example: 'Koperasi Tani Makmur' },
            province: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            district: { type: 'string', nullable: true },
            village: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            legal_number: { type: 'string', nullable: true },
            status: { type: 'string', example: 'ACTIVE' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateCooperativeInput: {
          type: 'object',
          required: ['code', 'name'],
          properties: {
            code: { type: 'string', example: 'KOP-002' },
            name: { type: 'string', example: 'Koperasi Sejahtera' },
            province: { type: 'string' },
            city: { type: 'string' },
            district: { type: 'string' },
            village: { type: 'string' },
            address: { type: 'string' },
            legal_number: { type: 'string' },
          },
        },
        Farmer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_number: { type: 'string', example: 'PTN-001' },
            name: { type: 'string', example: 'Budi Santoso' },
            phone: { type: 'string' },
            nik: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            village: { type: 'string', nullable: true },
            seller_type: {
              type: 'string',
              enum: [
                'PEMILIK_LAHAN',
                'PENGGARAP',
                'PENYEWA_LAHAN',
                'KELOMPOK_TANI',
                'BADAN_USAHA',
                'PENGEPUL_TERVERIFIKASI',
                'LAINNYA',
              ],
            },
            verification_status: { type: 'string', example: 'BELUM_DIVERIFIKASI' },
            status: { type: 'string', example: 'ACTIVE' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
        CreateFarmerInput: {
          type: 'object',
          required: ['cooperative_id', 'farmer_number', 'name', 'phone', 'seller_type'],
          properties: {
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_number: { type: 'string', example: 'PTN-002' },
            name: { type: 'string', example: 'Siti Rahayu' },
            phone: { type: 'string', example: '081234567890' },
            nik: { type: 'string' },
            address: { type: 'string' },
            village: { type: 'string' },
            seller_type: {
              type: 'string',
              enum: [
                'PEMILIK_LAHAN',
                'PENGGARAP',
                'PENYEWA_LAHAN',
                'KELOMPOK_TANI',
                'BADAN_USAHA',
                'PENGEPUL_TERVERIFIKASI',
                'LAINNYA',
              ],
            },
            verification_status: { type: 'string' },
          },
        },
        FarmerRepresentative: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            farmer_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Ahmad Supardi' },
            phone: { type: 'string', nullable: true },
            relationship_type: {
              type: 'string',
              enum: ['PEGAWAI', 'KELUARGA', 'SOPIR', 'BURUH_TANI', 'KETUA_KELOMPOK', 'KUASA', 'LAINNYA'],
            },
            identity_number: { type: 'string', nullable: true },
            status: { type: 'string', example: 'ACTIVE' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            farmer: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                farmer_number: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
        Commodity: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'KMD-001' },
            name: { type: 'string', example: 'Kelapa Sawit' },
            category: { type: 'string', nullable: true },
            default_unit: { type: 'string', example: 'kg' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', example: 'ACTIVE' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            variants: {
              type: 'array',
              items: { $ref: '#/components/schemas/CommodityVariant' },
            },
          },
        },
        CommodityVariant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            commodity_id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'KMD-001-TBS' },
            name: { type: 'string', example: 'Tandan Buah Segar' },
            unit: { type: 'string', example: 'kg' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', example: 'ACTIVE' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateCommodityInput: {
          type: 'object',
          required: ['code', 'name', 'default_unit'],
          properties: {
            code: { type: 'string', example: 'KMD-002' },
            name: { type: 'string', example: 'Karet' },
            category: { type: 'string' },
            default_unit: { type: 'string', example: 'kg' },
            description: { type: 'string' },
          },
        },
        PriceList: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Harga Sawit Juli 2026' },
            valid_from: { type: 'string', format: 'date-time' },
            valid_until: { type: 'string', format: 'date-time', nullable: true },
            status: {
              type: 'string',
              enum: ['DRAFT', 'AKTIF', 'NONAKTIF', 'KEDALUWARSA'],
              example: 'AKTIF',
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/PriceListItem' },
            },
          },
        },
        PriceListItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            price_list_id: { type: 'string', format: 'uuid' },
            commodity_id: { type: 'string', format: 'uuid' },
            commodity_variant_id: { type: 'string', format: 'uuid', nullable: true },
            grade_name: { type: 'string', example: 'Grade A' },
            grade_code: { type: 'string', example: 'A' },
            price_per_unit: { type: 'number', example: 2500 },
            unit: { type: 'string', example: 'kg' },
            is_reject: { type: 'boolean', example: false },
            sort_order: { type: 'integer', example: 0 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            commodity: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
            commodity_variant: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
        FarmerSale: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_id: { type: 'string', format: 'uuid' },
            representative_id: { type: 'string', format: 'uuid', nullable: true },
            commodity_id: { type: 'string', format: 'uuid' },
            commodity_variant_id: { type: 'string', format: 'uuid', nullable: true },
            price_list_id: { type: 'string', format: 'uuid', nullable: true },
            qc_template_id: { type: 'string', format: 'uuid', nullable: true },
            sale_number: { type: 'string', example: 'JUAL-20260710-0001' },
            batch_number: { type: 'string', example: 'BATCH-KMD001-20260710-0001' },
            initial_weight: { type: 'number', nullable: true },
            received_weight: { type: 'number', nullable: true },
            total_amount: { type: 'number', nullable: true },
            status: {
              type: 'string',
              enum: [
                'DRAFT',
                'DITERIMA_KOPERASI',
                'MENUNGGU_QC',
                'QC_DIPROSES',
                'QC_SELESAI',
                'HARGA_DIHITUNG',
                'MENUNGGU_PEMBAYARAN',
                'DIBAYAR',
                'KEBERATAN',
                'DIBATALKAN',
              ],
              example: 'DRAFT',
            },
            notes: { type: 'string', nullable: true },
            received_by_user_id: { type: 'string', format: 'uuid', nullable: true },
            received_at: { type: 'string', format: 'date-time', nullable: true },
            calculated_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            farmer: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                farmer_number: { type: 'string' },
              },
            },
            representative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
            commodity: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                code: { type: 'string' },
              },
            },
            commodity_variant: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
          },
        },
        CreateFarmerSaleInput: {
          type: 'object',
          required: ['cooperative_id', 'farmer_id', 'commodity_id'],
          properties: {
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_id: { type: 'string', format: 'uuid' },
            representative_id: { type: 'string', format: 'uuid' },
            commodity_id: { type: 'string', format: 'uuid' },
            commodity_variant_id: { type: 'string', format: 'uuid' },
            price_list_id: { type: 'string', format: 'uuid' },
            qc_template_id: { type: 'string', format: 'uuid' },
            initial_weight: { type: 'number', minimum: 0 },
            received_weight: { type: 'number', minimum: 0 },
            notes: { type: 'string' },
            received_at: { type: 'string', format: 'date-time' },
          },
        },
        QcTemplate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            commodity_id: { type: 'string', format: 'uuid' },
            commodity_variant_id: { type: 'string', format: 'uuid', nullable: true },
            name: { type: 'string', example: 'QC Sawit Standar v1' },
            version: { type: 'integer', example: 1 },
            valid_from: { type: 'string', format: 'date-time' },
            valid_until: { type: 'string', format: 'date-time', nullable: true },
            status: {
              type: 'string',
              enum: ['DRAFT', 'AKTIF', 'NONAKTIF', 'ARSIP'],
              example: 'AKTIF',
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
            commodity: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
            commodity_variant: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/QcTemplateItem' },
            },
            _count: {
              type: 'object',
              properties: {
                items: { type: 'integer' },
              },
            },
          },
        },
        QcTemplateItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            qc_template_id: { type: 'string', format: 'uuid' },
            item_name: { type: 'string', example: 'Kadar Air' },
            item_code: { type: 'string', example: 'KADAR_AIR' },
            input_type: {
              type: 'string',
              enum: ['ANGKA', 'PERSENTASE', 'PILIHAN', 'CHECKLIST', 'YA_TIDAK', 'FOTO', 'CATATAN'],
            },
            is_required: { type: 'boolean', example: true },
            requires_proof: { type: 'boolean', example: false },
            options_json: { type: 'object', nullable: true },
            min_value: { type: 'number', nullable: true },
            max_value: { type: 'number', nullable: true },
            help_text: { type: 'string', nullable: true },
            sort_order: { type: 'integer', example: 0 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        QcResult: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            farmer_sale_id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_id: { type: 'string', format: 'uuid' },
            qc_template_id: { type: 'string', format: 'uuid' },
            qc_officer_user_id: { type: 'string', format: 'uuid', nullable: true },
            recommended_grade_code: { type: 'string', nullable: true },
            final_grade_code: { type: 'string', nullable: true },
            total_weight_checked: { type: 'number', nullable: true },
            final_accepted_weight: { type: 'number', nullable: true },
            total_rejected_weight: { type: 'number', nullable: true },
            notes: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['DRAFT', 'DIKIRIM', 'DISETUJUI', 'DIKOREKSI', 'DIBATALKAN'],
              example: 'DIKIRIM',
            },
            submitted_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            farmer_sale: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                sale_number: { type: 'string' },
                batch_number: { type: 'string' },
              },
            },
            farmer: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                farmer_number: { type: 'string' },
              },
            },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
            qc_officer: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
            qc_template: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  qc_result_id: { type: 'string', format: 'uuid' },
                  qc_template_item_id: { type: 'string', format: 'uuid' },
                  value_text: { type: 'string', nullable: true },
                  value_number: { type: 'number', nullable: true },
                  value_json: { type: 'object', nullable: true },
                  notes: { type: 'string', nullable: true },
                  proof_file_id: { type: 'string', format: 'uuid', nullable: true },
                  qc_template_item: { $ref: '#/components/schemas/QcTemplateItem' },
                },
              },
            },
            grade_breakdowns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  qc_result_id: { type: 'string', format: 'uuid' },
                  grade_name: { type: 'string', example: 'Grade A' },
                  grade_code: { type: 'string', example: 'A' },
                  weight: { type: 'number', example: 450 },
                  price_per_unit: { type: 'number', nullable: true },
                  estimated_amount: { type: 'number', nullable: true },
                  reason: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        FarmerWallet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_id: { type: 'string', format: 'uuid' },
            available_balance: { type: 'number', example: 1500000 },
            held_balance: { type: 'number', example: 0 },
            total_paid: { type: 'number', example: 3000000 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            farmer: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                farmer_number: { type: 'string' },
                phone: { type: 'string' },
              },
            },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
        FarmerWalletMutation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_id: { type: 'string', format: 'uuid' },
            wallet_id: { type: 'string', format: 'uuid' },
            mutation_type: {
              type: 'string',
              example: 'HASIL_PENJUALAN',
              description: 'HASIL_PENJUALAN, PEMBAYARAN_TRANSFER, PENYESUAIAN_KEBERATAN',
            },
            reference_type: { type: 'string', nullable: true, example: 'FarmerSale' },
            reference_id: { type: 'string', nullable: true },
            amount_in: { type: 'number', example: 1250000 },
            amount_out: { type: 'number', example: 0 },
            balance_before: { type: 'number', example: 250000 },
            balance_after: { type: 'number', example: 1500000 },
            notes: { type: 'string', nullable: true },
            created_by_user_id: { type: 'string', format: 'uuid', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            farmer: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                farmer_number: { type: 'string' },
              },
            },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
            created_by: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
          },
        },
        FarmerPayout: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_id: { type: 'string', format: 'uuid' },
            wallet_id: { type: 'string', format: 'uuid' },
            payout_number: { type: 'string', example: 'BAYAR-20260710-0001' },
            amount: { type: 'number', example: 500000 },
            payout_method: {
              type: 'string',
              enum: ['TRANSFER_BANK', 'TUNAI', 'LAINNYA'],
              example: 'TRANSFER_BANK',
            },
            transfer_reference: { type: 'string', nullable: true },
            proof_file_id: { type: 'string', format: 'uuid', nullable: true },
            status: {
              type: 'string',
              enum: ['BELUM_DIBAYAR', 'MENUNGGU_TRANSFER', 'SUDAH_DITRANSFER', 'GAGAL_TRANSFER', 'DIBATALKAN'],
              example: 'BELUM_DIBAYAR',
            },
            paid_by_user_id: { type: 'string', format: 'uuid', nullable: true },
            paid_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            farmer: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                farmer_number: { type: 'string' },
              },
            },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
              },
            },
            paid_by: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
            proof_file: {
              $ref: '#/components/schemas/FileUpload',
            },
          },
        },
        Dispute: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cooperative_id: { type: 'string', format: 'uuid' },
            farmer_id: { type: 'string', format: 'uuid' },
            farmer_sale_id: { type: 'string', format: 'uuid' },
            qc_result_id: { type: 'string', format: 'uuid', nullable: true },
            dispute_number: { type: 'string', example: 'KBT-20260710-0001' },
            reason_category: {
              type: 'string',
              enum: [
                'BERAT_TIDAK_SESUAI',
                'GRADE_TIDAK_SESUAI',
                'BERAT_REJECT_TIDAK_SESUAI',
                'HARGA_TIDAK_SESUAI',
                'PEMBAYARAN_TIDAK_SESUAI',
                'LAINNYA',
              ],
            },
            farmer_note: { type: 'string' },
            status: {
              type: 'string',
              enum: ['DIKIRIM', 'DALAM_REVIEW', 'PERLU_QC_ULANG', 'DISETUJUI', 'DITOLAK', 'SELESAI'],
              example: 'DIKIRIM',
            },
            reviewed_by_user_id: { type: 'string', format: 'uuid', nullable: true },
            manager_decision: { type: 'string', nullable: true },
            resolution_note: { type: 'string', nullable: true },
            resolved_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            farmer: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                farmer_number: { type: 'string' },
              },
            },
            farmer_sale: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                sale_number: { type: 'string' },
                batch_number: { type: 'string' },
                total_amount: { type: 'number', nullable: true },
              },
            },
            reviewed_by: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
              },
            },
          },
        },
        FileUpload: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            file_url: { type: 'string' },
            file_name: { type: 'string', example: 'foto-tbs.jpg' },
            file_type: { type: 'string', example: 'image/jpeg' },
            file_size: { type: 'integer', description: 'Ukuran file dalam byte', example: 245760 },
            storage_provider: { type: 'string', enum: ['R2', 'LOCAL'] },
            uploaded_by_user_id: { type: 'string', format: 'uuid', nullable: true },
            entity_type: { type: 'string', nullable: true },
            entity_id: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            actor_user_id: { type: 'string', format: 'uuid', nullable: true },
            entity_type: { type: 'string', example: 'FarmerSale' },
            entity_id: { type: 'string', nullable: true },
            action: {
              type: 'string',
              example: 'CREATE',
              description: 'CREATE, UPDATE, DELETE, CANCEL, CALCULATE_PRICE, UPLOAD_PHOTO, REVIEW, RESOLVE, dll',
            },
            before_json: { type: 'object', nullable: true },
            after_json: { type: 'object', nullable: true },
            source_client: { type: 'string', enum: ['web', 'farmer_app'], example: 'web' },
            ip_address: { type: 'string', nullable: true },
            user_agent: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            actor: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
              },
            },
          },
        },
        MobileFarmerLoginRequest: {
          type: 'object',
          required: ['identifier', 'pin'],
          properties: {
            identifier: {
              type: 'string',
              example: '081234567890',
              description: 'Nomor HP atau nomor anggota petani.',
            },
            pin: {
              type: 'string',
              example: '123456',
              description: 'PIN 6 digit.',
            },
          },
        },
        MobileFarmerAuthResponse: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string', nullable: true },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                farmer_id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                phone: { type: 'string' },
                member_number: { type: 'string' },
                role: { type: 'string', example: 'FARMER' },
              },
            },
          },
        },
        MobileFarmerProfile: {
          type: 'object',
          properties: {
            farmer_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            phone: { type: 'string' },
            member_number: { type: 'string' },
            nik: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            village: { type: 'string', nullable: true },
            farm_location: { type: 'string', nullable: true },
            main_commodity: { type: 'string', nullable: true },
            seller_type: { type: 'string', nullable: true },
            photo_url: { type: 'string', nullable: true },
            verification_status: { type: 'string' },
            cooperative_name: { type: 'string', nullable: true },
            cooperative_code: { type: 'string', nullable: true },
            status: { type: 'string' },
          },
        },
        MobileSubmissionListItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            submission_number: { type: 'string', example: 'SUB-2026-0001' },
            batch_number: { type: 'string', nullable: true, example: 'BATCH-2026-0001' },
            commodity: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'Padi' },
              },
            },
            initial_weight: { type: 'number', example: 1000.5 },
            received_weight: { type: 'number', nullable: true, example: 990 },
            status: {
              type: 'string',
              enum: ['WAITING_QC', 'QC_IN_PROGRESS', 'QC_COMPLETED', 'PAYMENT_PENDING', 'PAID', 'DISPUTED', 'CANCELLED'],
            },
            status_label: { type: 'string', example: 'Menunggu QC' },
            received_at: { type: 'string', format: 'date-time', nullable: true },
            estimated_payment: { type: 'number', nullable: true, example: 4500000 },
            has_qc_result: { type: 'boolean' },
            has_active_dispute: { type: 'boolean' },
          },
        },
        MobileSubmissionDetail: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            submission_number: { type: 'string' },
            batch_number: { type: 'string', nullable: true },
            commodity: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                variant: { type: 'string', nullable: true },
              },
            },
            initial_weight: { type: 'number' },
            received_weight: { type: 'number', nullable: true },
            status: { type: 'string' },
            status_label: { type: 'string' },
            received_at: { type: 'string', format: 'date-time', nullable: true },
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  event: { type: 'string', example: 'RECEIVED' },
                  label: { type: 'string', example: 'Diterima di koperasi' },
                  timestamp: { type: 'string', format: 'date-time', nullable: true },
                  actor: { type: 'string', nullable: true },
                },
              },
            },
            intake_photos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  url: { type: 'string' },
                  caption: { type: 'string', nullable: true },
                },
              },
            },
            qc_result_summary: {
              type: 'object',
              nullable: true,
              properties: {
                qc_result_id: { type: 'string', format: 'uuid' },
                completed_at: { type: 'string', format: 'date-time', nullable: true },
                total_accepted_weight: { type: 'number' },
                total_rejected_weight: { type: 'number' },
                dominant_grade: { type: 'string', nullable: true },
              },
            },
            payment_summary: {
              type: 'object',
              nullable: true,
              properties: {
                subtotal_amount: { type: 'number' },
                deduction_amount: { type: 'number' },
                total_estimated_amount: { type: 'number' },
                payment_status: { type: 'string' },
                payment_status_label: { type: 'string' },
              },
            },
            active_dispute: {
              type: 'object',
              nullable: true,
              properties: {
                dispute_id: { type: 'string', format: 'uuid' },
                dispute_number: { type: 'string' },
                status: { type: 'string' },
                status_label: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        MobileQcResultDetail: {
          type: 'object',
          properties: {
            qc_result_id: { type: 'string', format: 'uuid' },
            submission_id: { type: 'string', format: 'uuid' },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            grade_breakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  grade: { type: 'string', example: 'A' },
                  weight: { type: 'number', example: 500 },
                  price_per_kg: { type: 'number', example: 5000 },
                  subtotal: { type: 'number', example: 2500000 },
                  percentage: { type: 'number', example: 50.5 },
                },
              },
            },
            qc_parameters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'MOISTURE' },
                  label: { type: 'string', example: 'Kadar Air' },
                  value: { type: 'string', example: '14%' },
                  is_passed: { type: 'boolean' },
                },
              },
            },
            evidence_photos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  url: { type: 'string' },
                  caption: { type: 'string', nullable: true },
                },
              },
            },
            payment_summary: {
              type: 'object',
              properties: {
                subtotal_amount: { type: 'number' },
                deduction_amount: { type: 'number' },
                total_estimated_amount: { type: 'number' },
              },
            },
          },
        },
        MobilePaymentEstimation: {
          type: 'object',
          properties: {
            submission_id: { type: 'string', format: 'uuid' },
            subtotal_amount: { type: 'number', example: 4500000 },
            deduction_amount: { type: 'number', example: 100000 },
            total_estimated_amount: { type: 'number', example: 4400000 },
            payment_status: {
              type: 'string',
              enum: ['PAYMENT_PENDING', 'PROCESSING', 'PAID', 'ON_HOLD'],
            },
            payment_status_label: { type: 'string', example: 'Menunggu pembayaran' },
            breakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string', example: 'Subtotal Grade A' },
                  amount: { type: 'number', example: 2500000 },
                  type: { type: 'string', enum: ['CREDIT', 'DEBIT'], example: 'CREDIT' },
                },
              },
            },
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  event: { type: 'string' },
                  label: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        MobileCreateDisputeRequest: {
          type: 'object',
          required: ['reason_category', 'farmer_note'],
          properties: {
            reason_category: {
              type: 'string',
              enum: [
                'WEIGHT_MISMATCH',
                'GRADE_DISAGREEMENT',
                'REJECTED_WEIGHT_DISAGREEMENT',
                'PRICE_MISMATCH',
                'PAYMENT_MISMATCH',
                'OTHER',
              ],
              description: 'Kategori alasan keberatan.',
            },
            farmer_note: {
              type: 'string',
              description: 'Catatan/penjelasan dari petani.',
            },
            evidence_photo_ids: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              description: 'ID foto bukti yang telah diupload sebelumnya (opsional).',
            },
          },
        },
        MobileDisputeListItem: {
          type: 'object',
          properties: {
            dispute_id: { type: 'string', format: 'uuid' },
            dispute_number: { type: 'string', example: 'DSP-2026-0001' },
            submission_id: { type: 'string', format: 'uuid' },
            submission_number: { type: 'string' },
            commodity_name: { type: 'string', example: 'Padi' },
            reason_category: {
              type: 'string',
              enum: [
                'WEIGHT_MISMATCH',
                'GRADE_DISAGREEMENT',
                'REJECTED_WEIGHT_DISAGREEMENT',
                'PRICE_MISMATCH',
                'PAYMENT_MISMATCH',
                'OTHER',
              ],
            },
            reason_label: { type: 'string', example: 'Berat tidak sesuai' },
            status: {
              type: 'string',
              enum: ['SUBMITTED', 'UNDER_REVIEW', 'RE_QC_REQUIRED', 'APPROVED', 'REJECTED', 'CLOSED'],
            },
            status_label: { type: 'string', example: 'Diajukan' },
            created_at: { type: 'string', format: 'date-time' },
            resolved_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        MobileDisputeDetail: {
          type: 'object',
          properties: {
            dispute_id: { type: 'string', format: 'uuid' },
            dispute_number: { type: 'string' },
            submission_id: { type: 'string', format: 'uuid' },
            submission_number: { type: 'string' },
            commodity_name: { type: 'string' },
            reason_category: { type: 'string' },
            reason_label: { type: 'string' },
            farmer_note: { type: 'string' },
            status: { type: 'string' },
            status_label: { type: 'string' },
            resolution_note: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            resolved_at: { type: 'string', format: 'date-time', nullable: true },
            evidence_photos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  url: { type: 'string' },
                  caption: { type: 'string', nullable: true },
                },
              },
            },
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  event: { type: 'string', example: 'SUBMITTED' },
                  label: { type: 'string', example: 'Keberatan diajukan' },
                  timestamp: { type: 'string', format: 'date-time' },
                  actor: { type: 'string', nullable: true },
                  note: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        MobileNotification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string', example: 'SUBMISSION_UPDATE' },
            related_entity_type: { type: 'string', nullable: true, example: 'SUBMISSION' },
            related_entity_id: { type: 'string', nullable: true },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        MobileFileUploadResponse: {
          type: 'object',
          properties: {
            file_id: { type: 'string', format: 'uuid' },
            url: { type: 'string' },
            file_name: { type: 'string' },
            file_type: { type: 'string', example: 'image/jpeg' },
            size: { type: 'integer', example: 245678 },
            purpose: { type: 'string', example: 'DISPUTE_EVIDENCE' },
          },
        },
        MobileHomeSummary: {
          type: 'object',
          properties: {
            greeting_name: { type: 'string', example: 'Budi' },
            cards: {
              type: 'object',
              properties: {
                active_submissions: { type: 'integer', example: 3 },
                waiting_qc: { type: 'integer', example: 1 },
                qc_completed: { type: 'integer', example: 2 },
                payment_pending: { type: 'integer', example: 1 },
                active_disputes: { type: 'integer', example: 0 },
              },
            },
            latest_submission: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                submission_number: { type: 'string' },
                commodity_name: { type: 'string' },
                status: { type: 'string' },
                status_label: { type: 'string' },
                received_at: { type: 'string', format: 'date-time', nullable: true },
              },
            },
            recent_activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string', example: 'QC_COMPLETED' },
                  title: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  related_entity_type: { type: 'string', nullable: true },
                  related_entity_id: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        MobileQualityHistory: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                total_submissions: { type: 'integer' },
                average_grade: { type: 'string', nullable: true, example: 'A' },
                average_price_per_kg: { type: 'number', nullable: true },
                total_weight: { type: 'number' },
                total_earnings: { type: 'number' },
              },
            },
            trend: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  period: { type: 'string', example: '2026-06' },
                  average_price_per_kg: { type: 'number' },
                  total_weight: { type: 'number' },
                  dominant_grade: { type: 'string', nullable: true },
                },
              },
            },
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'QUALITY_IMPROVING' },
                  title: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  submission_id: { type: 'string', format: 'uuid' },
                  submission_number: { type: 'string' },
                  commodity_name: { type: 'string' },
                  received_at: { type: 'string', format: 'date-time', nullable: true },
                  dominant_grade: { type: 'string', nullable: true },
                  average_price_per_kg: { type: 'number', nullable: true },
                  total_weight: { type: 'number' },
                },
              },
            },
          },
        },
        QcTemplateInputType: {
          type: 'string',
          enum: ['ANGKA', 'PERSENTASE', 'PILIHAN', 'CHECKLIST', 'YA_TIDAK', 'FOTO', 'CATATAN'],
          description: 'Tipe input parameter QC. ANGKA=number, PERSENTASE=percentage, PILIHAN=dropdown, CHECKLIST=multiple checkbox, YA_TIDAK=pass/fail, FOTO=photo upload, CATATAN=free text.',
        },
      },
      responses: {
        Unauthorized: {
          description: 'Belum login atau token tidak valid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Anda belum masuk ke sistem.',
                },
              },
            },
          },
        },
        Forbidden: {
          description: 'Tidak memiliki hak akses',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'Anda tidak memiliki akses.',
                },
              },
            },
          },
        },
        NotFound: {
          description: 'Data tidak ditemukan',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Data tidak ditemukan.',
                },
              },
            },
          },
        },
      },
    },
  }

  return NextResponse.json(spec)
}
