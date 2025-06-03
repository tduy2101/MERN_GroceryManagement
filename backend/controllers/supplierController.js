// controllers/supplierController.js
import SupplierModal from '../models/Suppliers.js'; // Điều chỉnh đường dẫn nếu cần
import mongoose from 'mongoose';


export const createSupplier = async (req, res) => {
    const { name, email, number, address } = req.body;

    if (!name || !email || !number || !address) {
        return res.status(400).json({ message: 'Please provide all required fields: name, email, number, address' });
    }

    try {
        const existingSupplierByEmail = await SupplierModal.findOne({ email });
        if (existingSupplierByEmail) {
            return res.status(400).json({success:false, message: `Supplier with email ${email} already exists.` });
        }
        const supplier = new SupplierModal({
            name,
            email, 
            number,
            address,
        });

        const createdSupplier = await supplier.save();
        res.status(201).json({success:true, message: 'Supplier created successfully', supplier: createdSupplier });
    } catch (error) {
        console.error("Error creating supplier:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while creating supplier' });
    }
};

export const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await SupplierModal.find({}).sort({ createdAt: -1 }); // Sắp xếp mới nhất lên trước
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching suppliers' });
    }
};

export const getSupplierById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid supplier ID format' });
    }

    try {
        const supplier = await SupplierModal.findById(id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json(supplier);
    } catch (error) {
        console.error(`Error fetching supplier with ID ${id}:`, error);
        res.status(500).json({ message: 'Server error while fetching supplier' });
    }
};

export const updateSupplier = async (req, res) => {
    const { id } = req.params;
    const { name, email, number, address } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid supplier ID format' });
    }

    try {
        const supplier = await SupplierModal.findById(id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Optional: Check if new email conflicts with another existing supplier
        if (email && email !== supplier.email) {
            const existingSupplierByEmail = await SupplierModal.findOne({ email: email, _id: { $ne: id } });
            if (existingSupplierByEmail) {
                return res.status(400).json({ message: `Another supplier with email ${email} already exists.` });
            }
        }


        supplier.name = name || supplier.name;
        supplier.email = email || supplier.email;
        supplier.number = number || supplier.number;
        supplier.address = address || supplier.address;
        // Note: createdAt should not be updated manually

        const updatedSupplier = await supplier.save();
        res.status(200).json(updatedSupplier);
    } catch (error) {
        console.error(`Error updating supplier with ID ${id}:`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while updating supplier' });
    }
};

export const deleteSupplier = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid supplier ID format' });
    }

    try {
        const supplier = await SupplierModal.findById(id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        await supplier.deleteOne(); // or supplier.remove() for older Mongoose versions
        res.status(200).json({ message: 'Supplier removed successfully' });
    } catch (error) {
        console.error(`Error deleting supplier with ID ${id}:`, error);
        res.status(500).json({ message: 'Server error while deleting supplier' });
    }
};