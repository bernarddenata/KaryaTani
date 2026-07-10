-- CreateTable
CREATE TABLE "KaryaTani_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "KaryaTani_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_cooperatives" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT,
    "city" TEXT,
    "district" TEXT,
    "village" TEXT,
    "address" TEXT,
    "legal_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_cooperatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_farmers" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "farmer_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nik" TEXT,
    "address" TEXT,
    "village" TEXT,
    "seller_type" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'BELUM_DIVERIFIKASI',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_farmer_representatives" (
    "id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "relationship_type" TEXT NOT NULL,
    "identity_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_farmer_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_farmer_sources" (
    "id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "location" TEXT,
    "land_area" TEXT,
    "main_commodity_id" TEXT,
    "proof_file_id" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'BELUM_DIVERIFIKASI',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_farmer_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_commodities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "default_unit" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_commodities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_commodity_variants" (
    "id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_commodity_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_price_lists" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_price_list_items" (
    "id" TEXT NOT NULL,
    "price_list_id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "commodity_variant_id" TEXT,
    "grade_name" TEXT NOT NULL,
    "grade_code" TEXT NOT NULL,
    "price_per_unit" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "is_reject" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_qc_templates" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "commodity_id" TEXT NOT NULL,
    "commodity_variant_id" TEXT,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_qc_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_qc_template_items" (
    "id" TEXT NOT NULL,
    "qc_template_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_code" TEXT NOT NULL,
    "input_type" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "requires_proof" BOOLEAN NOT NULL DEFAULT false,
    "options_json" JSONB,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "help_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_qc_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_farmer_sales" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "representative_id" TEXT,
    "commodity_id" TEXT NOT NULL,
    "commodity_variant_id" TEXT,
    "price_list_id" TEXT,
    "qc_template_id" TEXT,
    "sale_number" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "initial_weight" DECIMAL(65,30),
    "received_weight" DECIMAL(65,30),
    "total_amount" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "received_by_user_id" TEXT,
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_farmer_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_farmer_sale_photos" (
    "id" TEXT NOT NULL,
    "farmer_sale_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "photo_type" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_farmer_sale_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_qc_results" (
    "id" TEXT NOT NULL,
    "farmer_sale_id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "qc_template_id" TEXT NOT NULL,
    "qc_officer_user_id" TEXT,
    "recommended_grade_code" TEXT,
    "final_grade_code" TEXT,
    "total_weight_checked" DECIMAL(65,30),
    "final_accepted_weight" DECIMAL(65,30),
    "total_rejected_weight" DECIMAL(65,30),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_qc_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_qc_result_items" (
    "id" TEXT NOT NULL,
    "qc_result_id" TEXT NOT NULL,
    "qc_template_item_id" TEXT NOT NULL,
    "value_text" TEXT,
    "value_number" DOUBLE PRECISION,
    "value_json" JSONB,
    "notes" TEXT,
    "proof_file_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_qc_result_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_qc_grade_breakdowns" (
    "id" TEXT NOT NULL,
    "qc_result_id" TEXT NOT NULL,
    "grade_name" TEXT NOT NULL,
    "grade_code" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "price_per_unit" DECIMAL(65,30),
    "estimated_amount" DECIMAL(65,30),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_qc_grade_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_farmer_wallets" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "available_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "held_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_farmer_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_farmer_wallet_mutations" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "mutation_type" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "amount_in" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "amount_out" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balance_before" DECIMAL(65,30) NOT NULL,
    "balance_after" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_farmer_wallet_mutations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_farmer_payouts" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "payout_number" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payout_method" TEXT NOT NULL,
    "transfer_reference" TEXT,
    "proof_file_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BELUM_DIBAYAR',
    "paid_by_user_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_farmer_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_disputes" (
    "id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "farmer_sale_id" TEXT NOT NULL,
    "qc_result_id" TEXT,
    "dispute_number" TEXT NOT NULL,
    "reason_category" TEXT NOT NULL,
    "farmer_note" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DIKIRIM',
    "reviewed_by_user_id" TEXT,
    "manager_decision" TEXT,
    "resolution_note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_files" (
    "id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_provider" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "farmer_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "source_client" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_users_email_key" ON "KaryaTani_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_roles_code_key" ON "KaryaTani_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_permissions_code_key" ON "KaryaTani_permissions"("code");

-- CreateIndex
CREATE INDEX "KaryaTani_role_permissions_role_id_idx" ON "KaryaTani_role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "KaryaTani_role_permissions_permission_id_idx" ON "KaryaTani_role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "KaryaTani_user_roles_user_id_idx" ON "KaryaTani_user_roles"("user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_user_roles_role_id_idx" ON "KaryaTani_user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_cooperatives_code_key" ON "KaryaTani_cooperatives"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_farmers_farmer_number_key" ON "KaryaTani_farmers"("farmer_number");

-- CreateIndex
CREATE INDEX "KaryaTani_farmers_cooperative_id_idx" ON "KaryaTani_farmers"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_representatives_farmer_id_idx" ON "KaryaTani_farmer_representatives"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sources_farmer_id_idx" ON "KaryaTani_farmer_sources"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sources_main_commodity_id_idx" ON "KaryaTani_farmer_sources"("main_commodity_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sources_proof_file_id_idx" ON "KaryaTani_farmer_sources"("proof_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_commodities_code_key" ON "KaryaTani_commodities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_commodity_variants_code_key" ON "KaryaTani_commodity_variants"("code");

-- CreateIndex
CREATE INDEX "KaryaTani_commodity_variants_commodity_id_idx" ON "KaryaTani_commodity_variants"("commodity_id");

-- CreateIndex
CREATE INDEX "KaryaTani_price_lists_cooperative_id_idx" ON "KaryaTani_price_lists"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_price_list_items_price_list_id_idx" ON "KaryaTani_price_list_items"("price_list_id");

-- CreateIndex
CREATE INDEX "KaryaTani_price_list_items_commodity_id_idx" ON "KaryaTani_price_list_items"("commodity_id");

-- CreateIndex
CREATE INDEX "KaryaTani_price_list_items_commodity_variant_id_idx" ON "KaryaTani_price_list_items"("commodity_variant_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_templates_cooperative_id_idx" ON "KaryaTani_qc_templates"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_templates_commodity_id_idx" ON "KaryaTani_qc_templates"("commodity_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_templates_commodity_variant_id_idx" ON "KaryaTani_qc_templates"("commodity_variant_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_template_items_qc_template_id_idx" ON "KaryaTani_qc_template_items"("qc_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_farmer_sales_sale_number_key" ON "KaryaTani_farmer_sales"("sale_number");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sales_cooperative_id_idx" ON "KaryaTani_farmer_sales"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sales_farmer_id_idx" ON "KaryaTani_farmer_sales"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sales_representative_id_idx" ON "KaryaTani_farmer_sales"("representative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sales_commodity_id_idx" ON "KaryaTani_farmer_sales"("commodity_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sales_commodity_variant_id_idx" ON "KaryaTani_farmer_sales"("commodity_variant_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sales_price_list_id_idx" ON "KaryaTani_farmer_sales"("price_list_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sales_qc_template_id_idx" ON "KaryaTani_farmer_sales"("qc_template_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sales_received_by_user_id_idx" ON "KaryaTani_farmer_sales"("received_by_user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sale_photos_farmer_sale_id_idx" ON "KaryaTani_farmer_sale_photos"("farmer_sale_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sale_photos_file_id_idx" ON "KaryaTani_farmer_sale_photos"("file_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_sale_photos_uploaded_by_user_id_idx" ON "KaryaTani_farmer_sale_photos"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_results_farmer_sale_id_idx" ON "KaryaTani_qc_results"("farmer_sale_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_results_cooperative_id_idx" ON "KaryaTani_qc_results"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_results_farmer_id_idx" ON "KaryaTani_qc_results"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_results_qc_template_id_idx" ON "KaryaTani_qc_results"("qc_template_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_results_qc_officer_user_id_idx" ON "KaryaTani_qc_results"("qc_officer_user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_result_items_qc_result_id_idx" ON "KaryaTani_qc_result_items"("qc_result_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_result_items_qc_template_item_id_idx" ON "KaryaTani_qc_result_items"("qc_template_item_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_result_items_proof_file_id_idx" ON "KaryaTani_qc_result_items"("proof_file_id");

-- CreateIndex
CREATE INDEX "KaryaTani_qc_grade_breakdowns_qc_result_id_idx" ON "KaryaTani_qc_grade_breakdowns"("qc_result_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_wallets_cooperative_id_idx" ON "KaryaTani_farmer_wallets"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_wallets_farmer_id_idx" ON "KaryaTani_farmer_wallets"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_wallet_mutations_cooperative_id_idx" ON "KaryaTani_farmer_wallet_mutations"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_wallet_mutations_farmer_id_idx" ON "KaryaTani_farmer_wallet_mutations"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_wallet_mutations_wallet_id_idx" ON "KaryaTani_farmer_wallet_mutations"("wallet_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_wallet_mutations_created_by_user_id_idx" ON "KaryaTani_farmer_wallet_mutations"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_farmer_payouts_payout_number_key" ON "KaryaTani_farmer_payouts"("payout_number");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_payouts_cooperative_id_idx" ON "KaryaTani_farmer_payouts"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_payouts_farmer_id_idx" ON "KaryaTani_farmer_payouts"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_payouts_wallet_id_idx" ON "KaryaTani_farmer_payouts"("wallet_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_payouts_proof_file_id_idx" ON "KaryaTani_farmer_payouts"("proof_file_id");

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_payouts_paid_by_user_id_idx" ON "KaryaTani_farmer_payouts"("paid_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_disputes_dispute_number_key" ON "KaryaTani_disputes"("dispute_number");

-- CreateIndex
CREATE INDEX "KaryaTani_disputes_cooperative_id_idx" ON "KaryaTani_disputes"("cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_disputes_farmer_id_idx" ON "KaryaTani_disputes"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_disputes_farmer_sale_id_idx" ON "KaryaTani_disputes"("farmer_sale_id");

-- CreateIndex
CREATE INDEX "KaryaTani_disputes_qc_result_id_idx" ON "KaryaTani_disputes"("qc_result_id");

-- CreateIndex
CREATE INDEX "KaryaTani_disputes_reviewed_by_user_id_idx" ON "KaryaTani_disputes"("reviewed_by_user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_files_uploaded_by_user_id_idx" ON "KaryaTani_files"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_notifications_user_id_idx" ON "KaryaTani_notifications"("user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_notifications_farmer_id_idx" ON "KaryaTani_notifications"("farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_audit_logs_actor_user_id_idx" ON "KaryaTani_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_audit_logs_entity_type_entity_id_idx" ON "KaryaTani_audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "KaryaTani_role_permissions" ADD CONSTRAINT "KaryaTani_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "KaryaTani_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_role_permissions" ADD CONSTRAINT "KaryaTani_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "KaryaTani_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_user_roles" ADD CONSTRAINT "KaryaTani_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "KaryaTani_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_user_roles" ADD CONSTRAINT "KaryaTani_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "KaryaTani_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmers" ADD CONSTRAINT "KaryaTani_farmers_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_representatives" ADD CONSTRAINT "KaryaTani_farmer_representatives_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sources" ADD CONSTRAINT "KaryaTani_farmer_sources_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sources" ADD CONSTRAINT "KaryaTani_farmer_sources_main_commodity_id_fkey" FOREIGN KEY ("main_commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sources" ADD CONSTRAINT "KaryaTani_farmer_sources_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "KaryaTani_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_commodity_variants" ADD CONSTRAINT "KaryaTani_commodity_variants_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_price_lists" ADD CONSTRAINT "KaryaTani_price_lists_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_price_list_items" ADD CONSTRAINT "KaryaTani_price_list_items_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "KaryaTani_price_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_price_list_items" ADD CONSTRAINT "KaryaTani_price_list_items_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_price_list_items" ADD CONSTRAINT "KaryaTani_price_list_items_commodity_variant_id_fkey" FOREIGN KEY ("commodity_variant_id") REFERENCES "KaryaTani_commodity_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_templates" ADD CONSTRAINT "KaryaTani_qc_templates_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_templates" ADD CONSTRAINT "KaryaTani_qc_templates_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_templates" ADD CONSTRAINT "KaryaTani_qc_templates_commodity_variant_id_fkey" FOREIGN KEY ("commodity_variant_id") REFERENCES "KaryaTani_commodity_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_template_items" ADD CONSTRAINT "KaryaTani_qc_template_items_qc_template_id_fkey" FOREIGN KEY ("qc_template_id") REFERENCES "KaryaTani_qc_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sales" ADD CONSTRAINT "KaryaTani_farmer_sales_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sales" ADD CONSTRAINT "KaryaTani_farmer_sales_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sales" ADD CONSTRAINT "KaryaTani_farmer_sales_representative_id_fkey" FOREIGN KEY ("representative_id") REFERENCES "KaryaTani_farmer_representatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sales" ADD CONSTRAINT "KaryaTani_farmer_sales_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "KaryaTani_commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sales" ADD CONSTRAINT "KaryaTani_farmer_sales_commodity_variant_id_fkey" FOREIGN KEY ("commodity_variant_id") REFERENCES "KaryaTani_commodity_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sales" ADD CONSTRAINT "KaryaTani_farmer_sales_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "KaryaTani_price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sales" ADD CONSTRAINT "KaryaTani_farmer_sales_qc_template_id_fkey" FOREIGN KEY ("qc_template_id") REFERENCES "KaryaTani_qc_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sales" ADD CONSTRAINT "KaryaTani_farmer_sales_received_by_user_id_fkey" FOREIGN KEY ("received_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sale_photos" ADD CONSTRAINT "KaryaTani_farmer_sale_photos_farmer_sale_id_fkey" FOREIGN KEY ("farmer_sale_id") REFERENCES "KaryaTani_farmer_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sale_photos" ADD CONSTRAINT "KaryaTani_farmer_sale_photos_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "KaryaTani_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_sale_photos" ADD CONSTRAINT "KaryaTani_farmer_sale_photos_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_results" ADD CONSTRAINT "KaryaTani_qc_results_farmer_sale_id_fkey" FOREIGN KEY ("farmer_sale_id") REFERENCES "KaryaTani_farmer_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_results" ADD CONSTRAINT "KaryaTani_qc_results_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_results" ADD CONSTRAINT "KaryaTani_qc_results_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_results" ADD CONSTRAINT "KaryaTani_qc_results_qc_template_id_fkey" FOREIGN KEY ("qc_template_id") REFERENCES "KaryaTani_qc_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_results" ADD CONSTRAINT "KaryaTani_qc_results_qc_officer_user_id_fkey" FOREIGN KEY ("qc_officer_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_result_items" ADD CONSTRAINT "KaryaTani_qc_result_items_qc_result_id_fkey" FOREIGN KEY ("qc_result_id") REFERENCES "KaryaTani_qc_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_result_items" ADD CONSTRAINT "KaryaTani_qc_result_items_qc_template_item_id_fkey" FOREIGN KEY ("qc_template_item_id") REFERENCES "KaryaTani_qc_template_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_result_items" ADD CONSTRAINT "KaryaTani_qc_result_items_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "KaryaTani_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_qc_grade_breakdowns" ADD CONSTRAINT "KaryaTani_qc_grade_breakdowns_qc_result_id_fkey" FOREIGN KEY ("qc_result_id") REFERENCES "KaryaTani_qc_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_wallets" ADD CONSTRAINT "KaryaTani_farmer_wallets_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_wallets" ADD CONSTRAINT "KaryaTani_farmer_wallets_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_wallet_mutations" ADD CONSTRAINT "KaryaTani_farmer_wallet_mutations_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_wallet_mutations" ADD CONSTRAINT "KaryaTani_farmer_wallet_mutations_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_wallet_mutations" ADD CONSTRAINT "KaryaTani_farmer_wallet_mutations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "KaryaTani_farmer_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_wallet_mutations" ADD CONSTRAINT "KaryaTani_farmer_wallet_mutations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_payouts" ADD CONSTRAINT "KaryaTani_farmer_payouts_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_payouts" ADD CONSTRAINT "KaryaTani_farmer_payouts_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_payouts" ADD CONSTRAINT "KaryaTani_farmer_payouts_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "KaryaTani_farmer_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_payouts" ADD CONSTRAINT "KaryaTani_farmer_payouts_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "KaryaTani_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_payouts" ADD CONSTRAINT "KaryaTani_farmer_payouts_paid_by_user_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_disputes" ADD CONSTRAINT "KaryaTani_disputes_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_disputes" ADD CONSTRAINT "KaryaTani_disputes_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_disputes" ADD CONSTRAINT "KaryaTani_disputes_farmer_sale_id_fkey" FOREIGN KEY ("farmer_sale_id") REFERENCES "KaryaTani_farmer_sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_disputes" ADD CONSTRAINT "KaryaTani_disputes_qc_result_id_fkey" FOREIGN KEY ("qc_result_id") REFERENCES "KaryaTani_qc_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_disputes" ADD CONSTRAINT "KaryaTani_disputes_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_files" ADD CONSTRAINT "KaryaTani_files_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_notifications" ADD CONSTRAINT "KaryaTani_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_notifications" ADD CONSTRAINT "KaryaTani_notifications_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_audit_logs" ADD CONSTRAINT "KaryaTani_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
