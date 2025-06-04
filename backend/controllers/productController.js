import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Suppliers.js';
import {generateUniqueSku} from '../utils/helper.js';

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .populate('supplier', 'name');
        res.json({ success: true, data: products });
    } catch (err) {
        console.error("Error in getAllProducts:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Get single product by ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('supplier', 'name');

        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product });
    } catch (err) {
        console.error("Error in getProductById:", err);
        if (err.kind === 'ObjectId') { // Xử lý lỗi nếu ID không đúng định dạng
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Create new product
const createProduct = async (req, res) => {
    try {
        let { // Sử dụng let để có thể gán lại sku
            name,
            sku, // Giữ nguyên sku từ req.body
            description,
            sellingPrice,
            costPrice,
            quantityInStock,
            imageUrl,
            category,
            supplier,
            unit,
            lowStockThreshold
        } = req.body;

        // --- LOGIC TỰ ĐỘNG TẠO SKU ---
        if (!sku || sku.trim() === "") { 
            const skuBaseName = name ? name.substring(0, 3).toUpperCase().replace(/\s+/g, '') : "PRD";
            sku = await generateUniqueSku(skuBaseName); // Gán SKU mới được tạo
        }
        // --- KẾT THÚC LOGIC TỰ ĐỘNG TẠO SKU ---


        // Validation cơ bản (có thể dùng express-validator để chi tiết hơn)
        if (!name || name.trim() === "" ||
            typeof sellingPrice !== 'number' || sellingPrice < 0 || 
            typeof quantityInStock !== 'number' || quantityInStock < 0 || 
            !category // Category ID vẫn nên được cung cấp
        ) {
            return res.status(400).json({
                success: false,
                message: 'Name, Selling Price (non-negative number), Quantity In Stock (non-negative number), and Category are required fields.'
            });
        }

        // Kiểm tra Category ID (nếu có)
        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({ success: false, message: 'Invalid Category ID provided.' });
            }
        }
        // Kiểm tra Supplier ID (nếu có và không rỗng)
        if (supplier) {
            const supplierExists = await Supplier.findById(supplier);
            if (!supplierExists) {
                return res.status(400).json({ success: false, message: 'Invalid Supplier ID provided.' });
            }
        }

        const productData = {
            name,
            sku, 
            description, sellingPrice, costPrice,
            quantityInStock, imageUrl, category, unit, lowStockThreshold
        };

        if (supplier) {
            productData.supplier = supplier;
        }

        const newProduct = await Product.create(productData);
        const populatedProduct = await Product.findById(newProduct._id)
            .populate('category', 'name')
            .populate('supplier', 'name');

        res.status(201).json({ success: true, data: populatedProduct });
    } catch (err) {
        console.error("Error in createProduct:", err);
        if (err.code === 11000 && err.keyPattern && err.keyPattern.sku) {
            return res.status(400).json({ success: false, message: 'SKU already exists. Please use a unique SKU or let the system generate one.' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation Error', errors: err.errors });
        }
        res.status(500).json({ success: false, message: 'Failed to create product. Please check input data.', error: err.message });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { category, supplier, ...updateData } = req.body; 
        
        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({ success: false, message: 'Invalid Category ID for update.' });
            }
            updateData.category = category; // Gán lại vào updateData
        }

        // Kiểm tra Supplier ID nếu được cung cấp để update
        if (req.body.hasOwnProperty('supplier')) { // Kiểm tra xem supplier có trong body không
            if (supplier) { // Nếu supplier có giá trị (khác null, undefined, "")
                const supplierExists = await Supplier.findById(supplier);
                if (!supplierExists) {
                    return res.status(400).json({ success: false, message: 'Invalid Supplier ID for update.' });
                }
                updateData.supplier = supplier;
            } else { // Nếu supplier là "" hoặc null, cho phép unset (gỡ bỏ supplier)
                updateData.supplier = null;
            }
        }


        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true, // Trả về document đã được cập nhật
            runValidators: true // Chạy validation của schema khi update
        })
            .populate('category', 'name')
            .populate('supplier', 'name');

        if (!updatedProduct) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: updatedProduct });
    } catch (err) {
        console.error("Error in updateProduct:", err);
        if (err.code === 11000 && err.keyPattern && err.keyPattern.sku) {
            return res.status(400).json({ success: false, message: 'SKU already exists. Please use a unique SKU for update.' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation Error', errors: err.errors });
        }
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Delete product - (Không thay đổi nhiều, vẫn ổn)
const deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, message: 'Product deleted successfully', data: deleted }); // Trả về sản phẩm đã xóa
    } catch (err) {
        console.error("Error in deleteProduct:", err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid product ID format' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        // Optional: Kiểm tra categoryId có hợp lệ không
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const products = await Product.find({ category: categoryId })
            .populate('category', 'name')
            .populate('supplier', 'name'); // <-- THÊM POPULATE SUPPLIER
        res.json({ success: true, data: products });
    } catch (err) {
        console.error("Error in getProductsByCategory:", err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid category ID format' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// Search products
const searchProducts = async (req, res) => {
    try {
        const keyword = req.params.key;
        if (!keyword) {
            return res.status(400).json({ success: false, message: 'Search keyword is required.' });
        }
        const products = await Product.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { sku: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        })
            .populate('category', 'name')
            .populate('supplier', 'name');

        res.json({ success: true, data: products });
    } catch (err) {
        console.error("Error in searchProducts:", err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

export {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    searchProducts
};