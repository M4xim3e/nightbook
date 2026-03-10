-- FreshTrack Seed Data
-- Run this AFTER creating user accounts manually in Supabase Auth dashboard
-- Replace USER_ID_1 and USER_ID_2 with actual user UUIDs from auth.users

-- ============================================================
-- Create demo users via Supabase Dashboard or Auth API first,
-- then replace the UUIDs below
-- ============================================================

-- Demo Restaurant 1: Le Bistrot du Marché
INSERT INTO restaurants (id, name, owner_id, email, phone, subscription_status, subscription_plan, alert_email_enabled, alert_sms_enabled, alert_days_before, alert_hour)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Le Bistrot du Marché',
  '00000000-0000-0000-0000-000000000001', -- Replace with real user UUID
  'contact@bistrot-marche.fr',
  '+33 6 12 34 56 78',
  'active',
  'pro',
  true,
  false,
  2,
  8
) ON CONFLICT (id) DO NOTHING;

-- Demo Restaurant 2: La Bonne Fourchette
INSERT INTO restaurants (id, name, owner_id, email, phone, subscription_status, subscription_plan, alert_email_enabled, alert_sms_enabled, alert_days_before, alert_hour)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'La Bonne Fourchette',
  '00000000-0000-0000-0000-000000000002', -- Replace with real user UUID
  'chef@labonnefourchette.fr',
  '+33 6 98 76 54 32',
  'trialing',
  NULL,
  true,
  false,
  2,
  8
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Products catalog for Restaurant 1
-- ============================================================
INSERT INTO products (restaurant_id, name, category, unit, default_shelf_life_days) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Filet de bœuf', 'viande', 'kg', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Saumon atlantique', 'poisson', 'kg', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tomates cerises', 'légumes', 'kg', 5),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fromage de chèvre', 'produits laitiers', 'unité', 7),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Huile d''olive extra vierge', 'épicerie', 'L', 365),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Vin rouge Bordeaux', 'boissons', 'bouteille', 365),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jambon de Bayonne', 'viande', 'kg', 10),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Crème fraîche', 'produits laitiers', 'L', 7),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Courgettes', 'légumes', 'kg', 5),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mousse au chocolat', 'autre', 'unité', 3);

-- Products catalog for Restaurant 2
INSERT INTO products (restaurant_id, name, category, unit, default_shelf_life_days) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Poulet fermier', 'viande', 'kg', 3),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Dorade royale', 'poisson', 'kg', 2),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Épinards frais', 'légumes', 'kg', 3),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Camembert', 'produits laitiers', 'unité', 14),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Farine de blé T55', 'épicerie', 'kg', 365),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Beurre AOP', 'produits laitiers', 'kg', 30),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Champignons de Paris', 'légumes', 'kg', 5),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Lait entier', 'produits laitiers', 'L', 10),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Eau minérale', 'boissons', 'bouteille', 730),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Sel de Guérande', 'épicerie', 'kg', 1825);

-- ============================================================
-- Stock entries with varying expiry dates for Restaurant 1
-- ============================================================

-- Expired product (2 days ago)
INSERT INTO stock_entries (restaurant_id, product_name, quantity, unit, category, delivery_date, expiry_date, supplier, invoice_number, is_consumed)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Saumon atlantique',
  5.5, 'kg', 'poisson',
  (CURRENT_DATE - INTERVAL '4 days'),
  (CURRENT_DATE - INTERVAL '2 days'),
  'Maison Dupont Marée', 'FAC-2025-001',
  false
);

-- Expiring today
INSERT INTO stock_entries (restaurant_id, product_name, quantity, unit, category, delivery_date, expiry_date, supplier, invoice_number, is_consumed)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Filet de bœuf',
  3.2, 'kg', 'viande',
  (CURRENT_DATE - INTERVAL '2 days'),
  CURRENT_DATE,
  'Boucherie Centrale', 'FAC-2025-002',
  false
);

-- Expiring in 1 day
INSERT INTO stock_entries (restaurant_id, product_name, quantity, unit, category, delivery_date, expiry_date, supplier, invoice_number, is_consumed)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Crème fraîche',
  2.0, 'L', 'produits laitiers',
  (CURRENT_DATE - INTERVAL '6 days'),
  (CURRENT_DATE + INTERVAL '1 day'),
  'Laiterie du Val', 'FAC-2025-003',
  false
);

