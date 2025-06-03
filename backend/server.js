import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database_config.js';
import path from 'path';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js'
import supplierRoutes from './routes/supplierRoutes.js';
import productRoutes from './routes/productRoutes.js';



import salesOrderRoutes from './routes/salesOrderRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;


// Cấu hình middleware để cho phép CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || "*", // Cho phép domain từ biến môi trường, hoặc tất cả (*) nếu không có
    methods: ["GET", "POST", "PUT", "DELETE"], // Các HTTP method được phép
    allowedHeaders: ["Content-Type", "Authorization"] // Các header được chấp nhận từ client
}));

//  Config app
app.use(express.json()); // middleware parse the raw data to JSON 
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/product", productRoutes);

app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/sales-orders', salesOrderRoutes);



// Serve static files 
const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, '/frontend/dist')));
    app.get(/^(?!\/api).*$/, (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.get('/', (req, res) => {
    res.send('API is running...');
});


app.listen(PORT, () => {
    connectDB();
    console.log("Server start at http://localhost:" + PORT);
})

