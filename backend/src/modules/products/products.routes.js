import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  createProduct,
  listProducts,
  updateVariantController,
  updateProductImageController,
} from './products.controller.js';

const router = Router();

router.post('/', requireAuth, requireRole('admin'), createProduct);
router.get('/', requireAuth, listProducts);
router.patch('/variants/:variantId', requireAuth, requireRole('admin'), updateVariantController);
router.patch('/:productId/image', requireAuth, requireRole('admin'), updateProductImageController);

export default router;