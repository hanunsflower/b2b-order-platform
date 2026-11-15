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

  ## Decision 4: Stock reservation
- **Date:** 2026-11-14
- **Question:** When should stock be held for an order?
- **Options considered:**
  - A. Reserve stock at checkout
  - B. Deduct stock only when payment is verified
- **Decision:** A (reserve at checkout)
- **Why:** A customer should never be told "out of stock" after they have already
  paid. Reserving at checkout tells the second buyer immediately, before any money
  is sent.
- **Trade-off:** Unpaid orders can lock stock, so unpaid orders will be cancelled
  automatically after a set time (e.g. 24 hours) and the reserve released.

  ## Decision 5: Order total
- **Date:** 2026-11-14
- **Question:** Should the order total be stored or calculated?
- **Decision:** Calculated from order_items (SUM of quantity x unit_price).
- **Why:** Avoids storing the same information twice, so the total can never
  disagree with the items.
- **Trade-off:** Slightly more work on each read. If delivery fees or discounts
  are added later, a stored total (or a total snapshot on the invoice) may be needed.

  ## Decision 6: ES modules
- **Date:** 2026-11-14
- **Decision:** Use ES modules (`import`/`export`) instead of CommonJS.
- **Why:** It is the modern JavaScript standard and matches the syntax used in
  React on the frontend, so the whole project uses one style.
- **Trade-off:** Local imports need file extensions, and some older packages
  need a default import.

  Feature-based modules (routes, controller, service per feature) so each feature’s code lives together and the structure scales as orders, payments, and invoices are added.

  feature-based structure, so each feature’s code lives together

  ## Decision 9: Unpaid orders and held stock
- **Date:** 2026-11-15
- **Question:** What happens to reserved stock if a buyer never pays or never resubmits a rejected payment?
- **Decision:** Both: the buyer can cancel their own order, and unpaid orders auto-cancel after 24 hours.
- **Why:** Reserved stock is unavailable to other buyers, so abandoned orders must not lock it forever.
- **Trade-off:** Auto-cancel needs a scheduled job, so it is built after manual cancel.