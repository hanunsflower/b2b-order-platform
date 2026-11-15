import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { placeOrder, listMyOrders, submitPayment } from './orders.controller.js';

const router = Router();

router.use(requireAuth, requireRole('buyer'));

router.post('/', placeOrder);
router.get('/', listMyOrders);
router.post('/:id/payment', submitPayment);

export default router;