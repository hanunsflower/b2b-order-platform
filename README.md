# B2B Cosmetics Order Management Platform

A multi-role ordering system for a simulated cosmetics wholesaler. Approved
business buyers browse products, fill a cart, place orders, and pay by bank
reference. The supplier's admin approves buyers, verifies payments, manages
stock and prices, and moves orders through fulfillment. Built for the Arrowstack
Full Stack Development internship (Project 1).

**Author:** Reyhana Hamza

## Stakeholder and problem

The primary stakeholder is the owner or manager of a cosmetics wholesale
business. Without this system, stock is tracked by hand, orders can be accepted
for items that are out of stock, and similar products (shades, sizes) get
confused. The system reserves stock at checkout, models shades and sizes as
product variants, and records every important action in an audit log.

## Features

**Buyer:** register (then wait for approval), log in, browse products, cart,
checkout with pickup or delivery, submit a payment reference (and resubmit if
rejected), cancel an unpaid order, track orders, view invoices.

**Admin:** approve or reject buyers, create products and variants, change price
and stock, verify or reject payments, move orders to ready for pickup, out for
delivery, or completed.

## Tech stack

React (Vite) and React Router, Node.js with Express (ES modules), PostgreSQL 16,
JWT with bcrypt, Docker Compose, nginx for the frontend, and the Node built-in
test runner. Docker is used for the database and deployment; the handbook's
suggested NestJS was replaced by Express (documented in `docs/decisions.md`).

## How to run

Requirements: Docker Desktop. (Node 20 or newer is only needed to run tests.)

1. Create the backend settings file from the template, then set your own
   `JWT_SECRET` to a long random string:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Generate one with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
2. Start everything (database, API with automatic migrations, website):
   ```bash
   docker compose up --build
   ```
3. In a second terminal, seed the database (creates demo users and products):
   ```bash
   docker compose exec api node src/seed-admin.js
   docker compose exec api node src/seed-catalog.js
   ```
4. Open http://localhost:5173

| Service | Address |
|---|---|
| Website | http://localhost:5173 |
| API | http://localhost:3000 (health check: `/health`) |
| PostgreSQL | localhost:5432 |

**Demo Credentials (local testing only):**
- **Admin:** `admin@demo.com` / `demo1234` (or click "Demo Admin" on the login page)
- **Buyer:** `buyer@demo.com` / `demo1234` (or click "Demo Buyer" on the login page)

> ⚠️ **Limitation:** These demo accounts are for local development and portfolio review only. Never run the `seed-admin.js` or `seed-catalog.js` scripts against a live production server, as they create accounts with a publicly known password.

**First walkthrough:** register a buyer on the Register page, log in as admin
and approve it under Buyers, create a product under Products, then log in as
the buyer and place an order. Submit a payment reference, verify it as admin
under Payments, and view the invoice under My orders.

Stop with `docker compose stop`. `docker compose down -v` deletes all data.

## Project structure

```
backend/
  migrations/        numbered SQL files, applied once and recorded
  src/
    db/              connection pool
    middleware/      requireAuth, requireRole
    modules/         auth, admin, products, cart, orders
                     (routes + controller [+ service] per feature)
    migrate.js       migration runner
    seed-admin.js    creates the admin account
  tests/             automated tests
frontend/            React app, served by nginx in Docker
docs/                requirements, decisions, work log, test evidence
docker-compose.yml   db + api + web
```

## Database

Ten tables: `users`, `products`, `product_variants`, `carts`, `cart_items`,
`orders`, `order_items`, `payments`, `invoices`, `audit_logs`. Schema changes
are numbered migrations in `backend/migrations/`; the runner records applied
files in `schema_migrations` and skips them next time. Old migrations are never
edited.

## Key rules

- **Stock reservation:** each variant has `stock_on_hand` and `stock_reserved`;
  available = on hand - reserved.

  | Event | on_hand | reserved |
  |---|---|---|
  | Checkout | no change | + quantity |
  | Payment verified | - quantity | - quantity |
  | Payment rejected | no change | no change (buyer may resubmit) |
  | Order cancelled | no change | - quantity |

