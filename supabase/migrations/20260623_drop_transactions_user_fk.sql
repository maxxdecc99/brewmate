-- Drop the FK on transactions.user_id so transaction rows persist as an
-- immutable audit trail when a user deletes their account.
-- Profiles still cascade-delete from auth.users; transactions become orphaned
-- UUID rows intentionally — they are the financial record of what happened.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
