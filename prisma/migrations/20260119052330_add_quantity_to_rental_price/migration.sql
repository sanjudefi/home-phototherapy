-- AlterTable
ALTER TABLE "equipment_rental_prices" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "quantity_in_use" INTEGER NOT NULL DEFAULT 0;
