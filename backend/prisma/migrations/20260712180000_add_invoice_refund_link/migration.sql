-- AlterTable: link a REFUND invoice back to the original invoice it refunds
ALTER TABLE "Invoice" ADD COLUMN     "refundsInvoiceId" INTEGER;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_refundsInvoiceId_fkey" FOREIGN KEY ("refundsInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
