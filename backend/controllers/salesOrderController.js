import SalesOrder from "../models/SalesOrder.js";
import Product from "../models/Product.js";

// Helper: Cập nhật tồn kho khi tạo/xóa/sửa phiếu xuất
const adjustStockOnSale = async (products, action = 'remove') => {
    for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) throw new Error(`Sản phẩm ${item.product} không tồn tại.`);
        const quantityChange = action === 'remove' ? -item.quantity : item.quantity;

        // Kiểm tra tồn kho không đủ
        if (action === 'remove' && product.quantityInStock < item.quantity) {
            throw new Error(`Sản phẩm ${product.name} không đủ tồn kho để xuất.`);
        }

        product.quantityInStock += quantityChange;
        await product.save();
    }
};

async function generateUniqueOrderNumber() {
    const prefix = "SO-";
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    let attempt = 0;
    let candidateOrderNumber;
    let existingOrder;

    do {
        attempt++;
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 ký tự ngẫu nhiên
        candidateOrderNumber = `${prefix}${datePart}-${randomPart}`;

        // Quan trọng: 'SalesOrder' phải là tên model đã được đăng ký với Mongoose.
        existingOrder = await SalesOrder.findOne({ orderNumber: candidateOrderNumber }); // Sử dụng model SalesOrder đã import

        if (existingOrder) {
            console.log(`[Controller] Candidate orderNumber '${candidateOrderNumber}' already exists. Retrying...`);
        }
    } while (existingOrder && attempt < 10);

    if (existingOrder && attempt >= 10) {
        console.error('[Controller] Failed to generate a unique orderNumber after multiple attempts.');
        throw new Error('Không thể tạo mã đơn hàng duy nhất sau nhiều lần thử. Vui lòng thử lại sau.');
    }
    return candidateOrderNumber;
}

export const createSalesOrder = async (req, res) => {
    try {
        // Kiểm tra req.user
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Lỗi xác thực: Người dùng không hợp lệ hoặc thiếu thông tin." });
        }

        const { customerName, products } = req.body;
        const createdBy = req.user._id;

        let totalAmount = 0;
        const detailedProducts = products.map(item => {
            const total = item.quantity * item.unitPrice;
            totalAmount += total;
            return { ...item, total };
        });

        // 1. Tạo orderNumber trước
        const orderNumber = await generateUniqueOrderNumber(); // Gọi hàm helper

        // 2. Điều chỉnh tồn kho
        await adjustStockOnSale(products, 'remove');

        // 3. Tạo đơn hàng với orderNumber đã có
        const newOrder = await SalesOrder.create({
            orderNumber, // Thêm orderNumber vào đây
            customerName,
            products: detailedProducts,
            totalAmount,
            createdBy,
        });

        res.status(201).json(newOrder);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Lỗi tạo đơn hàng: Mã đơn hàng hoặc thông tin khác bị trùng lặp.", details: err.keyValue });
        }
        if (err.message.includes("không đủ tồn kho") || err.message.includes("không tồn tại") || err.message.includes("Không thể tạo mã đơn hàng duy nhất")) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Thao tác tạo phiếu xuất thất bại. Vui lòng thử lại sau.", error: err.message });
    }
};

export const getAllSalesOrders = async (req, res) => {
    try {
        const orders = await SalesOrder.find().populate('createdBy').populate('products.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getSalesOrderById = async (req, res) => {
    try {
        const order = await SalesOrder.findById(req.params.id).populate('createdBy').populate('products.product');
        if (!order) return res.status(404).json({ message: "Không tìm thấy phiếu xuất." });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateSalesOrder = async (req, res) => {
    try {
        const order = await SalesOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy phiếu xuất." });

        // Hoàn trả tồn kho cũ
        await adjustStockOnSale(order.products, 'add');

        const { customerName, products } = req.body;
        let totalAmount = 0;
        const updatedProducts = products.map(item => {
            const total = item.quantity * item.unitPrice;
            totalAmount += total;
            return { ...item, total };
        });

        await adjustStockOnSale(products, 'remove');

        order.customerName = customerName;
        order.products = updatedProducts;
        order.totalAmount = totalAmount;
        await order.save();

        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const deleteSalesOrder = async (req, res) => {
    try {
        const order = await SalesOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy phiếu xuất." });

        await adjustStockOnSale(order.products, 'add');

        await order.deleteOne();
        res.json({ message: "Xóa phiếu xuất thành công." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
