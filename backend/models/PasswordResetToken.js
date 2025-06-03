import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    newPassword: { 
        type: String,
        required: true
    },
    createdAt: { 
        type: Date,
        default: Date.now
    },
    expiresAt: { 
        type: Date,
        required: true,
    }
});


passwordResetTokenSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('PasswordResetToken', passwordResetTokenSchema);