import express from 'express';
import { registerUser, loginUser, 
        getUserProfile, updateUserProfile, 
        requestPasswordChange, confirmPasswordChange } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile-user', protect, getUserProfile);
router.put('/profile-user/update', protect, updateUserProfile);

// router.post('/upload-image', upload.single("image"), (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ message: 'Image URL is required' });
//     }

//     const imgUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
//     res.json({ message: 'Image uploaded successfully', imageUrl: imgUrl });

// });

router.post('/upload-image', protect, upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // Lấy uploadType từ query parameter (ví dụ: /upload-image?type=avatar)
    const uploadType = req.query.type; // Hoặc const uploadType = req.body.uploadType;

    let cloudinaryOptions = {
        resource_type: "auto",
        folder: "Mern-grocery/others"
    };


    if (uploadType === 'avatar') {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'User not authenticated for avatar upload.' });
        }
        cloudinaryOptions.folder = "Mern-grocery/user_avatars";
        cloudinaryOptions.public_id = `user_${req.user._id}_avatar`;
        cloudinaryOptions.overwrite = true;
    } else if (uploadType === 'product') {
        cloudinaryOptions.folder = "Mern-grocery/product_images";
    } 
    // Nếu uploadType không được cung cấp hoặc không khớp, nó sẽ dùng folder "Mern-grocery/others"

    try {
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            cloudinaryOptions
        );

        if (!result || !result.secure_url) {
            throw new Error('Cloudinary upload failed to return a secure URL.');
        }

        res.json({
            success: true,
            message: `Image uploaded successfully to folder: ${cloudinaryOptions.folder}!`,
            imageUrl: result.secure_url,
            publicId: result.public_id,
            uploadType: uploadType
        });

    } catch (error) {
        console.error(`Error uploading image to Cloudinary (type: ${uploadType}):`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image.',
            error: error.message
        });
    }
});

router.post('/request-password-change', protect, requestPasswordChange);
router.post('/confirm-password-change', confirmPasswordChange);

export default router;