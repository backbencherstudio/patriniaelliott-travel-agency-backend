-- AlterTable
ALTER TABLE "property_calendars" ADD COLUMN     "price" INTEGER;

-- CreateTable
CREATE TABLE "PackagePricingRule" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "weekend_price" INTEGER NOT NULL,
    "flat_discount" INTEGER NOT NULL,
    "weekly_discount_pct" INTEGER NOT NULL,
    "weekend_days" JSONB NOT NULL,
    "min_stay_nights" INTEGER NOT NULL,
    "max_stay_nights" INTEGER NOT NULL,
    "advance_notice_hours" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagePricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackagePricingRule_package_id_key" ON "PackagePricingRule"("package_id");

-- AddForeignKey
ALTER TABLE "PackagePricingRule" ADD CONSTRAINT "PackagePricingRule_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
