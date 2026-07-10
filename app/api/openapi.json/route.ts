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
      { name: 'Commodities', description: 'Manajemen komoditas' },
    ],
    paths: {
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
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Daftar pengguna',
          description: 'Mengembalikan daftar pengguna dengan paginasi.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Nomor halaman',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10, maximum: 100 },
              description: 'Jumlah data per halaman',
            },
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
      },
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
      },
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
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT yang didapat dari endpoint login.',
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
