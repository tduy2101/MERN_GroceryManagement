import Category from '../models/Category.js';
import { formatCategoryResponse } from '../utils/helper.js';


export const createCategory = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }

    try {
        const categoryExists = await Category.findOne({ categoryName: name });
        if (categoryExists) {
            return res.status(400).json({ message: 'Danh mục với tên này đã tồn tại' });
        }

        const category = new Category({
            categoryName: name,
            categoryDescription: description,
        });

        const createdCategory = await category.save();

        res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            category: formatCategoryResponse(createdCategory),
        });
    } catch (error) {
        console.error("Lỗi khi tạo danh mục:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo danh mục' });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        const formattedCategories = categories.map(formatCategoryResponse);
        res.json(formattedCategories);
    } catch (error) {
        console.error("Lỗi khi lấy tất cả danh mục:", error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách danh mục' });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            res.json(formatCategoryResponse(category));
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
    } catch (error) {
        console.error(`Lỗi khi lấy danh mục ${req.params.id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Không tìm thấy danh mục (ID không hợp lệ)' });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin danh mục' });
    }
};

export const updateCategory = async (req, res) => {
    const { name, description } = req.body;
    const { id } = req.params;

    try {
        // Kiểm tra nếu tên mới được cung cấp và nó đã tồn tại cho một danh mục khác
        if (name) {
            const existingCategory = await Category.findOne({ categoryName: name, _id: { $ne: id } });
            if (existingCategory) {
                return res.status(400).json({ message: 'Tên danh mục đã được sử dụng bởi danh mục khác' });
            }
        }

        const updateData = {};
        if (name) updateData.categoryName = name;
        // Cho phép xóa description bằng cách gửi giá trị rỗng hoặc null
        if (description !== undefined) updateData.categoryDescription = description;


        // Nếu không có gì để cập nhật, trả về lỗi hoặc thông báo
        if (Object.keys(updateData).length === 0 && (req.body.description === undefined && !req.body.name)) {
            return res.status(400).json({ message: 'Không có thông tin nào được cung cấp để cập nhật.' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true, context: 'query' } // runValidators quan trọng khi dùng findByIdAndUpdate
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục để cập nhật' });
        }

        res.json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            category: formatCategoryResponse(updatedCategory)
        });

    } catch (error) {
        console.error(`Lỗi khi cập nhật danh mục ${id}:`, error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Không tìm thấy danh mục (ID không hợp lệ)' });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật danh mục' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (category) {
            res.json({ success: true, message: 'Danh mục đã được xóa' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục để xóa' });
        }
    } catch (error) {
        console.error(`Lỗi khi xóa danh mục ${req.params.id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Không tìm thấy danh mục (ID không hợp lệ)' });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi xóa danh mục' });
    }
};