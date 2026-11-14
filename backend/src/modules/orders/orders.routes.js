import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { placeOrder, listMyOrders } from './orders.controller.js';

const router = Router();

router.use(requireAuth, requireRole('buyer'));

router.post('/', placeOrder);
router.get('/', listMyOrders);

export default router;