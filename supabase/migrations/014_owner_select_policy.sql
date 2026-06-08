-- Add a SELECT policy for owners to read their own record.
-- Without this, owner dashboard queries on the owners table return empty
-- because RLS blocks non-admin users from reading owners entirely.
CREATE POLICY owner_own_owners ON owners
  FOR SELECT
  USING (user_id = auth.uid());
