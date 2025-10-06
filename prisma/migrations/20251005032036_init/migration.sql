/*
  Warnings:

  - Added the required column `refund_reason` to the `RefundTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RefundTransaction" ADD COLUMN     "refund_reason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_documents" ADD COLUMN     "back_image" TEXT,
ADD COLUMN     "front_image" TEXT;
