# Supabase schema compatibility notes

This frontend connects to your existing Supabase project. It does **not** create or modify database tables.

The current product query expects:
- `products`: `id`, `name`, `description`, `price`, `image_url`, `category_id`, `status`, `shop_id`, `created_at`
- `shops`: `id`, `status`
- `categories`: at minimum `id`, `name`

It expects a public SELECT policy that only exposes products whose `status = 'active'` and whose shop has `status = 'approved'`.

If your actual column names differ, update the SELECT query in `assets/js/app.js` to match your database. Do not disable RLS to make the page work.

## Important unfinished server features
- Seller application and admin approval
- Seller-only product create/edit UI and policies
- Customer order creation and seller-specific fulfillment orders
- Payment gateway integration and webhook verification
- Courier integration
- Refund, dispute, tax and audit workflows

Never put Supabase `sb_secret_` or `service_role` keys in browser code. The publishable key is designed for client use only when RLS is correctly configured.
