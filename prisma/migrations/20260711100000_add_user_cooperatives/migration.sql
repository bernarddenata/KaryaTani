-- CreateTable
CREATE TABLE "KaryaTani_user_cooperatives" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "assignment_type" TEXT NOT NULL DEFAULT 'PEGAWAI',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_user_cooperatives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_user_cooperatives_user_id_cooperative_id_key" ON "KaryaTani_user_cooperatives"("user_id", "cooperative_id");

-- CreateIndex
CREATE INDEX "KaryaTani_user_cooperatives_user_id_idx" ON "KaryaTani_user_cooperatives"("user_id");

-- CreateIndex
CREATE INDEX "KaryaTani_user_cooperatives_cooperative_id_idx" ON "KaryaTani_user_cooperatives"("cooperative_id");

-- AddForeignKey
ALTER TABLE "KaryaTani_user_cooperatives" ADD CONSTRAINT "KaryaTani_user_cooperatives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "KaryaTani_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_user_cooperatives" ADD CONSTRAINT "KaryaTani_user_cooperatives_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES "KaryaTani_cooperatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
