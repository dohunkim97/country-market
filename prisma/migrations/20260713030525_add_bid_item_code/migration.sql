-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "itemCode" TEXT;

-- CreateIndex
CREATE INDEX "Bid_itemName_idx" ON "Bid"("itemName");
