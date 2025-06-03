import React, { useRef, useState, useEffect } from "react"; // Thêm useEffect
import { LuUser, LuUpload, LuTrash } from "react-icons/lu";

const ProfilePhotoSelector = ({ currentImageUrl, image, setImage, disabled }) => {
    const inputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // useEffect để hiển thị currentImageUrl ban đầu hoặc khi nó thay đổi từ prop
    // và khi không có file mới nào đang được preview (image là null)
    useEffect(() => {
        if (currentImageUrl && !image) { // Chỉ set nếu có currentImageUrl và chưa chọn file mới
            setPreviewUrl(currentImageUrl);
        } else if (!image) {
            setPreviewUrl(null);
        }

    }, [currentImageUrl, image]);


    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImage(file); // Cập nhật state image với File object
            const preview = URL.createObjectURL(file);
            setPreviewUrl(preview); // Cập nhật preview cho ảnh mới chọn
        }
    };

    const handleRemoveImage = () => {
        setImage(null); // Xóa File object
        setPreviewUrl(currentImageUrl || null); // Quay lại hiển thị ảnh hiện tại (nếu có) hoặc không có gì
        if (inputRef.current) {
            inputRef.current.value = ""; // Reset input file để có thể chọn lại cùng file
        }
    };

    const onChooseFile = () => {
        if (inputRef.current && !disabled) {
            inputRef.current.click();
        }
    };

    const displayUrl = previewUrl;

    return (
        <div className="flex justify-center mb-6">
            <input
                type="file"
                accept="image/*"
                ref={inputRef}
                onChange={handleImageChange}
                className="hidden"
                disabled={disabled} // Vô hiệu hóa input nếu component bị disabled
            />

            {/* Main circle container */}
            <div className="w-20 h-20 flex items-center justify-center bg-slate-300  rounded-full relative cursor-pointer">
                {displayUrl ? (
                    <img
                        src={displayUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover" 
                    />
                ) : (
                    <LuUser className="text-4xl text-primary" />
                )}

                {/* Nút thay đổi/upload ảnh */}
                {!image && (
                    <button
                        type="button"
                        onClick={onChooseFile}
                        disabled={disabled}
                        title="Chọn ảnh mới"
                        className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full absolute -bottom-1 -right-1 cursor-pointer"
                    >
                        <LuUpload />
                    </button>
                )}

                {/* Nút xóa ảnh đã chọn */}
                {image && (
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={disabled}
                        title="Xóa ảnh đã chọn"
                        className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full absolute -bottom-1 -right-1 cursor-pointer"
                    >
                        <LuTrash />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfilePhotoSelector;