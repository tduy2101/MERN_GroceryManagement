import express from 'express';
import { registerUser, loginUser, 
        getUserProfile, updateUserProfile, 
        requestPasswordChange, confirmPasswordChange } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
 

const router = express.Router();

// Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile-user', protect, getUserProfile);
router.put('/profile-user/update', protect, updateUserProfile);

router.post('/upload-image', upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Image URL is required' });
    }

    const imgUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ message: 'Image uploaded successfully', imageUrl: imgUrl });

});


router.post('/request-password-change', protect, requestPasswordChange);
router.post('/confirm-password-change', confirmPasswordChange);

export default router;