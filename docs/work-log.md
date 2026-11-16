# Work Log

## 2026-11-14 (Day 1)
- Created GitHub repo `b2b-order-platform` and cloned it locally.
- Confirmed Node.js and Git are installed.
- Downloading and installing Docker Desktop (not yet verified).
- Created project folders: backend, frontend, docs.

### Questions / things I don't understand yet
- What Docker is for and when to use it.
  (Initial understanding: it packages the app and database so they run the
  same way on any computer. I'll confirm this once I use it.)

### Next
- Verify Docker with `docker --version`.
- Write docs/requirements.md.


- Docker Desktop installed and verified (`docker --version`, `docker run hello-world`).
- Understanding now: Docker pulled an "image" (hello-world) and ran it as a
  "container". We'll use the same idea to run PostgreSQL.

  - Wrote the database schema (10 tables) and loaded it into PostgreSQL via Docker Compose.
- Verified with `\dt`: all 10 tables created.
- Decisions made today: variants, payment reference, pickup/delivery, stock reservation, calculated totals.

Backend skeleton running; /health confirms API-to-database connection.

Built requireAuth and requireRole middleware. Tested: buyer gets 403 on admin route, no token gets 401

Refactored to feature modules (routes/controller per feature). Fixed ERR_MODULE_NOT_FOUND caused by db.js in the wrong folder. Moved approval + audit log into a transaction.

Built order cancel (releases reserved stock) and admin fulfillment transitions. Tested the pickup/delivery rule and the full lifecycle.

git add . && git commit -m "Add automated tests for auth and access control" && git push

Wrote stock tests, including a simultaneous-checkout race test. Exactly one buyer gets the last unit (201), the other gets 409. Proves the FOR UPDATE lock works

Wrote 7 tests for payment verification, rejection and resubmission, duplicate references, cancel, and cross-buyer access. Tests check real stock numbers in the database. 19 tests pass.

Both buyers check out at the same moment for the last unit. Each checkout locks the variant row with FOR UPDATE, so the database lets one go first and makes the other wait. The first one sees 1 available, reserves it (stock_reserved becomes 1) and succeeds with 201. When the second one gets the lock, available is now 0, so it fails with 409. Without the lock, both would read “1 available” before either one updated it, and we would oversell.

Built admin price/stock updates and a buyer invoice view. Wrote tests for stock increase and the reserved-stock rule. 21 tests pass. Fixed my test by matching the helper signatures.

- Built admin price/stock updates (with audit log) and buyer invoice view.
- Wrote variant tests. 21 automated tests pass.
- Debugged a server crash (ECONNRESET/ECONNREFUSED in tests). Added a pool error
  handler in db.js so a dropped database connection no longer kills the server.

  Created the React app with Vite, added CORS and an API helper that attaches the JWT from localStorage.

Built the login page. Debugged ‘Cannot reach the server’: a stray local API was competing with the Docker API on port 3000, and Docker had stopped. Learned to run only one API at a time.

Nov 16, Day 3

Added token decoding, ProtectedRoute and Home redirect by role. Tested buyer/admin routing

Built the My orders page (payment reference, cancel, invoice). The invoice was rendering below the list, so I moved it to the top

Built admin Pending buyers and Payments screens. Verified the full flow in the browser: approve buyer, submit payment, verify (invoice appears), reject (stock stays reserved, buyer can resubmit)