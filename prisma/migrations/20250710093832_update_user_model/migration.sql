-- AlterTable
ALTER TABLE "users" ADD COLUMN     "apt_suite_unit" TEXT,
ADD COLUMN     "display_name" VARCHAR(255),
ADD COLUMN     "nationality" VARCHAR(255),
ADD COLUMN     "passport_expiry_date" DATE,
ADD COLUMN     "passport_first_name" TEXT,
ADD COLUMN     "passport_issuing_country" TEXT,
ADD COLUMN     "passport_last_name" TEXT,
ADD COLUMN     "passport_number" TEXT,
ADD COLUMN     "street_address" TEXT;
