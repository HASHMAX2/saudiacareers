-- SA-06 hardening: the application-level duplicate-refund check in requestRefund
-- is a read-then-create and is not atomic, so two concurrent requests can both
-- pass it and both insert a REFUND_REQUESTED row against the same original
-- invoice (verified in testing). This partial unique index makes it impossible
-- at the database level for more than one open-or-completed refund row to exist
-- per original invoice, regardless of request timing.
CREATE UNIQUE INDEX "Invoice_open_or_completed_refund_per_original"
ON "Invoice" ("refundsInvoiceId")
WHERE "status" IN ('REFUND_REQUESTED', 'REFUNDED');
