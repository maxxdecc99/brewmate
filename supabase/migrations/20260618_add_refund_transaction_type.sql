-- Add 'refund' to the allowed transaction types.
-- Used to log generation failures (AI error, unparseable response) so there
-- is an audit trail even when no credit was charged.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('purchase', 'used', 'bonus', 'admin_adjustment', 'refund'));
