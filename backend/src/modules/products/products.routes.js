import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { createProduct, listProducts, updateVariantController } from './products.controller.js';

const router = Router();

router.post('/', requireAuth, requireRole('admin'), createProduct);
router.get('/', requireAuth, listProducts);
router.patch('/variants/:variantId', requireAuth, requireRole('admin'), updateVariantController);

export default router;