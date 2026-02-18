-- 015_add_contact_fields_to_station_owners.down.sql
ALTER TABLE station_owners
  DROP COLUMN IF EXISTS contact_name,
  DROP COLUMN IF EXISTS contact_email,
  DROP COLUMN IF EXISTS contact_phone;