- **No overselling:** checkout runs in one transaction and locks the variant
  rows (`SELECT ... FOR UPDATE`), so two buyers cannot take the last unit.
  The database also enforces `stock_reserved <= stock_on_hand`.
- **Price snapshot:** `order_items.unit_price` stores the price at order time,
  so later price changes never alter old orders or invoices.
- **Totals are calculated** from order items, not stored.
- **Unique payment reference:** one reference cannot be used on two orders.
- **Order status flow:** `pending_payment` -> `payment_submitted` ->
  `payment_verified` -> `ready_for_pickup` or `out_for_delivery` ->
  `completed`; also `payment_rejected` and `cancelled`. Invalid moves return 409.
- **Roles:** buyers must be approved by an admin before they can log in.
  Buyers see only their own orders; other buyers' orders return 404.
- **Audit log:** buyer approvals, product creation, variant updates, orders,
  payments and status changes record who did what and when.

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Products | `GET /api/products`; admin: `POST /api/products`, `PATCH /api/products/variants/:id` |
| Cart (buyer) | `GET /api/cart`, `POST /api/cart/items`, `DELETE /api/cart/items/:variantId` |
| Orders (buyer) | `GET/POST /api/orders`, `POST /api/orders/:id/payment`, `POST /api/orders/:id/cancel`, `GET /api/orders/:id/invoice` |
| Admin | `GET/PATCH /api/admin/buyers`, `GET/PATCH /api/admin/payments`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` |

## Tests

Tests run against a separate database (`orders_test`) through a second API
instance on port 3001, so they never touch the demo data.

```bash
# once: create and prepare the test database (Docker must be running)
docker compose exec db psql -U app -d orders -c "CREATE DATABASE orders_test;"
cd backend
npm install
npm run migrate:test
npm run seed:test

# window 1: test API (leave running)
npm run start:test

# window 2
npm test
```

24 tests cover registration and approval, role access, stock reservation
(including two buyers checking out the last unit at the same moment), payment
verification, rejection and resubmission, duplicate references, cancel, and
admin stock updates. Output is saved in `docs/test-evidence.txt`.

## Requirements and evidence

| Success metric | Evidence |
|---|---|
| Buyer cannot order more than available stock | `stock.test.js`: oversell returns 409; simultaneous checkout gives one 201 and one 409 |
| Unapproved buyers cannot buy | `auth.test.js`: login before approval returns 403 |
| Buyer cannot access another buyer's orders | `payments.test.js`: another buyer gets 404 on pay and cancel; order list is filtered by the logged-in buyer's id |
| Same payment reference cannot be reused | `payments.test.js`: second use returns 409 |
| Admin can verify or reject payments | `payments.test.js`: verify deducts stock, reject keeps the reservation and allows resubmission |
| Important actions are in the audit log | Manual check (see `docs/screenshots/`): query of `audit_logs`; not yet an automated test |
| Pickup or delivery is selectable | Checked manually in the browser and API (delivery without an address returns 400); not yet an automated test |

## Limitations and next steps

- **Auto-cancel of unpaid orders after 24 hours is not built** (a buyer can
  cancel manually). Stock stays reserved until then. Next step: a scheduled job.
- Payments are verified manually; there is no real payment gateway.
- The create-product form adds one variant at a time.
- Tokens last one hour with no refresh; the token is stored in `localStorage`.
- No notifications (email or SMS), ratings, or sales analytics.
- The admin password is a local-testing default; production would use a secret
  manager and a forced password change.
- The test database must be created once by hand and is not reset between runs.
- No pagination or rate limiting on the API.
- For 10x the users: add database indexes on order lookups, pagination, a job
  queue for background work, and run several API instances behind a load balancer.

## Documentation

`docs/requirements.md`, `docs/decisions.md` (14 design decisions with trade-offs),
`docs/work-log.md`, `docs/test-evidence.txt`.