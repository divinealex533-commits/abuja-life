# Abuja Life

A life-simulation game set in Abuja, built with Next.js, Supabase and Paystack.

## What's new in this version

- **VIP store** (`/vip`): Silver, Gold and Diamond VIP, a one-time starter pack and game-cash bundles, all paid through Paystack.
- **VIP sections across the game**: daily perks in the game hub, jobs, locations, houses, dealership and businesses. Non-VIP players see what they're missing and an upgrade button.
- **11 advanced careers** (`/careers`): POS Agent, Auto Mechanic, Keke Rider, Nurse, Pharmacist and Real Estate Agent for everyone, plus VIP careers: Luxury Car Dealer (Silver), Surgeon and Diplomat (Gold), Oil & Gas Engineer and Tech Startup Founder (Diamond). Each shift has 3 real decisions with risks, random city events and 5 promotion ranks.
- **Weekend rewards**: free game cash every Saturday and Sunday, a bonus for claiming both days, and 2×–5× for VIP members.
- **Admin VIP center** (`/admin/vip`): sales by product, active VIP members, gift VIP, set weekend reward amounts, and see any paid purchases that failed to deliver.
- **VIP badges in location chat.**
- **Admin price editor** (`/admin/prices`): set the price of every VIP item, VIP place, career licence and job fee. Choose game cash, real Naira (Paystack) or free, or take an item off sale.
- **VIP places**: VIP Hotel Room, Presidential Suite, Club VIP Room, Penthouse, Supercar Rental, Boardroom Dinner, Private Jet and Executive Course. They're bookable from the VIP sections.
- **Job licences**: advanced careers need a one-time licence (VIP careers are expensive). Classic jobs charge an application fee.
- **Weekend Championship** (`/admin/weekend-prizes`): real-money prizes for the top players each weekend. Winners enter bank details in the game; you pay and mark it paid.
- **Announcement replies** (`/announcements`, `/admin/announcements/replies`): players reply privately to your announcements and you answer them.

## Setup (do these in order)

### 1. Environment variables

Copy `.env.example` to `.env.local` (and add the same values in Vercel → Settings → Environment Variables).

### 2. Run the database migrations (in this order)

In Supabase → **SQL Editor** → New query, paste the whole file and click **Run**. Do this for each file:

1. `supabase/migrations/20261116_vip_careers_weekend.sql`
2. `supabase/migrations/20261117_prices_prizes_replies.sql`

Both are safe to run more than once.

> **Economy switch:** if your existing database has a trigger that blocks cash changes when "Economy" is OFF in Admin Settings, it also pauses VIP cash, career pay and weekend rewards. Paid purchases that can't be delivered are retried automatically and appear under **Admin → VIP → Paid but not delivered**.

### 3. Paystack webhook

In Paystack → Settings → API Keys & Webhooks, set the webhook URL to:

```
https://your-domain.com/api/payments/paystack/webhook
```

### 4. Turn payments on

Admin → Game Settings → enable **Payments**.

### 5. Test with Paystack test keys first

Use `sk_test_…` and `pk_test_…`, buy VIP Silver (7 days) at `/vip` with a Paystack test card, and check that:

- the payment page says VIP is active
- `/vip` shows your badge and days left
- Admin → VIP shows the sale

Then switch to live keys.

## Changing prices

Use **Admin → Prices**. No code changes needed. The prices in the code (`src/lib/pricing/items.ts`, `src/lib/vip/catalog.ts`, `src/lib/vip/venues.ts`) are only defaults. The browser never sends an amount, so players can't change what they pay.

## Weekend prizes: how paying works

1. Saturday and Sunday: players earn points from career shifts (1 XP = 1 point).
2. Monday: Admin → Weekend Prizes → **Finalize**. The top players become winners.
3. Winners see "You won" in the game and enter their bank account.
4. You send the money from your bank app, then click **Mark paid** with the transfer reference.

You can cancel a prize (for example, if someone cheated) before it's paid.

- VIP perks per area: `src/lib/vip/perks.ts`
- Careers: `src/lib/game/careers/standard.ts` and `vip.ts`. Add a scenario or a whole career by copying an existing one.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Uploading an update to GitHub + Vercel

1. Install **GitHub Desktop** (desktop.github.com) and sign in.
2. File → **Clone repository**, pick your Abuja Life repo, and choose a folder.
3. Open that folder. Delete everything inside it **except the hidden `.git` folder**.
4. Unzip the update and copy everything inside `abuja-life-main` into the folder.
5. In GitHub Desktop, write a summary (e.g. "VIP, prices, prizes") → **Commit to main** → **Push origin**.
6. Vercel deploys automatically in 1–3 minutes. Check the Deployments tab.
