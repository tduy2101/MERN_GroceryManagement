import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    poNumber: { // <--- THÊM TRƯỜNG NÀY
        type: String,
        unique: true,    // Để Mongoose nhận biết và có thể quản lý index này
        required: true,  // Để đảm bảo nó luôn có giá trị
        // index: true,  // Có thể thêm nếu muốn Mongoose tạo index, nhưng DB của bạn đã có rồi
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            unitPrice: {
                type: Number,
                required: true,
                min: 0
            },
            total: {
                type: Number,
                required: true,
                min: 0
            },
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);

