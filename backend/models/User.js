import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        type: String
    },
    profileImageUrl: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'staff', 'customer'],
        default: 'user',
    }
}, {
    timestamps: true,
});

export default mongoose.model('User', userSchema);