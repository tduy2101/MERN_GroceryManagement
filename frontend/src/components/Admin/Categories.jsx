import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { API_PATHS, BASE_URL } from "../../utils/apiPath"; // Đảm bảo đường dẫn đúng
import { FaEdit, FaTrashAlt, FaPlus, FaSpinner, FaExclamationTriangle, FaTags } from 'react-icons/fa';

// ----- Constants -----
const TOKEN_KEY = "token";
const initialFormData = { name: "", description: "" };
const commonInputClass = "block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-slate-50 disabled:cursor-not-allowed";
const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
const requiredSpan = <span className="text-red-500 ml-0.5">*</span>;

// ----- UI Components -----
const GlobalLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-gray-500">
        <FaSpinner className="animate-spin text-5xl mb-4 text-primary" />
        <span className="text-lg">Đang tải danh mục...</span>
    </div>
);

const GlobalError = ({ globalError, fetchCategories, isLoadingData }) => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center text-red-600 p-6 bg-red-50 rounded-lg shadow">
        <FaExclamationTriangle className="text-5xl mb-4" />
        <p className="text-xl font-semibold mb-2">Rất tiếc! Đã có lỗi xảy ra.</p>
        <p className="text-md mb-3">{globalError}</p>
        <button
            onClick={fetchCategories}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium flex items-center gap-2"
            disabled={isLoadingData}
        >
            {isLoadingData ? <FaSpinner className="animate-spin" /> : 'Thử lại'}
        </button>
    </div>
);

const NoCategories = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
        <FaTags className="text-5xl mb-4" />
        <p className="text-lg mb-1">Không tìm thấy danh mục nào.</p>
        <p className="text-sm">Bạn có thể bắt đầu bằng cách thêm danh mục mới.</p>
    </div>
);

