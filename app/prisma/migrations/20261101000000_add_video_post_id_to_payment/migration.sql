-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "videoPostId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_videoPostId_idx" ON "Payment"("videoPostId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_videoPostId_fkey" FOREIGN KEY ("videoPostId") REFERENCES "VideoPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
