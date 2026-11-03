# Qynora — extensible marketplace starter

This is a modular starting point for the Qynora website:
- `index.html` — page structure
- `assets/css/style.css` — design
- `assets/js/config.js` — public Supabase project configuration
- `assets/js/app.js` — authentication, product catalogue, search, category filter and browser cart
- `supabase/README-SCHEMA.md` — expected database shape

## Publish on GitHub Pages
1. Extract this ZIP on your phone/computer.
2. Upload the contents of this folder into the **root** of your existing `Qynora` GitHub repository.
3. Replace `index.html` and upload the `assets` folder, `README.md`, and `supabase` folder.
4. Commit changes to `main`.
5. Open `https://emonextraa.github.io/Qynora/` after GitHub Pages updates.

Do not upload the ZIP file itself expecting GitHub to unpack it.

## Current real integrations
- Supabase email/password signup and login use the configured Supabase project.
- Product catalogue reads from Supabase `products`, `shops`, and `categories`.
- Cart is saved in the browser only.

## Before live users
The current database policies and column names must be checked against `supabase/README-SCHEMA.md`. If the query fails, inspect the exact table columns and update the query; do not turn off RLS.
Signup may be throttled by the Supabase built-in email provider. Custom SMTP setup should be handled with a responsible adult and credentials must never be shared in chat or committed to GitHub.

## Not yet implemented
This is not a complete production marketplace. Checkout, payment, order processing, seller dashboard, admin dashboard, seller approval, courier integrations, refunds, notifications, legal compliance, and production security review remain to be built and tested. Never collect payment through this starter.
