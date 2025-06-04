// import multer from "multer";
// import fs from "fs";
// import path from "path";

// // Đặt đường dẫn đầy đủ đến thư mục uploads 
// const uploadDir = path.join(process.cwd(), 'uploads');


// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//         cb(null, file.fieldname + "-" + uniqueSuffix + ".jpg");
//     },
// });

// const fileFilter = (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
//     if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//     } else {
//         cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false);
//     }
// };
// const upload = multer({ storage, fileFilter });

// export default upload;

// ==================================================================================
import multer from "multer";

// Không cần fs hay path cho thư mục uploads cục bộ nữa

const storage = multer.memoryStorage(); // Lưu file vào bộ nhớ, không phải disk

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]; // Thêm webp nếu muốn
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, JPG, WEBP are allowed."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn kích thước file 5MB, ví dụ
});

export default upload;