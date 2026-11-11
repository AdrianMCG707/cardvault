/*
  Warnings:

  - A unique constraint covering the columns `[game,externalId]` on the table `Card` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `setId` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `printing` to the `Holding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `Holding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `PriceSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "number" TEXT,
ADD COLUMN     "setId" TEXT NOT NULL,
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Holding" ADD COLUMN     "printing" TEXT NOT NULL,
ADD COLUMN     "variantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PriceSnapshot" ADD COLUMN     "variantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Card_game_setId_idx" ON "Card"("game", "setId");

-- CreateIndex
CREATE UNIQUE INDEX "Card_game_externalId_key" ON "Card"("game", "externalId");

-- CreateIndex
CREATE INDEX "Holding_binderId_idx" ON "Holding"("binderId");

-- CreateIndex
CREATE INDEX "PriceSnapshot_variantId_capturedAt_idx" ON "PriceSnapshot"("variantId", "capturedAt");
