import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  createProduct,
  listProducts,
  updateVariantController,
  updateProductImageController,
  updateVariantImageController, // <-- ADDED
} from './products.controller.js';

const router = Router();

router.post('/', requireAuth, requireRole('admin'), createProduct);
router.get('/', requireAuth, listProducts);

// Variant updates (price, stock)
router.patch('/variants/:variantId', requireAuth, requireRole('admin'), updateVariantController);

// Variant image update (NEW)
router.patch('/variants/:variantId/image', requireAuth, requireRole('admin'), updateVariantImageController);

// Product image update (kept just in case)
router.patch('/:productId/image', requireAuth, requireRole('admin'), updateProductImageController);

export default router;