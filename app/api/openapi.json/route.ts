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
      { name: 'Farmer App Auth', description: 'Autentikasi aplikasi petani (Karya Taniku)' },
      { name: 'Farmer App', description: 'Endpoint aplikasi petani (Karya Taniku)' },
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
          description: 'Autentikasi pengguna dengan email dan kata sandi. Mengembalikan token JWT.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@karyatani.id' },
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
                              token: { type: 'string' },
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
          description: 'Mengembalikan daftar petani beserta info koperasi.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Daftar petani',
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
          description: 'Membuat data petani baru.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateFarmerInput' },
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
      '/qc/{saleId}/submit': {
        post: {
          tags: ['QC'],
          summary: 'Kirim hasil QC',
          description:
            'Mengirimkan hasil quality control. Validasi: total berat grade breakdown tidak boleh melebihi berat diterima. Mengubah status penjualan menjadi QC_SELESAI dan status QC menjadi DIKIRIM.',
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
                  required: ['items', 'grade_breakdowns'],
                  properties: {
                    final_grade_code: { type: 'string' },
                    recommended_grade_code: { type: 'string' },
                    total_weight_checked: { type: 'number', minimum: 0 },
                    final_accepted_weight: { type: 'number', minimum: 0 },
                    total_rejected_weight: { type: 'number', minimum: 0 },
                    notes: { type: 'string' },
                    items: {
                      type: 'array',
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
                        required: ['grade_name', 'grade_code', 'weight'],
                        properties: {
                          grade_name: { type: 'string', example: 'Grade A' },
                          grade_code: { type: 'string', example: 'A' },
                          weight: { type: 'number', minimum: 0, example: 450 },
                          reason: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Hasil QC berhasil dikirim',
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

      // ==================== Farmer App Auth ====================
      '/farmer-app/auth/register': {
        post: {
          tags: ['Farmer App Auth'],
          summary: 'Aktivasi akun petani',
          description:
            'Mengaktifkan akun petani di aplikasi Karya Taniku. Petani harus sudah terdaftar di sistem oleh admin koperasi. Membutuhkan nomor telepon yang sesuai dan PIN 6 digit.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FarmerAppRegisterInput' },
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
                          data: {
                            type: 'object',
                            properties: {
                              token: { type: 'string' },
                              farmer: { $ref: '#/components/schemas/FarmerAppProfile' },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '404': {
              description: 'Petani tidak ditemukan dengan nomor telepon tersebut',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '422': {
              description: 'Data tidak valid atau akun sudah diaktifkan',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/farmer-app/auth/login': {
        post: {
          tags: ['Farmer App Auth'],
          summary: 'Masuk aplikasi petani',
          description: 'Autentikasi petani dengan nomor telepon dan PIN. Mengembalikan token JWT.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FarmerAppLoginInput' },
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
                              token: { type: 'string' },
                              farmer: { $ref: '#/components/schemas/FarmerAppProfile' },
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
              description: 'Nomor telepon atau PIN salah',
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
      '/farmer-app/auth/change-pin': {
        post: {
          tags: ['Farmer App Auth'],
          summary: 'Ganti PIN',
          description: 'Mengganti PIN petani. Membutuhkan PIN lama yang benar.',
          security: [{ farmerBearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FarmerAppChangePinInput' },
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
              description: 'Belum login atau PIN lama salah',
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

      // ==================== Farmer App ====================
      '/farmer-app/profile': {
        get: {
          tags: ['Farmer App'],
          summary: 'Profil petani',
          description: 'Mengembalikan profil petani yang sedang login beserta ringkasan dompet dan statistik.',
          security: [{ farmerBearerAuth: [] }],
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
                          data: {
                            allOf: [
                              { $ref: '#/components/schemas/FarmerAppProfile' },
                              {
                                type: 'object',
                                properties: {
                                  wallet: {
                                    type: 'object',
                                    nullable: true,
                                    properties: {
                                      id: { type: 'string', format: 'uuid' },
                                      available_balance: { type: 'number' },
                                      held_balance: { type: 'number' },
                                      total_paid: { type: 'number' },
                                    },
                                  },
                                  stats: {
                                    type: 'object',
                                    properties: {
                                      total_sales: { type: 'integer' },
                                      total_disputes: { type: 'integer' },
                                    },
                                  },
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
        patch: {
          tags: ['Farmer App'],
          summary: 'Ubah profil petani',
          description: 'Memperbarui profil petani yang sedang login.',
          security: [{ farmerBearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    address: { type: 'string' },
                    village: { type: 'string' },
                    photo_url: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Profil berhasil diperbarui',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/FarmerAppProfile' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
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
      '/farmer-app/sales': {
        get: {
          tags: ['Farmer App'],
          summary: 'Daftar penjualan petani',
          description: 'Mengembalikan daftar penjualan milik petani yang sedang login.',
          security: [{ farmerBearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10, maximum: 50 },
              description: 'Jumlah data per halaman (maks 50)',
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter status penjualan',
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
          },
        },
      },
      '/farmer-app/sales/{id}': {
        get: {
          tags: ['Farmer App'],
          summary: 'Detail penjualan petani',
          description: 'Mengembalikan detail penjualan beserta foto dan hasil QC terbaru.',
          security: [{ farmerBearerAuth: [] }],
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
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/farmer-app/wallet': {
        get: {
          tags: ['Farmer App'],
          summary: 'Saldo dompet',
          description: 'Mengembalikan ringkasan saldo dompet petani yang sedang login.',
          security: [{ farmerBearerAuth: [] }],
          responses: {
            '200': {
              description: 'Ringkasan dompet',
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
                              id: { type: 'string', format: 'uuid', nullable: true },
                              available_balance: { type: 'number' },
                              held_balance: { type: 'number' },
                              total_paid: { type: 'number' },
                              cooperative: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  name: { type: 'string' },
                                },
                              },
                              created_at: { type: 'string', format: 'date-time', nullable: true },
                              updated_at: { type: 'string', format: 'date-time', nullable: true },
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
      '/farmer-app/wallet/mutations': {
        get: {
          tags: ['Farmer App'],
          summary: 'Riwayat mutasi dompet',
          description: 'Mengembalikan riwayat mutasi dompet petani yang sedang login.',
          security: [{ farmerBearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            {
              name: 'mutation_type',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter jenis mutasi',
            },
          ],
          responses: {
            '200': {
              description: 'Riwayat mutasi',
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
                                mutation_type: { type: 'string' },
                                reference_type: { type: 'string', nullable: true },
                                reference_id: { type: 'string', nullable: true },
                                amount_in: { type: 'number' },
                                amount_out: { type: 'number' },
                                balance_before: { type: 'number' },
                                balance_after: { type: 'number' },
                                notes: { type: 'string', nullable: true },
                                created_at: { type: 'string', format: 'date-time' },
                              },
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
          },
        },
      },
      '/farmer-app/payouts': {
        get: {
          tags: ['Farmer App'],
          summary: 'Riwayat pembayaran',
          description: 'Mengembalikan riwayat pembayaran untuk petani yang sedang login.',
          security: [{ farmerBearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter status pembayaran',
            },
          ],
          responses: {
            '200': {
              description: 'Riwayat pembayaran',
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
                                payout_number: { type: 'string' },
                                amount: { type: 'number' },
                                payout_method: { type: 'string' },
                                transfer_reference: { type: 'string', nullable: true },
                                status: { type: 'string' },
                                paid_at: { type: 'string', format: 'date-time', nullable: true },
                                created_at: { type: 'string', format: 'date-time' },
                                cooperative: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    name: { type: 'string' },
                                  },
                                },
                              },
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
          },
        },
      },
      '/farmer-app/disputes': {
        get: {
          tags: ['Farmer App'],
          summary: 'Daftar keberatan petani',
          description: 'Mengembalikan daftar keberatan yang diajukan oleh petani yang sedang login.',
          security: [{ farmerBearerAuth: [] }],
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
          },
        },
        post: {
          tags: ['Farmer App'],
          summary: 'Ajukan keberatan',
          description:
            'Mengajukan keberatan untuk penjualan tertentu. Tidak dapat mengajukan keberatan duplikat untuk penjualan yang sama.',
          security: [{ farmerBearerAuth: [] }],
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
                    farmer_note: { type: 'string' },
                  },
                },
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
                          data: { $ref: '#/components/schemas/Dispute' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
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
      '/farmer-app/notifications': {
        get: {
          tags: ['Farmer App'],
          summary: 'Daftar notifikasi',
          description: 'Mengembalikan daftar notifikasi untuk petani yang sedang login. Meta menyertakan jumlah belum dibaca.',
          security: [{ farmerBearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            {
              name: 'unread',
              in: 'query',
              schema: { type: 'string', enum: ['true'] },
              description: 'Hanya tampilkan notifikasi belum dibaca',
            },
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
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', format: 'uuid' },
                                title: { type: 'string' },
                                body: { type: 'string' },
                                type: { type: 'string' },
                                reference_type: { type: 'string', nullable: true },
                                reference_id: { type: 'string', nullable: true },
                                is_read: { type: 'boolean' },
                                created_at: { type: 'string', format: 'date-time' },
                              },
                            },
                          },
                          meta: {
                            allOf: [
                              { $ref: '#/components/schemas/PaginationMeta' },
                              {
                                type: 'object',
                                properties: {
                                  unread_count: { type: 'integer' },
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
        patch: {
          tags: ['Farmer App'],
          summary: 'Tandai notifikasi dibaca',
          description:
            'Menandai notifikasi sebagai sudah dibaca. Jika notification_ids diberikan, hanya menandai ID tersebut. Jika tidak, menandai semua notifikasi.',
          security: [{ farmerBearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notification_ids: {
                      type: 'array',
                      items: { type: 'string', format: 'uuid' },
                      description: 'ID notifikasi yang akan ditandai. Kosongkan untuk menandai semua.',
                    },
                  },
                },
              },
            },
          },
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
                              message: { type: 'string', example: 'Notifikasi berhasil ditandai sebagai dibaca.' },
                              count: { type: 'integer', description: 'Jumlah notifikasi yang ditandai' },
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
    },

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT yang didapat dari endpoint login admin.',
        },
        farmerBearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT yang didapat dari endpoint login aplikasi petani (Karya Taniku).',
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
        FarmerAppRegisterInput: {
          type: 'object',
          required: ['phone', 'pin'],
          properties: {
            phone: {
              type: 'string',
              minLength: 10,
              maxLength: 15,
              example: '081234567890',
              description: 'Nomor telepon yang terdaftar di sistem koperasi',
            },
            pin: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              example: '123456',
              description: 'PIN 6 digit untuk login',
            },
          },
        },
        FarmerAppLoginInput: {
          type: 'object',
          required: ['phone', 'pin'],
          properties: {
            phone: { type: 'string', example: '081234567890' },
            pin: { type: 'string', pattern: '^[0-9]{6}$', example: '123456' },
          },
        },
        FarmerAppChangePinInput: {
          type: 'object',
          required: ['current_pin', 'new_pin'],
          properties: {
            current_pin: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              example: '123456',
              description: 'PIN saat ini',
            },
            new_pin: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              example: '654321',
              description: 'PIN baru (6 digit)',
            },
          },
        },
        FarmerAppProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            farmer_number: { type: 'string', example: 'PTN-001' },
            name: { type: 'string', example: 'Budi Santoso' },
            phone: { type: 'string' },
            nik: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            village: { type: 'string', nullable: true },
            seller_type: { type: 'string' },
            photo_url: { type: 'string', nullable: true },
            verification_status: { type: 'string' },
            status: { type: 'string' },
            app_activated_at: { type: 'string', format: 'date-time', nullable: true },
            cooperative: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
                address: { type: 'string', nullable: true },
                status: { type: 'string' },
              },
            },
          },
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
