/*
  Warnings:

  - You are about to alter the column `price` on the `booking_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `description` on the `destinations` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `withdrawals` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - A unique constraint covering the columns `[booking_id]` on the table `booking_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference_number]` on the table `payment_transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference_number,type,status]` on the table `payment_transactions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `booking_id` on table `booking_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `booking_items` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "booking_items" DROP CONSTRAINT "booking_items_booking_id_fkey";

-- AlterTable
ALTER TABLE "booking_items" ALTER COLUMN "booking_id" SET NOT NULL,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "destinations" DROP COLUMN "description",
ADD COLUMN     "country_name" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "package_trip_plans" ADD COLUMN     "ticket_free" TEXT,
ADD COLUMN     "time" TEXT;

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "discount" INTEGER,
ADD COLUMN     "extra_services" JSONB,
ADD COLUMN     "language" JSONB,
ADD COLUMN     "meting_points" TEXT,
ADD COLUMN     "total_bedrooms" INTEGER,
ADD COLUMN     "tour_type" TEXT;

-- AlterTable
ALTER TABLE "withdrawals" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "package_policies" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" SMALLINT DEFAULT 1,
    "package_policies" JSONB,
    "description" TEXT,

    CONSTRAINT "package_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PackageToPackagePolicy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageToPackagePolicy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PackageToPackagePolicy_B_index" ON "_PackageToPackagePolicy"("B");

-- CreateIndex
CREATE UNIQUE INDEX "booking_items_booking_id_key" ON "booking_items"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_reference_number_key" ON "payment_transactions"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_reference_number_type_status_key" ON "payment_transactions"("reference_number", "type", "status");

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageToPackagePolicy" ADD CONSTRAINT "_PackageToPackagePolicy_A_fkey" FOREIGN KEY ("A") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageToPackagePolicy" ADD CONSTRAINT "_PackageToPackagePolicy_B_fkey" FOREIGN KEY ("B") REFERENCES "package_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
