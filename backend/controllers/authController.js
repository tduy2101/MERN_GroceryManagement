import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';


const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, address, adminInviteToken, profileImageUrl } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        let role = "user";

        if (adminInviteToken) {
            if (adminInviteToken === process.env.ADMIN_INVITE_TOKEN) {
                role = "admin";
            } else {
                return res.status(400).json({ message: "Invalid Admin Invite Token." });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ 
            name,
            email,
            password: hashedPassword,
            role,
            address, 
            profileImageUrl
        });

        const createdUser = await newUser.save();

        res.status(201).json({
            _id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role,
            address: createdUser.address, // Trả về address
            profileImageUrl: createdUser.profileImageUrl,
            token: generateToken(createdUser._id)
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            address: user.address, 
            profileImageUrl: user.profileImageUrl,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const sendPasswordChangeConfirmationEmail = async (userEmail, userName, confirmationLink) => {
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, 
        },
    });

    // Thiết lập nội dung email
    let mailOptions = {
        from: `"DGang Store" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Xác nhận thay đổi mật khẩu cho tài khoản của bạn',
        html: `
            <p>Chào ${userName},</p>
            <p>Chúng tôi nhận được yêu cầu thay đổi mật khẩu cho tài khoản của bạn.</p>
            <p>Vui lòng nhấp vào liên kết bên dưới để xác nhận thay đổi. Liên kết này sẽ hết hạn sau 15 phút.</p>
            <a href="${confirmationLink}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Xác nhận Thay Đổi Mật Khẩu</a>
            <p>Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br/>From Tduy</p>
        `,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Password change confirmation email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending password change confirmation email:', error);
        return false;
    }
};

// YÊU CẦU THAY ĐỔI MẬT KHẨU 
const requestPasswordChange = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id; 

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
        }

        if (newPassword === currentPassword) { 
            return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' });
        }
        const isNewPasswordSameAsOldHashed = await bcrypt.compare(newPassword, user.password);
        if (isNewPasswordSameAsOldHashed) {
            return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' });
        }

        const confirmationToken = crypto.randomBytes(32).toString('hex');

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await PasswordResetToken.deleteMany({ userId: user._id });

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

        await new PasswordResetToken({
            userId: user._id,
            token: confirmationToken,
            newPassword: hashedNewPassword, 
            expiresAt,
        }).save();

        const confirmationLink = `${process.env.FRONTEND_URL}/confirm-password-change?token=${confirmationToken}`;
        const emailSent = await sendPasswordChangeConfirmationEmail(user.email, user.name, confirmationLink);

        if (!emailSent) {
            return res.status(500).json({ message: 'Không thể gửi email xác nhận. Vui lòng thử lại sau.' });
        }

        res.status(200).json({ message: 'Yêu cầu đổi mật khẩu đã được gửi. Vui lòng kiểm tra email để xác nhận.' });

    } catch (error) {
        console.error('Request Password Change Error:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xử lý yêu cầu.', error: error.message });
    }
};

// XÁC NHẬN THAY ĐỔI MẬT KHẨU 
const confirmPasswordChange = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token xác nhận là bắt buộc.' });
    }

    try {
        const passwordResetRecord = await PasswordResetToken.findOne({ token });

        if (!passwordResetRecord) {
            return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }

        if (passwordResetRecord.expiresAt < new Date()) {
            await PasswordResetToken.deleteOne({ _id: passwordResetRecord._id }); 
            return res.status(400).json({ message: 'Token đã hết hạn. Vui lòng yêu cầu lại.' });
        }

        const user = await User.findById(passwordResetRecord.userId);
        if (!user) {
            await PasswordResetToken.deleteOne({ _id: passwordResetRecord._id });
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        user.password = passwordResetRecord.newPassword;
        await user.save();

        await PasswordResetToken.deleteOne({ _id: passwordResetRecord._id });

        res.status(200).json({ message: 'Mật khẩu của bạn đã được thay đổi thành công.' });

    } catch (error) {
        console.error('Confirm Password Change Error:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xác nhận thay đổi mật khẩu.', error: error.message });
    }
};


const updateUserProfile = async (req, res) => {
    try {
        const { name, address, profileImageUrl } = req.body;
        const userId = req.user._id; 

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name !== undefined) user.name = name;
        if (address !== undefined) user.address = address;
        if (profileImageUrl !== undefined) user.profileImageUrl = profileImageUrl;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            address: updatedUser.address,
            profileImageUrl: updatedUser.profileImageUrl,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    requestPasswordChange,    
    confirmPasswordChange    
}


