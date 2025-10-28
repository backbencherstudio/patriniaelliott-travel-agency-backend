/*
  Warnings:

  - You are about to drop the `PackagePricingRule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PackagePricingRule" DROP CONSTRAINT "PackagePricingRule_package_id_fkey";

-- AlterTable
ALTER TABLE "property_calendars" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- DropTable
DROP TABLE "PackagePricingRule";

-- CreateTable
CREATE TABLE "package_pricing_rules" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "base_price" DECIMAL(65,30) NOT NULL,
    "weekend_price" DECIMAL(65,30) NOT NULL,
    "flat_discount" DECIMAL(65,30) NOT NULL,
    "weekly_discount_pct" DECIMAL(65,30),
    "weekend_days" INTEGER[],
    "min_stay_nights" INTEGER,
    "max_stay_nights" INTEGER,
    "advance_notice_hours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_pricing_rules_package_id_key" ON "package_pricing_rules"("package_id");

-- AddForeignKey
ALTER TABLE "package_pricing_rules" ADD CONSTRAINT "package_pricing_rules_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
