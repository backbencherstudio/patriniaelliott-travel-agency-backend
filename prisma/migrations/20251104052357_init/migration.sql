/*
  Warnings:

  - A unique constraint covering the columns `[country_code]` on the table `countries` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `countries` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "countries" ALTER COLUMN "name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_code_key" ON "countries"("country_code");
