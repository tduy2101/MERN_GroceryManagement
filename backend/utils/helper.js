import crypto from 'crypto';
import Product from '../models/Product.js';

export const generateUniqueSku = async (baseName = "PROD") => {
    let sku;
    let isUnique = false;
    const timestampPart = Date.now().toString(36).toUpperCase();

    while (!isUnique) {
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        sku = `${baseName}-${timestampPart}-${randomPart}`;
        const existingProduct = await Product.findOne({ sku });
        if (!existingProduct) {
            isUnique = true;
        }
    }
    return sku;
};


export const formatCategoryResponse = (category) => {
    if (!category) return null;
    return {
        _id: category._id,
        name: category.categoryName,
        description: category.categoryDescription,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
    };
};