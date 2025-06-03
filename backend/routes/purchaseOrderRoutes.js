import express from 'express';
import {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
} from '../controllers/purchaseOrderController.js';

import { protect, adminOnly  } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getAllPurchaseOrders);

router.get('/:id', getPurchaseOrderById);

router.post('/', createPurchaseOrder);

router.put('/:id', updatePurchaseOrder);

router.delete('/:id', deletePurchaseOrder);

export default router;

