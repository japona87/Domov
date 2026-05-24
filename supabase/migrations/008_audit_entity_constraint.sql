-- Remove the hard-coded entity CHECK constraint so new entity types
-- (feature_config, property_photo, system_config) can be logged.
-- Type safety is enforced at the TypeScript layer via the AuditEntity union.

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_entity_check;
