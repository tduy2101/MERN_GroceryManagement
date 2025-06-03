import PurchaseOrder from "../models/PurchaseOrder.js";
import Product from "../models/Product.js";

// Helper: Cập nhật tồn kho khi tạo/xóa/sửa phiếu
const adjustStockOnPurchase = async (products, action = 'add') => {
    for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) throw new Error(`Sản phẩm ${item.product} không tồn tại.`);
        const quantityChange = action === 'add' ? item.quantity : -item.quantity;
        product.quantityInStock += quantityChange;
        await product.save();
    }
};

async function generateUniquePONumber(attemptLimit = 10) { 
    const prefix = "PO-";
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); 
    let attempt = 0;
    let candidatePONumber;
    let existingOrder;

    do {
        attempt++;

        const timeComponent = Date.now().toString().slice(-5); 
        const randomComponent = Math.random().toString(36).substring(2, 7).toUpperCase(); 

        candidatePONumber = `${prefix}${datePart}-${timeComponent}-${randomComponent}`;
        try {
            existingOrder = await PurchaseOrder.findOne({ poNumber: candidatePONumber });
        } catch (dbError) {
            console.error("[PO Controller] Database error while checking poNumber uniqueness:", dbError);
            throw new Error("Lỗi truy vấn cơ sở dữ liệu khi tạo mã phiếu nhập.");
        }

        if (existingOrder) {
            if (attempt >= attemptLimit) { 
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    } while (existingOrder && attempt < attemptLimit);

    if (existingOrder) { 
        console.error(`[PO Controller] Failed to generate a unique poNumber after ${attemptLimit} attempts.`);
        const emergencyRandom = Math.random().toString(36).substring(2, 10).toUpperCase();
        candidatePONumber = `${prefix}${datePart}-${timeComponent}-${randomComponent}-${emergencyRandom}`;
        try {
            existingOrder = await PurchaseOrder.findOne({ poNumber: candidatePONumber });
            if (existingOrder) {
                throw new Error('Không thể tạo mã phiếu nhập duy nhất sau nhiều nỗ lực. Hệ thống có thể đang gặp tải cao.');
            }
        } catch (dbError) {
            throw new Error("Lỗi truy vấn cơ sở dữ liệu trong lần thử khẩn cấp.");
        }
    }
    return candidatePONumber;
}

export const createPurchaseOrder = async (req, res) => {
    try {
        // Kiểm tra người dùng (quan trọng)
        if (!req.user || !req.user._id) {
            console.error("[PO Controller] Auth Error: User not authenticated.");
            return res.status(401).json({ message: "Yêu cầu xác thực người dùng." });
        }
        const createdBy = req.user._id;

        const { supplier, products } = req.body;

        // Kiểm tra dữ liệu đầu vào cơ bản
        if (!supplier || !products || products.length === 0) {
            return res.status(400).json({ message: "Nhà cung cấp và danh sách sản phẩm không được để trống." });
        }

        // Tính total cho từng sản phẩm + tổng phiếu
        let totalAmount = 0;
        const detailedProducts = products.map(item => {
            if (!item.product || item.quantity == null || item.unitPrice == null) {
                throw new Error("Dữ liệu sản phẩm không hợp lệ: thiếu thông tin sản phẩm, số lượng hoặc đơn giá.");
            }
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            if (isNaN(quantity) || quantity <= 0 || isNaN(unitPrice) || unitPrice < 0) {
                throw new Error("Số lượng phải lớn hơn 0 và đơn giá không được âm.");
            }
            const total = quantity * unitPrice;
            totalAmount += total;
            return { ...item, quantity, unitPrice, total };
        });

        const poNumber = await generateUniquePONumber(); // Gọi hàm helper

        const newOrderData = {
            poNumber, // GÁN poNumber VÀO ĐÂY
            supplier,
            products: detailedProducts,
            totalAmount,
            createdBy,
        };
        const newOrder = await PurchaseOrder.create(newOrderData);

        await adjustStockOnPurchase(detailedProducts, 'add');

        res.status(201).json(newOrder);

    } catch (err) {
        console.error("[PO Controller] Error in createPurchaseOrder:", err);
        // Cải thiện xử lý lỗi
        if (err.code === 11000) { // Lỗi duplicate key từ MongoDB
            const duplicatedField = Object.keys(err.keyValue)[0];
            return res.status(400).json({ message: `Lỗi tạo phiếu nhập: Giá trị cho '${duplicatedField}' đã tồn tại.`, details: err.keyValue });
        }
        if (err.name === 'ValidationError') { // Lỗi validation từ Mongoose
            return res.status(400).json({ message: `Lỗi dữ liệu: ${err.message}`, errors: err.errors });
        }
        // Các lỗi khác do throw new Error()
        return res.status(400).json({ message: err.message || "Thao tác phiếu nhập thất bại." });
    }
};

export const getAllPurchaseOrders = async (req, res) => {
    try {
        const orders = await PurchaseOrder.find().populate('supplier').populate('createdBy').populate('products.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getPurchaseOrderById = async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id).populate('supplier').populate('createdBy').populate('products.product');
        if (!order) return res.status(404).json({ message: "Không tìm thấy phiếu nhập." });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updatePurchaseOrder = async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy phiếu nhập." });

        // Trả lại tồn kho cũ
        await adjustStockOnPurchase(order.products, 'remove');

        // Cập nhật thông tin mới
        const { supplier, products } = req.body;
        let totalAmount = 0;
        const updatedProducts = products.map(item => {
            const total = item.quantity * item.unitPrice;
            totalAmount += total;
            return { ...item, total };
        });

        order.supplier = supplier;
        order.products = updatedProducts;
        order.totalAmount = totalAmount;
        await order.save();

        // Cập nhật tồn kho mới
        await adjustStockOnPurchase(products, 'add');

        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const deletePurchaseOrder = async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy phiếu nhập." });

        // Trừ tồn kho
        await adjustStockOnPurchase(order.products, 'remove');

        await order.deleteOne();
        res.json({ message: "Xóa phiếu nhập thành công." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
