// routes/supplierRoutes.js
import express from 'express';
import {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} from '../controllers/supplierController.js'; 
import { protect, adminOnly } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.get('/get', getAllSuppliers);
router.post('/add', protect, adminOnly, createSupplier);
router.get('/get/:id', getSupplierById);
router.put('/:id', protect, adminOnly, updateSupplier);
router.delete('/:id', protect, adminOnly, deleteSupplier);

export default router;