-- SA-02 defense-in-depth: the read-then-write race that let paidCreditsRemaining
-- go negative was already closed in application code (56872b7) with an atomic,
-- conditional `updateMany` guard. This constraint is the database-level backstop
-- the audit recommended on top of that fix — even a future regression in the
-- application-layer guard can no longer drive the balance below zero; any write
-- that would do so is rejected by Postgres outright instead of silently
-- succeeding.
ALTER TABLE "EmployerSubscription"
  ADD CONSTRAINT "EmployerSubscription_paidCreditsRemaining_non_negative"
  CHECK ("paidCreditsRemaining" >= 0);
