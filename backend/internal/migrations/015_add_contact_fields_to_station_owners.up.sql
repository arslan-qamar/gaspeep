-- 015_add_contact_fields_to_station_owners.up.sql
-- Add structured contact fields to station_owners table
-- contact_name: primary contact person for the business
-- contact_email: business contact email (may differ from login users.email)
-- contact_phone: business phone number

ALTER TABLE station_owners
  ADD COLUMN IF NOT EXISTS contact_name  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
