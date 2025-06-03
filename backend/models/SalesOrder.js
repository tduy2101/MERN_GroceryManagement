// File: backend/models/SalesOrder.js
import mongoose from "mongoose";

const salesOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true, // Validation sẽ báo lỗi nếu trường này không có giá trị khi lưu
    },
    customerName: {
        type: String,
        required: true
    },
    orderDate: { // Trường này bạn đã có, không liên quan trực tiếp đến lỗi nhưng là một phần của schema
        type: Date,
        default: Date.now
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Tham chiếu đến model Product
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1 // Số lượng phải ít nhất là 1
            },
            unitPrice: {
                type: Number,
                required: true,
                min: 0 // Đơn giá không được âm
            },
            total: { // Tổng tiền cho từng sản phẩm (quantity * unitPrice)
                type: Number,
                required: true,
                min: 0
            },
        }
    ],
    totalAmount: { // Tổng tiền của toàn bộ đơn hàng
        type: Number,
        required: true,
        min: 0
    },
    createdBy: { // Người tạo đơn hàng
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu đến model User
        required: true
    }
}, { timestamps: true }); 


const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);

export default SalesOrder;