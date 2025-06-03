import User from '../models/User.js';
import bcrypt from 'bcryptjs';


const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching users.' });
    }
};


const deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        const adminUserId = req.user._id; // ID của admin đang thực hiện request

        // Admin không thể tự xóa tài khoản của mình
        if (userIdToDelete === adminUserId.toString()) {
            return res.status(400).json({ success: false, message: 'Admin cannot delete their own account.' });
        }

        const userToDelete = await User.findById(userIdToDelete);

        if (!userToDelete) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Ngăn chặn xóa admin khác (trừ khi bạn có logic phức tạp hơn cho phép super admin)
        if (userToDelete.role === 'admin') {
            // Bạn có thể thêm logic kiểm tra: nếu là admin cuối cùng thì không cho xóa,
            // hoặc chỉ cho phép xóa nếu admin hiện tại có quyền cao hơn.
            // Hiện tại, để đơn giản, không cho xóa admin khác.
            return res.status(403).json({ success: false, message: 'Cannot delete another admin account through this action. Please manage admin roles carefully.' });
        }

        await User.findByIdAndDelete(userIdToDelete);

        res.status(200).json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ success: false, message: 'Server error while deleting user.', error: error.message });
    }
};


const createUser = async (req, res) => {
    const { name, email, password, address, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    try {
        // Kiểm tra user đã tồn tại chưa
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this email already exists.' });
        }

        // Mã hóa password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            address,
            role,
        });

        const savedUser = await newUser.save();

        // Trả về thông tin user (không có password)
        res.status(201).json({
            success: true,
            message: 'User created successfully!',
            data: {
                _id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                address: savedUser.address,
                role: savedUser.role,
                createdAt: savedUser.createdAt,
                updatedAt: savedUser.updatedAt,
            }
        });

    } catch (error) {
        console.error("Error creating user:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server error while creating user.' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params; // Lấy ID của user cần cập nhật
    const { name, email, address, role, password } = req.body; // Dữ liệu mới từ request
    const adminUserId = req.user._id; // ID của admin đang thực hiện request

    try {
        const userToUpdate = await User.findById(id);

        if (!userToUpdate) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Logic kiểm tra quyền, ví dụ: không cho admin tự hạ vai trò của mình nếu là admin cuối cùng
        if (userToUpdate._id.toString() === adminUserId.toString() && userToUpdate.role === 'admin' && role && role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ success: false, message: "Cannot change the role of the last admin. At least one admin must exist." });
            }
        }

        // Kiểm tra nếu email được thay đổi và email mới đã được sử dụng bởi user khác
        if (email && email.toLowerCase() !== userToUpdate.email.toLowerCase()) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            // Nếu email mới đã tồn tại VÀ nó không thuộc về user đang được cập nhật
            if (emailExists && emailExists._id.toString() !== id) {
                return res.status(400).json({ success: false, message: 'Email already in use by another account.' });
            }
            userToUpdate.email = email.toLowerCase();
        }

        if (name) userToUpdate.name = name;
        if (typeof address === 'string') userToUpdate.address = address; 
        if (role) userToUpdate.role = role;

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            userToUpdate.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await userToUpdate.save();

        const userToReturn = { ...updatedUser.toObject() };
        delete userToReturn.password;

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: userToReturn
        });

    } catch (error) {
        console.error("Update User Error:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server error while updating user.' });
    }
};


export {
    getAllUsers,
    deleteUser,
    createUser,
    updateUser   
};