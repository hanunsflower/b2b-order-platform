import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { listBuyers, updateBuyerStatus } from './admin.controller.js';

const router = Router();

// Every route in this file is admin only
router.use(requireAuth, requireRole('admin'));

router.get('/buyers', listBuyers);
router.patch('/buyers/:id', updateBuyerStatus);

export default router;