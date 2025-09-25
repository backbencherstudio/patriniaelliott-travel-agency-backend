/*
  Warnings:

  - The `bedrooms` column on the `package_room_types` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bedrooms` column on the `packages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `billing_apt_suite_unit` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `billing_city` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `billing_country` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `billing_state` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `billing_street_address` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `billing_zip_code` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `card_number` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `cvv` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_month` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_year` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `user_cards` table. All the data in the column will be lost.
  - You are about to drop the column `file_name` on the `user_documents` table. All the data in the column will be lost.
  - You are about to drop the column `file_path` on the `user_documents` table. All the data in the column will be lost.
  - You are about to drop the column `file_type` on the `user_documents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_payment_method_id]` on the table `user_cards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customer_id` to the `user_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripe_payment_method_id` to the `user_cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "package_room_types" DROP COLUMN "bedrooms",
ADD COLUMN     "bedrooms" JSONB;

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "bedrooms",
ADD COLUMN     "bedrooms" JSONB;

-- AlterTable
ALTER TABLE "user_cards" DROP COLUMN "billing_apt_suite_unit",
DROP COLUMN "billing_city",
DROP COLUMN "billing_country",
DROP COLUMN "billing_state",
DROP COLUMN "billing_street_address",
DROP COLUMN "billing_zip_code",
DROP COLUMN "card_number",
DROP COLUMN "created_at",
DROP COLUMN "cvv",
DROP COLUMN "deleted_at",
DROP COLUMN "expiry_month",
DROP COLUMN "expiry_year",
DROP COLUMN "status",
DROP COLUMN "updated_at",
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "customer_id" TEXT NOT NULL,
ADD COLUMN     "exp_month" INTEGER,
ADD COLUMN     "exp_year" INTEGER,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last4" TEXT,
ADD COLUMN     "stripe_payment_method_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_documents" DROP COLUMN "file_name",
DROP COLUMN "file_path",
DROP COLUMN "file_type",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "number" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripe_customer_id" TEXT;

-- CreateTable
CREATE TABLE "vendor_payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "vendor_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payment_methods_account_id_key" ON "vendor_payment_methods"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_cards_stripe_payment_method_id_key" ON "user_cards"("stripe_payment_method_id");

-- AddForeignKey
ALTER TABLE "vendor_payment_methods" ADD CONSTRAINT "vendor_payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
