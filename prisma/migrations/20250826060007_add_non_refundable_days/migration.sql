/*
  Warnings:

  - You are about to drop the column `about_host` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `host_name` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `is_host` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `is_neighborhood` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `is_property` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood_details` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `property_details` on the `packages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "packages" DROP COLUMN "about_host",
DROP COLUMN "host_name",
DROP COLUMN "is_host",
DROP COLUMN "is_neighborhood",
DROP COLUMN "is_property",
DROP COLUMN "neighborhood_details",
DROP COLUMN "property_details",
ADD COLUMN     "non_refundable_days" JSONB;

-- CreateTable
CREATE TABLE "user_documents" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" TEXT,
    "user_id" TEXT,
    "type" TEXT,
    "file_type" TEXT,
    "file_path" TEXT,
    "file_name" TEXT,

    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
