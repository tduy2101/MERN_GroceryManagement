import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sku: { 
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    sellingPrice: {
        type: Number,
        required: true,
        min: 0
    },
    costPrice: { 
        type: Number,
        required: true, 
        default: 0,
        min: 0
    },
    quantityInStock: { 
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    imageUrl: {
        type: String,
        default: null,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    supplier: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: false, 
    },
    unit: { 
        type: String,
        default: 'Cái',
        trim: true
    },
    lowStockThreshold: { 
        type: Number,
        default: 10,
        min: 0
    },
}, {
    timestamps: true,
});

export default mongoose.model('Product', productSchema);