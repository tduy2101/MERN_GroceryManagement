import axios from 'axios';
import { API_PATHS, BASE_URL } from './apiPath'; // Đảm bảo đường dẫn đúng

// Hàm uploadImage giờ sẽ nhận thêm tham số 'uploadType'
const uploadImage = async (file, uploadType = 'other') => { // Mặc định là 'other' nếu không truyền
    if (!file) {
        throw new Error("No file provided to uploadImage function.");
    }

    const formData = new FormData();
    formData.append('image', file);
    // Nếu backend đọc uploadType từ req.body, bạn sẽ append nó vào formData:
    // formData.append('uploadType', uploadType);

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            // Xử lý trường hợp không có token nếu endpoint yêu cầu (như endpoint của bạn có 'protect')
            console.error("No token found for authenticated request.");
            throw new Error("Authentication token not found."); 
        }

        const endpointUrl = `${BASE_URL}${API_PATHS.IMAGE.UPLOAD_IMAGE}?type=${encodeURIComponent(uploadType)}`;

        const response = await axios.post(
            endpointUrl,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token && { Authorization: `Bearer ${token}` }), // Chỉ thêm header Auth nếu có token
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error in uploadImage utility:", error);
        // Ném lỗi ra ngoài để component gọi có thể bắt và hiển thị toast
        throw error.response?.data || new Error(error.message || "Image upload failed.");
    }
};

export default uploadImage;