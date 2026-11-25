# Petit Atelier Events · website + booking system

One-page site for Karol's decor rental business (Eagle Mountain, UT). Clients pick up and return everything (free); installation is an optional $120 add-on. Includes: catalog with live date availability, a drag-and-drop Design Studio with live pricing that uses real photos of Karol's pieces (and lets clients try them on a photo of their own space), packages, online rental agreement with e-signature and damage protection choice, reservation lookup, and Karol's dashboard (requests, prep checklists, calendar, inventory with photo upload, payments, email reminders, settings). English and Spanish.

## Files
- `index.html` + `img/`: the whole site (customer side + `#admin` dashboard) and the real photos of Karol's pieces, cut out from her Canva Services & Pricing Guide. Upload both to GitHub Pages as is.
- `supabase/schema.sql`: tables, security rules, booking and availability functions, photo bucket.
- `supabase/seed.sql`: the starting catalog (28 pieces) and settings.
- `supabase/functions/send-email`: new-request emails to Karol + client, and emails Karol sends from the dashboard.
- `supabase/functions/daily-reminders`: automatic 7-day and day-before reminders, plus a morning prep digest for Karol.
- `supabase/cron.sql`: schedules the daily reminders.

## Demo mode (no setup)
With `SUPABASE_URL` empty in `index.html`, everything runs in the visitor's browser. Dashboard: open `#admin`, PIN `2468`. Good for showing Karol; not for real customers.

## Going live (about 30 minutes)
1. Create a Supabase project. SQL Editor: run `schema.sql`, then `seed.sql`.
2. Authentication: turn off "Allow new users to sign up", then add a user with askpetitatelier@gmail.com and a password. That email is already in `public.admins`.
3. Make a free Resend account, verify a sending domain (or use their test sender while testing), and create an API key.
4. Deploy functions (Supabase CLI):
   ```
   supabase functions deploy send-email --no-verify-jwt
   supabase functions deploy daily-reminders --no-verify-jwt
   supabase functions deploy ai-balloons --no-verify-jwt
   supabase secrets set RESEND_API_KEY=re_xxx FROM_EMAIL="Petit Atelier <hello@yourdomain.com>" CRON_SECRET=some-long-random-text
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx OPENAI_API_KEY=sk-xxx   # AI balloon designer
   ```
5. Database > Extensions: enable `pg_cron` and `pg_net`. Edit `cron.sql` with the project URL and CRON_SECRET, run it.
6. In `index.html`, fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `CONFIG` (top of the script). Upload to the GitHub repo and turn on Pages.
7. Karol opens `yoursite/#admin`, signs in, and adds real photos (see below) and Instagram photos for "Recent setups" (Settings).

## Real photos in the Design Studio
For each piece in Inventory: set its real height in feet, then upload one straight-on photo of the whole piece against a plain wall. The background is removed in the browser (free, @imgly/background-removal) and the piece stands on the floor at its real size. Balloon pieces take one photo per color palette. If automatic removal fails on a phone, cut the photo out with Canva or remove.bg and upload the PNG with the checkbox off. Pieces without a photo keep the drawing. A client's "photo of my space" never leaves their device.

## Things Karol should decide
- Prices, quantities, replacement values: all editable in Inventory. The ones loaded are placeholders based on typical Utah rental prices.
- Care Plan $100 (covers up to $500), or refundable $150 deposit + replacement value. Editable in Settings.
- Retainer 30%, balance 7 days before, $25/day late return, $120 installation, pickup times and place, minimum order $100. Editable in Settings.
- Packages and "Start from a look" presets live in `PACKAGES` / `LOOKS` in the code.
- Have a Utah attorney review the rental agreement text (`contract.js` section) before taking real bookings.
- Payments are tracked by hand (Venmo/Zelle/cash). A Stripe payment link can be added later.

## Inventory loaded from Karol's guide
Gold window arch, gold open arch set (4), gold rounded arch frames (4, catalog photo only), organic balloon garland ($22/ft, up to 3 colors, from her guide), clear acrylic cylinders (5, catalog photo only), white round side tables (3), cane console table, cane and wood bench, pink vintage nightstand, white vintage side table. Rental prices other than balloons are placeholders: her guide has no prices for them.

## AI balloon designer
- "Design it with AI" reads the customer's idea (mermaid, mouse-ears birthday, school colors...) and picks up to 3 colors, a length, a placement and a short note. Live site: Claude API through the `ai-balloons` function (20 per visitor per day). Without keys it falls back to the built-in theme rules, so it always works.
- "AI photo preview" (live site only) sends a picture of the customer's layout of Karol's real pieces and gets back a photoreal version with the balloon garland added (OpenAI image edit, 4 per visitor per day, roughly $0.05 to $0.20 each). Karol sees the preview in the request.
- Licensed characters (Mickey, superheroes...) are matched by colors only: the prompts forbid printed characters, and the contract says so.
- Inspiration photos: `img/insp_*.jpg` came from Cristian (not Karol's work). Replace them with Karol's own setups when possible.

## Balloon builder
Customers build each balloon piece: style (classic, organic, full luxe, column, clusters), what it goes around (gold window arch, open arches, hoop, doorway frame, table, top of the backdrop, floor), how much of it (all around, one side, top corner, both bases), 1 to 3 strands, size in feet (auto-fitted to the piece or set by hand), up to 6 colors and extras (chrome, greenery, confetti, giant 24-36" balloons, foil or number balloons). The stage draws the garland in their colors and the estimate updates live. "Build it" turns a written idea ("garland around the main arch in Mario Bros colors") into pieces with AI. Licensed characters are matched by color only.
Prices live in Settings > Balloon builder prices (defaults: classic $16/ft, organic $22/ft, full $30/ft, column $18/ft of height, clusters $35 each, 3 colors included then $15 each). The database function `balloon_price` uses the same formula, so totals can't be changed in the browser. If you already ran an older schema.sql, run it again to add `balloon_price`.
