# Requirements: B2B Cosmetics Order Management Platform

**Author:** Reyhana Hamza
**Version:** 1.0
**Date:** 2026-11-14

## 1. Stakeholder
The primary stakeholder is the owner or manager of a simulated cosmetics wholesale
and distribution business. The secondary users are business customers (shops,
salons, pharmacies) who place bulk orders.

## 2. Problems the System Solves
1. **Product confusion:** Buyers may confuse similar cosmetics, especially products
   with different shades, sizes, or types.
2. **Quantity management:** The supplier manages stock manually, which can result in
   accepting orders for products that are out of stock.
3. **Lack of product feedback:** Buyers cannot see how other buyers rate products.
   (Addressed as a future feature, see Section 8.)

## 3. User Roles and Permissions

### Admin (supplier staff)
**Can:**
- Log in
- Approve or reject buyer registrations
- Add, update, and remove products and variants
- Update prices and stock quantities
- View all orders
- Verify or reject payment references
- Update order and delivery statuses

**Cannot:**
- Place orders as a buyer
- See buyers' passwords or private credentials

### Buyer (business customer)
**Can:**
- Register, then log in after Admin approval
- Browse products and view details and prices
- Add items to a cart and place orders
- Choose pickup or delivery
- Submit a payment reference (and resubmit if rejected)
- Track the status of their own orders

**Cannot:**
- Access another buyer's orders
- Change prices or stock
- Verify their own payments
- Order more units than are in stock

## 4. Key Design Decisions
| # | Decision | Choice | Reason |
|---|----------|--------|--------|
| 1 | Product variations | One product with multiple variants (shade/size), each with its own SKU, price, and stock | Avoids duplicate catalog entries and reduces product confusion |
| 2 | Payment method | Buyer enters a transaction reference number (bank/Telebirr); Admin verifies manually | Simple and secure for version 1; avoids file upload handling |
| 3 | Delivery | Buyer chooses pickup or supplier delivery at checkout | Covers real needs; address required only for delivery |

## 5. Order Status Flow
`pending_payment` → `payment_submitted` → `payment_verified` →
`ready_for_pickup` OR `out_for_delivery` → `completed`

Other statuses:
- `payment_rejected` (buyer may resubmit a new reference)
- `cancelled`

## 6. Main Workflow
1. Buyer registers and waits for Admin approval.
2. Admin reviews the registration and approves or rejects it.
3. Approved buyer logs in and browses products.
4. Buyer adds product variants and quantities to the cart.
5. Buyer checks out and confirms the order. Stock is checked at this point.
6. Buyer chooses pickup or delivery (delivery requires an address).
7. Buyer pays outside the system and submits the payment reference.
8. Admin verifies or rejects the payment.
   - If rejected, the buyer resubmits a corrected reference.
   - If verified, stock is deducted and an invoice is generated.
9. Admin updates the status to ready for pickup or out for delivery.
10. Buyer tracks the order until it is completed.

## 7. Success Metrics
The system is successful if:
1. A buyer cannot order more units than the available stock.
2. Unapproved buyers cannot access purchasing features.
3. A buyer cannot view another buyer's orders.
4. The same payment reference cannot be used on two different orders.
5. Admins can verify or reject submitted payment references.
6. Every payment verification and important status change is recorded in the audit
   log (who, what, when).
7. Buyers can choose between pickup and delivery, and the order data reflects it.

## 8. Out of Scope (Version 1) / Future Improvements
- Real payment gateway integration
- Product ratings and reviews
- Receipt screenshot upload
- Live delivery tracking
- Email and SMS notifications
- Advanced sales analytics

## 9. Edge Cases to Handle
- Two buyers ordering the last unit at the same time
- Invalid or duplicate payment reference
- Buyer submitting delivery without an address
- Login attempt by a rejected or unapproved buyer
- Admin changing a price after an item is already in a cart
- Cancelling an order after stock was deducted (stock must be restored)

## 10. Assumptions and Limitations
- All data is simulated; no real customers or payments are involved.
- Payment is verified manually by the Admin, not automatically.
- Single currency (ETB) and a single supplier.