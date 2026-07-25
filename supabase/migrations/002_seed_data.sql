-- =============================================================================
-- InvoDemo - Seed Data
-- Run after 001_initial_schema.sql to populate demo data
-- =============================================================================

-- Note: In production, users are created via Supabase Auth.
-- This seed data creates demo invoices for a test user.
-- The user must first sign up through the application.

-- =============================================================================
-- DEMO INVOICES (for a user with UUID: 00000000-0000-0000-0000-000000000001)
-- Replace this UUID with an actual user ID after signing up.
-- =============================================================================

-- Example: After signing up, run this with your actual user ID:
-- INSERT INTO public.invoices (user_id, invoice_number, status, customer_name, customer_email, customer_phone, customer_address, currency, tax_rate, discount, notes, due_date)
-- VALUES
--   ('YOUR_USER_ID', 'INV-00001', 'paid', 'Ruturaj Rathod', 'ruturaj@example.com', '+91 98765 43210', '123 MG Road, Pune, Maharashtra', 'INR', 18, 0, 'Thank you for your business!', current_date + 15),
--   ('YOUR_USER_ID', 'INV-00002', 'pending', 'Acme Corp', 'billing@acme.com', '+1 555 123 4567', '456 Business Ave, New York, NY', 'USD', 10, 50, 'Net 30 payment terms', current_date + 30),
--   ('YOUR_USER_ID', 'INV-00003', 'overdue', 'John Smith', 'john@example.com', NULL, '789 Oak Street, London', 'GBP', 20, 0, 'URGENT: Payment overdue', current_date - 5),
--   ('YOUR_USER_ID', 'INV-00004', 'draft', 'Tech Solutions Ltd', 'info@techsolutions.com', '+91 87654 32100', '321 Silicon Valley, Bangalore', 'INR', 18, 100, 'Draft - pending approval', current_date + 45),
--   ('YOUR_USER_ID', 'INV-00005', 'cancelled', 'Global Enterprises', 'accounts@global.com', '+44 20 7946 0958', '10 Downing Street, London', 'GBP', 0, 0, 'Cancelled per customer request', current_date + 7);

-- Example invoice items for INV-00001:
-- INSERT INTO public.invoice_items (invoice_id, name, description, quantity, unit_price, sort_order)
-- VALUES
--   ((SELECT id FROM public.invoices WHERE invoice_number = 'INV-00001'), 'Bicycle', 'Mountain bike, 26 inch', 1, 500, 0),
--   ((SELECT id FROM public.invoices WHERE invoice_number = 'INV-00001'), 'Helmet', 'Safety helmet, matte black', 1, 200, 1);
