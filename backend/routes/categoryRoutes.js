import express from 'express';
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/get', getAllCategories);
router.post('/add', protect, adminOnly, createCategory);
router.get('/get/:id', getCategoryById);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;
