import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { addItem, getCart, removeItem } from './cart.controller.js';

const router = Router();

// Every cart route is buyer only
router.use(requireAuth, requireRole('buyer'));

router.post('/items', addItem);
router.get('/', getCart);
router.delete('/items/:variantId', removeItem);

export default router;