import express from 'express';
import { adminOnly, protect } from '../middleware/authMiddleware.js';
import { getAllUsers, deleteUser, createUser, updateUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/get', protect, adminOnly, getAllUsers);
router.delete('/delete/:id', protect, adminOnly, deleteUser);
router.post('/add', protect, adminOnly, createUser)
router.put('/update/:id', protect, adminOnly, updateUser)


export default router;