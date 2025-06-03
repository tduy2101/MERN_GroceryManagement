import { API_PATHS } from "./apiPath";
import axiosInstance from "./axiosInstance";

const uploadImage = async (imageFile) => {
    
    if (!imageFile) {
        console.error("[uploadImage] No imageFile provided.");
        throw new Error("No image file provided for upload."); 
    }

    const formData = new FormData();
    formData.append("image", imageFile);

    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
    }

    try {
        const response = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

export default uploadImage;