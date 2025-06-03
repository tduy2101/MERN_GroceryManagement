import express from 'express';
import {
    createSalesOrder,
    getAllSalesOrders,
    getSalesOrderById,
    updateSalesOrder,
    deleteSalesOrder,
} from '../controllers/salesOrderController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', getAllSalesOrders);

router.get('/:id', getSalesOrderById);

router.post('/', createSalesOrder);

router.put('/:id', updateSalesOrder);

router.delete('/:id', deleteSalesOrder);

export default router;

