-- CreateTable
CREATE TABLE "KaryaTani_warehouses" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_warehouse_locations" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location_type" TEXT NOT NULL DEFAULT 'LAINNYA',
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_stock_balances" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "commodity_variant_id" TEXT,
    "grade_code" TEXT,
    "grade_name" TEXT,
    "batch_number" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_stock_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_stock_movements" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "commodity_variant_id" TEXT,
    "grade_code" TEXT,
    "grade_name" TEXT,
    "batch_number" TEXT,
    "unit" TEXT NOT NULL,
    "movement_type" TEXT NOT NULL,
    "quantity_in" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantity_out" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balance_before" DECIMAL(65,30) NOT NULL,
    "balance_after" DECIMAL(65,30) NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "notes" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_stock_adjustments" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "commodity_variant_id" TEXT,
    "grade_code" TEXT,
    "grade_name" TEXT,
    "batch_number" TEXT,
    "adjustment_number" TEXT NOT NULL,
    "adjustment_type" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "proof_file_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIKIRIM',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_stock_disposals" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "commodity_variant_id" TEXT,
    "grade_code" TEXT,
    "grade_name" TEXT,
    "batch_number" TEXT,
    "disposal_number" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "proof_file_id" TEXT,
    "disposal_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DIKIRIM',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_stock_disposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_stock_deliveries" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "commodity_variant_id" TEXT,
    "grade_code" TEXT,
    "grade_name" TEXT,
    "batch_number" TEXT,
    "delivery_number" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "destination_type" TEXT NOT NULL,
    "destination_name" TEXT NOT NULL,
    "delivery_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "document_file_id" TEXT,
    "proof_file_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIKIRIM',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_stock_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KaryaTani_warehouses_cooperative_id_idx" ON "KaryaTani_warehouses"("cooperative_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_warehouses_cooperative_id_code_key" ON "KaryaTani_warehouses"("cooperative_id", "code");

-- CreateIndex
CREATE INDEX "KaryaTani_warehouse_locations_warehouse_id_idx" ON "KaryaTani_warehouse_locations"("warehouse_id");

-- CreateIndex
CREATE INDEX "KaryaTani_warehouse_locations_cooperative_id_idx" ON "KaryaTani_warehouse_locations"("cooperative_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_warehouse_locations_warehouse_id_code_key" ON "KaryaTani_warehouse_locations"("warehouse_id", "code");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_balances_cooperative_id_idx" ON "KaryaTani_stock_balances"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_balances_warehouse_id_idx" ON "KaryaTani_stock_balances"("warehouse_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_balances_location_id_idx" ON "KaryaTani_stock_balances"("location_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_balances_commodity_id_idx" ON "KaryaTani_stock_balances"("commodity_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_balances_batch_number_idx" ON "KaryaTani_stock_balances"("batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_stock_balances_cooperative_id_warehouse_id_locati_key" ON "KaryaTani_stock_balances"("cooperative_id", "warehouse_id", "location_id", "commodity_id", "commodity_variant_id", "grade_code", "batch_number", "unit");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_movements_cooperative_id_idx" ON "KaryaTani_stock_movements"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_movements_warehouse_id_idx" ON "KaryaTani_stock_movements"("warehouse_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_movements_location_id_idx" ON "KaryaTani_stock_movements"("location_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_movements_commodity_id_idx" ON "KaryaTani_stock_movements"("commodity_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_movements_batch_number_idx" ON "KaryaTani_stock_movements"("batch_number");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_movements_reference_type_reference_id_idx" ON "KaryaTani_stock_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_stock_adjustments_adjustment_number_key" ON "KaryaTani_stock_adjustments"("adjustment_number");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_adjustments_cooperative_id_idx" ON "KaryaTani_stock_adjustments"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_adjustments_warehouse_id_idx" ON "KaryaTani_stock_adjustments"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_stock_disposals_disposal_number_key" ON "KaryaTani_stock_disposals"("disposal_number");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_disposals_cooperative_id_idx" ON "KaryaTani_stock_disposals"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_disposals_warehouse_id_idx" ON "KaryaTani_stock_disposals"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_stock_deliveries_delivery_number_key" ON "KaryaTani_stock_deliveries"("delivery_number");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_deliveries_cooperative_id_idx" ON "KaryaTani_stock_deliveries"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_stock_deliveries_warehouse_id_idx" ON "KaryaTani_stock_deliveries"("warehouse_id");

-- AddForeignKey
ALTER TABLE "KaryaTani_warehouses" ADD CONSTRAINT "KaryaTani_warehouses_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_warehouse_locations" ADD CONSTRAINT "KaryaTani_warehouse_locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "KaryaTani_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_warehouse_locations" ADD CONSTRAINT "KaryaTani_warehouse_locations_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_balances" ADD CONSTRAINT "KaryaTani_stock_balances_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_balances" ADD CONSTRAINT "KaryaTani_stock_balances_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "KaryaTani_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_balances" ADD CONSTRAINT "KaryaTani_stock_balances_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "KaryaTani_warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_balances" ADD CONSTRAINT "KaryaTani_stock_balances_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_balances" ADD CONSTRAINT "KaryaTani_stock_balances_commodity_variant_id_fkey" FOREIGN KEY ("commodity_variant_id") REFERENCES "KaryaTani_commodity_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_movements" ADD CONSTRAINT "KaryaTani_stock_movements_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_movements" ADD CONSTRAINT "KaryaTani_stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "KaryaTani_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_movements" ADD CONSTRAINT "KaryaTani_stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "KaryaTani_warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_movements" ADD CONSTRAINT "KaryaTani_stock_movements_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_movements" ADD CONSTRAINT "KaryaTani_stock_movements_commodity_variant_id_fkey" FOREIGN KEY ("commodity_variant_id") REFERENCES "KaryaTani_commodity_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_movements" ADD CONSTRAINT "KaryaTani_stock_movements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_adjustments" ADD CONSTRAINT "KaryaTani_stock_adjustments_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_adjustments" ADD CONSTRAINT "KaryaTani_stock_adjustments_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "KaryaTani_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_adjustments" ADD CONSTRAINT "KaryaTani_stock_adjustments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "KaryaTani_warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_adjustments" ADD CONSTRAINT "KaryaTani_stock_adjustments_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_adjustments" ADD CONSTRAINT "KaryaTani_stock_adjustments_commodity_variant_id_fkey" FOREIGN KEY ("commodity_variant_id") REFERENCES "KaryaTani_commodity_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_adjustments" ADD CONSTRAINT "KaryaTani_stock_adjustments_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "KaryaTani_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_adjustments" ADD CONSTRAINT "KaryaTani_stock_adjustments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_disposals" ADD CONSTRAINT "KaryaTani_stock_disposals_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_disposals" ADD CONSTRAINT "KaryaTani_stock_disposals_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "KaryaTani_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_disposals" ADD CONSTRAINT "KaryaTani_stock_disposals_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "KaryaTani_warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_disposals" ADD CONSTRAINT "KaryaTani_stock_disposals_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_disposals" ADD CONSTRAINT "KaryaTani_stock_disposals_commodity_variant_id_fkey" FOREIGN KEY ("commodity_variant_id") REFERENCES "KaryaTani_commodity_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_disposals" ADD CONSTRAINT "KaryaTani_stock_disposals_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "KaryaTani_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_disposals" ADD CONSTRAINT "KaryaTani_stock_disposals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_deliveries" ADD CONSTRAINT "KaryaTani_stock_deliveries_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_deliveries" ADD CONSTRAINT "KaryaTani_stock_deliveries_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "KaryaTani_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_deliveries" ADD CONSTRAINT "KaryaTani_stock_deliveries_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "KaryaTani_warehouse_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_deliveries" ADD CONSTRAINT "KaryaTani_stock_deliveries_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_deliveries" ADD CONSTRAINT "KaryaTani_stock_deliveries_commodity_variant_id_fkey" FOREIGN KEY ("commodity_variant_id") REFERENCES "KaryaTani_commodity_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_deliveries" ADD CONSTRAINT "KaryaTani_stock_deliveries_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "KaryaTani_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_deliveries" ADD CONSTRAINT "KaryaTani_stock_deliveries_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "KaryaTani_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_stock_deliveries" ADD CONSTRAINT "KaryaTani_stock_deliveries_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

