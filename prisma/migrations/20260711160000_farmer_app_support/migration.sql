-- AlterTable
ALTER TABLE "KaryaTani_cooperatives" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "KaryaTani_farmer_devices" (
    "id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "device_token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'android',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KaryaTani_farmer_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KaryaTani_dispute_messages" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "sender_farmer_id" TEXT,
    "sender_user_id" TEXT,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryaTani_dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KaryaTani_farmer_devices_farmer_id_idx" ON "KaryaTani_farmer_devices"("farmer_id");

-- CreateIndex
CREATE UNIQUE INDEX "KaryaTani_farmer_devices_farmer_id_device_token_key" ON "KaryaTani_farmer_devices"("farmer_id", "device_token");

-- CreateIndex
CREATE INDEX "KaryaTani_dispute_messages_dispute_id_idx" ON "KaryaTani_dispute_messages"("dispute_id");

-- CreateIndex
CREATE INDEX "KaryaTani_dispute_messages_sender_farmer_id_idx" ON "KaryaTani_dispute_messages"("sender_farmer_id");

-- CreateIndex
CREATE INDEX "KaryaTani_dispute_messages_sender_user_id_idx" ON "KaryaTani_dispute_messages"("sender_user_id");

-- AddForeignKey
ALTER TABLE "KaryaTani_farmer_devices" ADD CONSTRAINT "KaryaTani_farmer_devices_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_dispute_messages" ADD CONSTRAINT "KaryaTani_dispute_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "KaryaTani_disputes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_dispute_messages" ADD CONSTRAINT "KaryaTani_dispute_messages_sender_farmer_id_fkey" FOREIGN KEY ("sender_farmer_id") REFERENCES "KaryaTani_farmers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KaryaTani_dispute_messages" ADD CONSTRAINT "KaryaTani_dispute_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "KaryaTani_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

