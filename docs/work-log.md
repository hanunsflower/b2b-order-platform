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
