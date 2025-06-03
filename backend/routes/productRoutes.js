import express from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    searchProducts
} from '../controllers/productController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';


const router = express.Router();

// Public routes
router.get('/category/:id', getProductsByCategory);
router.get('/search/:key', searchProducts);
// router.get('/get', getAllProducts);
router.get('/get', getAllProducts);
router.get('/:id', getProductById);

// Admin routes
router.post('/add', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