-- Expiring in 2 days
INSERT INTO stock_entries (restaurant_id, product_name, quantity, unit, category, delivery_date, expiry_date, supplier, invoice_number, is_consumed)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Fromage de chèvre',
  6, 'unité', 'produits laitiers',
  (CURRENT_DATE - INTERVAL '5 days'),
  (CURRENT_DATE + INTERVAL '2 days'),
  'Fromagerie Artisanale Martin', 'FAC-2025-004',
  false
);

-- Expiring in 5 days
INSERT INTO stock_entries (restaurant_id, product_name, quantity, unit, category, delivery_date, expiry_date, supplier, invoice_number, is_consumed)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Tomates cerises',
  4.0, 'kg', 'légumes',
  (CURRENT_DATE - INTERVAL '2 days'),
  (CURRENT_DATE + INTERVAL '5 days'),
  'Primeur du Marché', 'FAC-2025-005',
  false
);

-- More stock entries for variety
INSERT INTO stock_entries (restaurant_id, product_name, quantity, unit, category, delivery_date, expiry_date, supplier, invoice_number, is_consumed)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Courgettes', 3.0, 'kg', 'légumes', CURRENT_DATE, (CURRENT_DATE + INTERVAL '5 days'), 'Primeur du Marché', 'FAC-2025-005', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jambon de Bayonne', 1.5, 'kg', 'viande', CURRENT_DATE, (CURRENT_DATE + INTERVAL '10 days'), 'Boucherie Centrale', 'FAC-2025-006', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Huile d''olive extra vierge', 5.0, 'L', 'épicerie', (CURRENT_DATE - INTERVAL '30 days'), (CURRENT_DATE + INTERVAL '335 days'), 'Épicerie Fine Provence', 'FAC-2025-007', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Vin rouge Bordeaux', 24, 'bouteille', 'boissons', (CURRENT_DATE - INTERVAL '60 days'), (CURRENT_DATE + INTERVAL '3000 days'), 'Cave du Sommelier', 'FAC-2025-008', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mousse au chocolat', 12, 'unité', 'autre', CURRENT_DATE, (CURRENT_DATE + INTERVAL '3 days'), 'Cuisine Maison', NULL, false);

-- Stock entries for Restaurant 2
INSERT INTO stock_entries (restaurant_id, product_name, quantity, unit, category, delivery_date, expiry_date, supplier, invoice_number, is_consumed)
VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Poulet fermier', 8.0, 'kg', 'viande', CURRENT_DATE, (CURRENT_DATE + INTERVAL '2 days'), 'Ferme des Colombes', 'FAC-BF-001', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Épinards frais', 2.5, 'kg', 'légumes', CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 day'), 'Marché Local', 'FAC-BF-001', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Dorade royale', 4.0, 'kg', 'poisson', CURRENT_DATE, (CURRENT_DATE + INTERVAL '2 days'), 'Criée du Port', 'FAC-BF-002', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Camembert', 4, 'unité', 'produits laitiers', (CURRENT_DATE - INTERVAL '7 days'), (CURRENT_DATE + INTERVAL '7 days'), 'Fromagerie Normande', 'FAC-BF-003', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Farine de blé T55', 25, 'kg', 'épicerie', (CURRENT_DATE - INTERVAL '30 days'), (CURRENT_DATE + INTERVAL '335 days'), 'Moulin du Terroir', 'FAC-BF-004', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Beurre AOP', 3.0, 'kg', 'produits laitiers', (CURRENT_DATE - INTERVAL '5 days'), (CURRENT_DATE + INTERVAL '25 days'), 'Laiterie Bretonne', 'FAC-BF-003', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Champignons de Paris', 3.0, 'kg', 'légumes', CURRENT_DATE, (CURRENT_DATE + INTERVAL '5 days'), 'Marché Local', 'FAC-BF-005', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Eau minérale', 48, 'bouteille', 'boissons', (CURRENT_DATE - INTERVAL '7 days'), (CURRENT_DATE + INTERVAL '720 days'), 'Cash & Carry', 'FAC-BF-006', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Sel de Guérande', 5, 'kg', 'épicerie', (CURRENT_DATE - INTERVAL '90 days'), (CURRENT_DATE + INTERVAL '1735 days'), 'Cash & Carry', 'FAC-BF-006', false),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Lait entier', 10, 'L', 'produits laitiers', (CURRENT_DATE - INTERVAL '2 days'), (CURRENT_DATE + INTERVAL '8 days'), 'Laiterie Bretonne', 'FAC-BF-003', false);
