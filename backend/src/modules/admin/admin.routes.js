import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';

import { listBuyers, updateBuyerStatus, listPayments, reviewPayment } from './admin.controller.js';

const router = Router();

// Every route in this file is admin only
router.use(requireAuth, requireRole('admin'));

router.get('/buyers', listBuyers);
router.patch('/buyers/:id', updateBuyerStatus);

router.get('/payments', listPayments);
router.patch('/payments/:id', reviewPayment);

export default router;