const Categories = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [categories, setCategories] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    // ----- Data Fetching -----
    const fetchCategories = useCallback(async () => {
        setIsLoadingData(true);
        setGlobalError(null);
        try {
            const response = await axios.get(`${BASE_URL}${API_PATHS.CATEGORY.GET_ALL_CATEGORIES}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
            });
            const data = response.data?.data || response.data;
            if (Array.isArray(data)) {
                setCategories(data);
            } else {
                const msg = response.data?.message || "Lấy danh sách danh mục thất bại: Dữ liệu không mong muốn.";
                setGlobalError(msg); setCategories([]); toast.error(msg);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Lấy danh sách danh mục thất bại.";
            setGlobalError(errorMessage); setCategories([]); toast.error(errorMessage);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // ----- Handlers -----
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleEditClick = useCallback((category) => {
        setEditingCategoryId(category._id);
        setFormData({
            name: category.name || '',
            description: category.description || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingCategoryId(null);
        setFormData(initialFormData);
        setGlobalError(null);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Tên danh mục không được để trống.");
            return;
        }
        setIsSubmitting(true);
        setGlobalError(null);

        const headers = {
            "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
            "Content-Type": "application/json",
        };
        let apiPromise;

        if (editingCategoryId) {
            apiPromise = axios.put(`${BASE_URL}${API_PATHS.CATEGORY.UPDATE_CATEGORY(editingCategoryId)}`, formData, { headers });
        } else {
            apiPromise = axios.post(`${BASE_URL}${API_PATHS.CATEGORY.CREATE_CATEGORY}`, formData, { headers });
        }

        try {
            const response = await apiPromise;
            if (response.data && (response.data.success === true || response.status === 200 || response.status === 201)) {
                toast.success(response.data.message || `Danh mục đã được ${editingCategoryId ? 'cập nhật' : 'thêm'} thành công!`);
                handleCancelEdit();
                fetchCategories();
            } else {
                const msg = response.data?.message || `Lỗi khi ${editingCategoryId ? 'cập nhật' : 'thêm'} danh mục.`;
                setGlobalError(msg);
                toast.error(msg);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || `Không thể ${editingCategoryId ? 'cập nhật' : 'thêm'} danh mục.`;
            setGlobalError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, editingCategoryId, fetchCategories, handleCancelEdit]);

    const handleDelete = useCallback(async (categoryId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này? Hành động này có thể ảnh hưởng đến các sản phẩm liên quan.")) {
            setIsSubmitting(true);
            setGlobalError(null);
            try {
                const response = await axios.delete(`${BASE_URL}${API_PATHS.CATEGORY.DELETE_CATEGORY(categoryId)}`, {
                    headers: { "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
                });
                if (response.data && (response.data.success === true || response.status === 200)) {
                    toast.success(response.data.message || "Xóa danh mục thành công!");
                    fetchCategories();
                } else {
                    toast.error(response.data?.message || "Lỗi khi xóa danh mục.");
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || "Không thể xóa danh mục.";
                setGlobalError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [fetchCategories]);

    // ----- Render Logic -----
    const isAnyTaskRunning = isSubmitting || isLoadingData;

    if (isLoadingData && categories.length === 0) return <GlobalLoading />;
    if (!isLoadingData && globalError && categories.length === 0) return <GlobalError globalError={globalError} fetchCategories={fetchCategories} isLoadingData={isLoadingData} />;

    return (
        <div className='w-full min-h-screen flex flex-col gap-6 p-4 sm:p-6 bg-slate-50'> 
            <div className="pb-4 border-b border-slate-200"> 
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Quản Lý Danh Mục</h1> 
            </div>

            {globalError && categories.length > 0 && (
                <div className="my-4 p-3 text-sm text-center text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center gap-2">
                    <FaExclamationTriangle /> {globalError}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Form Section */}
                <div className="lg:w-1/3 xl:w-1/4 bg-white shadow-xl rounded-xl p-5 sm:p-6 self-start">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-700 mb-5 sm:mb-6 text-center border-b border-slate-200 pb-3">
                        {editingCategoryId ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
                    </h2>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="categoryName" className={commonLabelClass}>Tên Danh Mục {requiredSpan}</label>
                            <input type="text" id="categoryName" name="name" value={formData.name} onChange={handleChange} placeholder="VD: Đồ điện tử" className={commonInputClass} required disabled={isSubmitting} />
                        </div>
                        <div>
                            <label htmlFor="categoryDescription" className={commonLabelClass}>Mô Tả <span className="text-xs text-gray-500">(Không bắt buộc)</span></label>
                            <textarea id="categoryDescription" name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả ngắn về danh mục" rows="3" className={`${commonInputClass} min-h-[70px]`} disabled={isSubmitting}></textarea>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-3">
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <><FaSpinner className="animate-spin -ml-1 mr-2.5 h-5 w-5" /> {editingCategoryId ? "Đang lưu..." : "Đang thêm..."}</>
                                ) : (
                                    <>{editingCategoryId ? <FaEdit className="mr-2" /> : <FaPlus className="mr-2" />} {editingCategoryId ? "Lưu Thay Đổi" : "Thêm Danh Mục"}</>
                                )}
                            </button>
                            {editingCategoryId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Categories List Section */}
                <div className="lg:w-2/3 xl:w-3/4">
                    <div className="bg-white shadow-xl rounded-xl p-1 sm:p-2 md:p-4">
                        <div className="overflow-x-auto">
                            {!isLoadingData && categories.length === 0 && !globalError ? <NoCategories /> : (
                                <table className="w-full text-sm text-left text-gray-700">
                                    <thead className="text-xs text-white uppercase bg-primary whitespace-nowrap">
                                        <tr>
                                            {['#', 'Tên Danh Mục', 'Mô Tả', 'Hành Động'].map(header => (
                                                <th key={header} scope="col" className="px-3 sm:px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map((category, index) => (
                                            <tr key={category._id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                <td className="px-3 sm:px-4 py-3 text-slate-500">{index + 1}</td>
                                                <td className="px-3 sm:px-4 py-3 font-medium text-slate-900">{category.name}</td>
                                                <td className="px-3 sm:px-4 py-3 text-slate-600 whitespace-normal break-words max-w-md">{category.description || 'Không có'}</td>
                                                <td className="px-3 sm:px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                        <button
                                                            title="Chỉnh sửa danh mục"
                                                            className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleEditClick(category)}
                                                            disabled={isAnyTaskRunning}
                                                        >
                                                            <FaEdit size={15} />
                                                        </button>
                                                        <button
                                                            title="Xóa danh mục"
                                                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleDelete(category._id)}
                                                            disabled={isAnyTaskRunning}
                                                        >
                                                            <FaTrashAlt size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {isLoadingData && categories.length > 0 &&
                                <div className="text-center py-3 text-sm text-slate-500 flex items-center justify-center">
                                    <FaSpinner className="animate-spin inline mr-2" />Đang cập nhật danh sách...
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;