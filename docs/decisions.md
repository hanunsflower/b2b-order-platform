# Decision Log

## Decision 1: Product variants
- **Date:** 2026-11-14
- **Question:** How do we handle products with different shades and sizes?
- **Options considered:**
  - A. One product with multiple variants
  - B. Each shade/size as a separate product
- **Decision:** A (one product with variants, each with its own SKU, price, and stock)
- **Why:** It keeps the catalog clean and reduces the "product confusion" problem,
  because a buyer sees one product with clear options. Stock is tracked per variant.
- **Trade-off:** The database is slightly more complex (two tables instead of one).

## Decision 2: Payment method
- **Date:** 2026-11-14
- **Question:** How do buyers prove they paid?
- **Options considered:**
  - A. Upload a receipt screenshot
  - B. Enter a transaction reference number
  - C. Both
- **Decision:** B (transaction reference number, verified manually by Admin)
- **Why:** It is simple, easy to validate, and avoids file upload and storage
  security issues in version 1.
- **Trade-off:** Less proof than a screenshot. Receipt upload is listed as a
  future improvement.

## Decision 3: Delivery
- **Date:** 2026-11-14
- **Question:** Who manages delivery?
- **Options considered:**
  - A. Supplier delivers
  - B. Buyer arranges delivery
  - C. Both
- **Decision:** Buyer chooses pickup or supplier delivery at checkout.
- **Why:** It covers real needs. Delivery address is required only when delivery
  is chosen. A buyer arranging their own delivery is the same as pickup from the
  system's point of view.
- **Trade-off:** No live delivery tracking in version 1.

## Open question (to decide during database design)
- **Stock timing:** Stock is checked at checkout but only deducted when payment is
  verified. What happens if stock runs out between those two moments? Options to
  evaluate: reserve stock at checkout, or re-check at verification.