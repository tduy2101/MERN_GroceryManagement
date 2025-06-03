import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true,
        maxlength: [100, 'Category name cannot be more than 100 characters']
    },
    categoryDescription: {
        type: String,
        trim: true,
        maxlength: [500, 'Category description cannot be more than 500 characters']
    }
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);