import { Router } from 'express';
import {
  listProducts,
  listCategories,
  getCart,
  addToCart,
  updateCartItem,
} from '../controllers/product.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', listProducts);
router.get('/categories', listCategories);
router.get('/cart', requireAuth, getCart);
router.post('/cart', requireAuth, addToCart);
router.patch('/cart', requireAuth, updateCartItem);

export default router;
