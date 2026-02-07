-- 003_create_fuel_types_table.up.sql
CREATE TABLE IF NOT EXISTS fuel_types (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  color_code VARCHAR(7),
  display_order INT NOT NULL
);

-- Insert default fuel types
INSERT INTO fuel_types (id, name, display_name, description, color_code, display_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'E10', 'E10', 'Petrol E10', '#90EE90', 1),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'UNLEADED_91', 'Unleaded 91', 'Unleaded Petrol', '#87CEEB', 2),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'DIESEL', 'Diesel', 'Diesel Fuel', '#FFD700', 3),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'PREMIUM_DIESEL', 'Premium Diesel', 'Premium Diesel', '#FFA500', 4),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'U95', 'U95', 'Unleaded 95', '#87CEEB', 5),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'U98', 'U98', 'Unleaded 98', '#4169E1', 6),
  ('550e8400-e29b-41d4-a716-446655440007'::uuid, 'LPG', 'LPG', 'Liquefied Petroleum Gas', '#FF69B4', 7),
  ('550e8400-e29b-41d4-a716-446655440008'::uuid, 'TRUCK_DIESEL', 'Truck Diesel', 'Truck Diesel', '#8B4513', 8),
  ('550e8400-e29b-41d4-a716-446655440009'::uuid, 'ADBLUE', 'AdBlue', 'Diesel Exhaust Fluid', '#00CED1', 9),
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, 'E85', 'E85', 'Ethanol Blend', '#228B22', 10),
  ('550e8400-e29b-41d4-a716-446655440011'::uuid, 'BIODIESEL', 'Biodiesel', 'Biodiesel', '#00FF00', 11);
