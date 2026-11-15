import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { placeOrder, listMyOrders, submitPayment, cancelOrder, getInvoice } from './orders.controller.js';

const router = Router();

router.use(requireAuth, requireRole('buyer'));

router.post('/', placeOrder);
router.get('/', listMyOrders);
router.post('/:id/payment', submitPayment);
router.post('/:id/cancel', cancelOrder);
router.get('/:id/invoice', getInvoice);

export default router;