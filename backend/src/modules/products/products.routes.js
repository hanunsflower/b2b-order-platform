import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { createProduct, listProducts } from './products.controller.js';

const router = Router();

router.post('/', requireAuth, requireRole('admin'), createProduct);
router.get('/', requireAuth, listProducts);

export default router;