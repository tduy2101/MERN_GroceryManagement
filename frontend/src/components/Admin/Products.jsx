import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_PATHS, BASE_URL } from '../../utils/apiPath'; // Đảm bảo đường dẫn đúng
import toast from 'react-hot-toast';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaTimes, FaLink, FaSpinner, FaBoxOpen, FaImage, FaSave } from 'react-icons/fa'; // Thêm FaImage
import uploadImage from '../../utils/uploadImage'; // Đảm bảo đường dẫn đúng

// ----- Constants & UI Components -----
const initialFormData = {
    name: '',
    sku: '',
    description: '',
    sellingPrice: '',
    costPrice: '',
    quantityInStock: '',
    imageUrl: '',
    category: '',
    supplier: '',
    unit: 'Cái', // Đơn vị mặc định
    lowStockThreshold: '10', // Ngưỡng tồn kho thấp mặc định
};
const commonInputClass = "block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-slate-50 disabled:cursor-not-allowed";
const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
const requiredSpan = <span className="text-red-500 ml-0.5">*</span>;

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <FaSpinner className="animate-spin text-4xl mb-3 text-primary" />
        <span>Đang tải sản phẩm...</span>
    </div>
);

const NoProductsState = ({ onAdd }) => (
    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
        <FaBoxOpen className="text-5xl mb-4" />
        <p className="text-lg mb-1">Không tìm thấy sản phẩm nào.</p>
        <p className="text-sm mb-4">Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn.</p>
        <button
            onClick={onAdd}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
        >
            <FaPlus /> Thêm Sản Phẩm Mới
        </button>
    </div>
);

const NoSearchResultsState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <FaSearch className="text-5xl mb-3" />
        <span className="text-lg">Không có sản phẩm nào khớp với tìm kiếm.</span>
        <span className="text-sm">Hãy thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</span>
    </div>
);

const Products = () => {
    const [addEditModal, setAddEditModal] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoadingData, setIsLoadingData] = useState(false); // Đổi tên từ loading để rõ ràng hơn
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [currentProductId, setCurrentProductId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [imageFile, setImageFile] = useState(null);

    const handleOpenAddModal = useCallback(() => {
        setFormData(initialFormData);
        setImageFile(null);
        setCurrentProductId(null);
        setAddEditModal('ADD');
    }, []);

    const handleOpenEditModal = useCallback((product) => {
        setFormData({
            name: product.name || '',
            sku: product.sku || '',
            description: product.description || '',
            sellingPrice: product.sellingPrice || '',
            costPrice: product.costPrice || '',
            quantityInStock: product.quantityInStock || '',
            imageUrl: product.imageUrl || '',
            category: product.category?._id || product.category || '',
            supplier: product.supplier?._id || product.supplier || '',
            unit: product.unit || 'Cái',
            lowStockThreshold: product.lowStockThreshold?.toString() || '0',
        });
        setImageFile(null);
        setCurrentProductId(product._id);
        setAddEditModal('EDIT');
    }, []);

    const handleCloseModal = useCallback(() => {
        if (isUploadingImage || isSubmitting) return;
        setAddEditModal(null);
        setFormData(initialFormData);
        setImageFile(null);
        setCurrentProductId(null);
    }, [isUploadingImage, isSubmitting]);

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                handleCloseModal();
            }
        };
        if (addEditModal) {
            document.addEventListener('keydown', handleEscapeKey);
        }
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [addEditModal, handleCloseModal]);

    const fetchData = useCallback(async (endpoint, setter, entityName) => {
        // setIsLoadingData(true) nên được gọi trong useEffect chính
        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });
            const data = response.data?.data || response.data;
            if (Array.isArray(data)) {
                setter(data);
                if (entityName === 'products') setFilteredProducts(data);
            } else {
                console.warn(`Cấu trúc dữ liệu không mong muốn từ ${entityName}:`, response.data);
                toast.error(`Nhận được dữ liệu không đúng định dạng cho ${entityName}.`);
                setter([]);
                if (entityName === 'products') setFilteredProducts([]);
            }
        } catch (err) {
            console.error(`Lỗi khi tải ${entityName}:`, err);
            toast.error(err.response?.data?.message || `Không thể tải ${entityName}.`);
            setter([]);
            if (entityName === 'products') setFilteredProducts([]);
        }
    }, []);

    useEffect(() => {
        setIsLoadingData(true); // Bắt đầu loading
        Promise.all([
            fetchData(API_PATHS.PRODUCT.GET_ALL_PRODUCTS, setProducts, 'products'),
            fetchData(API_PATHS.CATEGORY.GET_ALL_CATEGORIES, setCategories, 'categories'),
            fetchData(API_PATHS.SUPPLIER.GET_ALL_SUPPLIERS, setSuppliers, 'suppliers'),
        ]).finally(() => setIsLoadingData(false));
    }, [fetchData]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    }, []);

    const handleImageFileChange = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) {
            setImageFile(null);
            // Không reset formData.imageUrl ở đây, người dùng có thể vẫn muốn giữ URL cũ nếu hủy chọn file
            return;
        }

        setImageFile(file);
        setIsUploadingImage(true);
        const toastId = toast.loading("Đang tải ảnh lên...");

        try {
            const result = await uploadImage(file); // Gọi hàm uploadImage tiện ích
            toast.dismiss(toastId);
            if (result.imageUrl) {
                setFormData((prev) => ({ ...prev, imageUrl: result.imageUrl }));
                toast.success("Tải ảnh lên thành công!");
            } else {
                toast.error(result.message || 'Tải ảnh lên thất bại.');
                setImageFile(null); // Xóa file nếu upload lỗi
            }
        } catch (error) {
            toast.dismiss(toastId);
            console.error("Lỗi khi tải ảnh:", error);
            toast.error(error.response?.data?.message || "Tải ảnh lên thất bại.");
            setImageFile(null); // Xóa file nếu upload lỗi
        } finally {
            setIsUploadingImage(false);
            if (e.target) e.target.value = null; // Reset input file để có thể chọn lại cùng file
        }
    }, []);

    const handlePasteImageLink = useCallback((e) => {
        const url = e.target.value;
        setFormData((prev) => ({ ...prev, imageUrl: url }));
        if (url && imageFile) setImageFile(null);
    }, [imageFile]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        const { name, sellingPrice, quantityInStock, category: categoryId } = formData;
        if (!name || !sellingPrice || !quantityInStock || !categoryId) {
            toast.error("Tên, Giá bán, Số lượng tồn và Danh mục là bắt buộc.");
            return;
        }
        if (isUploadingImage) {
            toast.error("Vui lòng chờ quá trình tải ảnh hoàn tất.");
            return;
        }

        const normalizedFormName = name.trim().toLowerCase();
        let isNameDuplicate = false;

        if (addEditModal === 'ADD') {
            isNameDuplicate = products.some(
                (product) => product.name.trim().toLowerCase() === normalizedFormName
            );
        } else if (addEditModal === 'EDIT' && currentProductId) {
            isNameDuplicate = products.some(
                (product) =>
                    product._id !== currentProductId && 
                    product.name.trim().toLowerCase() === normalizedFormName
            );
        }

        if (isNameDuplicate) {
            toast.error("Tên sản phẩm đã tồn tại. Vui lòng chọn tên khác.");
            return; 
        }

        setIsSubmitting(true);
        const productData = {
            ...formData,
            name: formData.name.trim(), 
            sellingPrice: parseFloat(formData.sellingPrice) || 0,
            costPrice: parseFloat(formData.costPrice) || 0,
            quantityInStock: parseInt(formData.quantityInStock, 10) || 0,
            lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 0,
            category: categoryId,
        };

        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            };
            if (addEditModal === 'EDIT' && currentProductId) {
                await axios.put(`${BASE_URL}${API_PATHS.PRODUCT.UPDATE_PRODUCT(currentProductId)}`, productData, { headers });
                toast.success("Cập nhật sản phẩm thành công!");
            } else if (addEditModal === 'ADD') {
                await axios.post(`${BASE_URL}${API_PATHS.PRODUCT.CREATE_PRODUCT}`, productData, { headers });
                toast.success("Thêm sản phẩm thành công!");
            }
            handleCloseModal();
            // Cập nhật lại searchTerm để đảm bảo filter hoạt động đúng sau khi thêm/sửa
            const currentSearchTerm = searchTerm;
            setSearchTerm(''); // Xóa searchTerm tạm thời để fetch lại toàn bộ
            await fetchData(API_PATHS.PRODUCT.GET_ALL_PRODUCTS, setProducts, 'products');
            setSearchTerm(currentSearchTerm); // Khôi phục searchTerm
        } catch (error) {
            console.error("Lỗi khi gửi form sản phẩm:", error);
            toast.error(error.response?.data?.message || "Thao tác thất bại. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    }, [
        formData,
        isUploadingImage,
        addEditModal,
        currentProductId,
        handleCloseModal,
        fetchData,
        products, 
        searchTerm
    ]);

    const handleDelete = useCallback(async (productId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.")) {
            setIsSubmitting(true);
            try {
                await axios.delete(`${BASE_URL}${API_PATHS.PRODUCT.DELETE_PRODUCT(productId)}`, {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
                });
                toast.success("Xóa sản phẩm thành công!");
                await fetchData(API_PATHS.PRODUCT.GET_ALL_PRODUCTS, setProducts, 'products');
            } catch (error) {
                console.error("Lỗi khi xóa sản phẩm:", error);
                toast.error(error.response?.data?.message || "Xóa sản phẩm thất bại.");
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [fetchData]);

    const getCategoryName = useCallback((categoryId) => {
        if (!categoryId || !Array.isArray(categories) || categories.length === 0) return 'Chưa có';
        const idToCompare = typeof categoryId === 'object' ? categoryId._id : categoryId;
        const category = categories.find(c => c._id === idToCompare);
        return category ? category.name : 'Không xác định';
    }, [categories]);

    const getSupplierName = useCallback((supplierId) => {
        if (!supplierId || !Array.isArray(suppliers) || suppliers.length === 0) return 'Chưa có';
        const idToCompare = typeof supplierId === 'object' ? supplierId._id : supplierId;
        const supplier = suppliers.find(s => s._id === idToCompare);
        return supplier ? supplier.name : 'Chưa gán';
    }, [suppliers]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const sourceProducts = Array.isArray(products) ? products : [];
        if (searchTerm.trim() === '') {
            setFilteredProducts(sourceProducts);
            return;
        }
        const filteredData = sourceProducts.filter(item =>
            (item.name?.toLowerCase().includes(lowercasedFilter)) ||
            (item.sku?.toLowerCase().includes(lowercasedFilter)) ||
            (getCategoryName(item.category).toLowerCase().includes(lowercasedFilter))
        );
        setFilteredProducts(filteredData);
    }, [searchTerm, products, getCategoryName]);

    const handleSearchChange = useCallback((e) => setSearchTerm(e.target.value), []);

    const isEditing = addEditModal === 'EDIT';
    const modalTitle = isEditing ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới";
    const submitButtonText = isEditing ? "Lưu Thay Đổi" : "Thêm Sản Phẩm";
    const isAnyTaskRunning = isSubmitting || isUploadingImage || isLoadingData;

    return (
        <div className='w-full min-h-screen flex flex-col gap-6 p-4 sm:p-6 bg-slate-50'>
            <div className="flex flex-col sm:flex-row items-center justify-between w-full pb-4 border-b border-slate-200">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-0">Quản Lý Sản Phẩm</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-64 md:w-72">
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            disabled={isLoadingData && products.length === 0} // Disable nếu đang load và chưa có sp nào
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                        className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dull text-white rounded-lg font-medium hover:from-primary-dark hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 flex items-center gap-2 shadow-sm hover:shadow-md whitespace-nowrap"
                        onClick={handleOpenAddModal}
                        disabled={isAnyTaskRunning}
                    >
                        <FaPlus /> Thêm Sản Phẩm
                    </button>
                </div>
            </div>

            {isLoadingData && products.length === 0 && !addEditModal ? <LoadingState />
                : !isLoadingData && products.length === 0 && !searchTerm ? <NoProductsState onAdd={handleOpenAddModal} />
                    : !isLoadingData && filteredProducts.length === 0 && searchTerm ? <NoSearchResultsState />
                        : (
                            <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                                <table className="w-full text-sm text-left text-slate-700">
                                    <thead className="text-xs text-white uppercase bg-primary whitespace-nowrap">
                                        <tr>
                                            {['#', 'Ảnh', 'Tên Sản Phẩm', 'Mã SKU', 'Danh Mục', 'Nhà C.Cấp', 'Giá Bán', 'Giá Vốn', 'Tồn Kho', 'Đơn Vị', 'Hành Động'].map(header => (
                                                <th key={header} scope="col" className="px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((product, index) => (
                                            <tr key={product._id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <img
                                                        src={product.imageUrl ? (product.imageUrl.startsWith('http') || product.imageUrl.startsWith('blob:') ? product.imageUrl : `${BASE_URL}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl}`) : 'https://via.placeholder.com/60x60?text=NoImg'}
                                                        alt={product.name || 'Ảnh sản phẩm'}
                                                        className="w-12 h-12 object-cover rounded-md border border-slate-200 bg-slate-100"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=Lỗi'; }}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900 ">{product.name}</td>
                                                <td className="px-4 py-3 text-slate-600">{product.sku || 'Chưa có'}</td>
                                                <td className="px-4 py-3 text-slate-600">{getCategoryName(product.category)}</td>
                                                <td className="px-4 py-3 text-slate-600">{getSupplierName(product.supplier)}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{product.sellingPrice?.toLocaleString() || '0'}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{product.costPrice?.toLocaleString() || '0'}</td>
                                                <td className="px-4 py-3 text-center text-slate-600">{product.quantityInStock}</td>
                                                <td className="px-4 py-3 text-slate-600">{product.unit}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                        <button
                                                            title="Chỉnh sửa sản phẩm"
                                                            className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEditModal(product);
                                                            }}
                                                            disabled={isAnyTaskRunning}
                                                        >
                                                            <FaEdit size={16} />
                                                        </button>
                                                        <button
                                                            title="Xóa sản phẩm"
                                                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleDelete(product._id)}
                                                            disabled={isAnyTaskRunning}
                                                        >
                                                            <FaTrashAlt size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {isLoadingData && products.length > 0 &&
                                    <div className="text-center py-3 text-sm text-slate-500 flex items-center justify-center">
                                        <FaSpinner className="animate-spin inline mr-2" />Đang cập nhật danh sách...
                                    </div>
                                }
                            </div>
                        )}

            {addEditModal && (
                <div
                    className="fixed inset-0 w-full h-full bg-black/60 flex justify-center items-start sm:items-center z-50 p-4 transition-opacity duration-300 overflow-y-auto"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white my-auto p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100" // Đổi màu scrollbar
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5 sm:mb-6 pb-3 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800">{modalTitle}</h2>
                            <button
                                onClick={handleCloseModal}
                                className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors focus:outline-none disabled:opacity-50"
                                aria-label="Đóng modal"
                                disabled={isSubmitting || isUploadingImage}
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                                <div className="md:col-span-2">
                                    <label htmlFor="productName" className={commonLabelClass}>Tên Sản Phẩm {requiredSpan}</label>
                                    <input id="productName" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="VD: Áo Thun Cao Cấp" className={commonInputClass} required disabled={isSubmitting} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="description" className={commonLabelClass}>Mô Tả</label>
                                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả chi tiết sản phẩm..." rows="3" className={`${commonInputClass} min-h-[70px]`} disabled={isSubmitting}></textarea>
                                </div>
                                <div>
                                    <label htmlFor="sellingPrice" className={commonLabelClass}>Giá Bán {requiredSpan}</label>
                                    <input id="sellingPrice" name="sellingPrice" type="number" value={formData.sellingPrice} onChange={handleChange} placeholder="0" step="any" min="0" className={commonInputClass} required disabled={isSubmitting} />
                                </div>
                                <div>
                                    <label htmlFor="quantityInStock" className={commonLabelClass}>Số Lượng Tồn {requiredSpan}</label>
                                    <input id="quantityInStock" name="quantityInStock" type="number" value={formData.quantityInStock} onChange={handleChange} placeholder="0" step="1" min="0" className={commonInputClass} required disabled={isSubmitting} />
                                </div>
                                <div>
                                    <label htmlFor="category" className={commonLabelClass}>Danh Mục {requiredSpan}</label>
                                    <select id="category" name="category" value={formData.category} onChange={handleChange} className={commonInputClass} required disabled={isSubmitting}>
                                        <option value="">-- Chọn Danh Mục --</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="supplier" className={commonLabelClass}>Nhà Cung Cấp</label>
                                    <select id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} className={commonInputClass} disabled={isSubmitting}>
                                        <option value="">-- Chọn Nhà Cung Cấp (Không bắt buộc) --</option>
                                        {suppliers.map(sup => (
                                            <option key={sup._id} value={sup._id}>{sup.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                                <h3 className="text-md font-medium text-slate-700 flex items-center gap-2"><FaImage /> Hình Ảnh Sản Phẩm</h3>
                                <div>
                                    <label htmlFor="productImageFile" className={`${commonLabelClass} mb-1.5`}>Tải Ảnh Lên</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="productImageFile"
                                            type="file"
                                            accept="image/jpeg, image/png, image/jpg, image/webp" // Thêm webp
                                            onChange={handleImageFileChange}
                                            className="block w-full text-sm text-slate-500
                                                file:mr-3 file:py-2 file:px-4
                                                file:rounded-md file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-primary-light file:text-primary  
                                                hover:file:bg-primary-light/80 cursor-pointer file:transition-colors" // Giả sử có primary-light
                                            disabled={isUploadingImage || isSubmitting}
                                        />
                                        {isUploadingImage && <FaSpinner className="animate-spin text-primary text-xl" />}
                                    </div>
                                    {imageFile && !isUploadingImage && (
                                        <p className="text-xs text-slate-500 mt-1.5">Đã chọn: <span className="font-medium">{imageFile.name}</span></p>
                                    )}
                                </div>

                                <div className="relative flex items-center py-1">
                                    <div className="flex-grow border-t border-slate-200"></div>
                                    <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase">Hoặc</span>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                </div>

                                <div>
                                    <label htmlFor="imageUrl" className={`${commonLabelClass} mb-1.5`}>Dán Liên Kết Ảnh</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaLink className="text-slate-400" />
                                        </div>
                                        <input
                                            id="imageUrl"
                                            type="text"
                                            value={formData.imageUrl}
                                            onChange={handlePasteImageLink}
                                            placeholder="https://example.com/image.jpg"
                                            className={`${commonInputClass} pl-10`}
                                            disabled={isUploadingImage || isSubmitting}
                                        />
                                    </div>
                                </div>

                                {formData.imageUrl && (
                                    <div className="mt-3">
                                        <label className={commonLabelClass}>Ảnh Hiện Tại/Xem Trước:</label>
                                        <img
                                            src={formData.imageUrl.startsWith('http') || formData.imageUrl.startsWith('blob:') ? formData.imageUrl : `${BASE_URL}${formData.imageUrl.startsWith('/') ? '' : '/'}${formData.imageUrl}`}
                                            alt="Xem trước"
                                            className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-lg border border-slate-300 shadow-sm bg-slate-50"
                                            onError={(e) => {
                                                e.target.onerror = null; // Ngăn lặp vô hạn nếu ảnh mặc định cũng lỗi
                                                e.target.src = 'https://via.placeholder.com/128?text=URL+Lỗi';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {isEditing && (
                                <div className="pt-4 border-t border-slate-200">
                                    <h3 className="text-md font-medium text-slate-700 mb-3">Thông Tin Bổ Sung</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                                        <div>
                                            <label htmlFor="sku" className={commonLabelClass}>Mã SKU</label>
                                            <input id="sku" name="sku" type="text" value={formData.sku} onChange={handleChange} placeholder="VD: SP001" className={commonInputClass} disabled={isSubmitting} />
                                        </div>
                                        <div>
                                            <label htmlFor="costPrice" className={commonLabelClass}>Giá Vốn</label>
                                            <input id="costPrice" name="costPrice" type="number" value={formData.costPrice} onChange={handleChange} placeholder="0" step="any" min="0" className={commonInputClass} disabled={isSubmitting} />
                                        </div>
                                        <div>
                                            <label htmlFor="unit" className={commonLabelClass}>Đơn Vị Tính</label>
                                            <input id="unit" name="unit" type="text" value={formData.unit} onChange={handleChange} placeholder="VD: Cái, Hộp, Kg" className={commonInputClass} disabled={isSubmitting} />
                                        </div>
                                        <div>
                                            <label htmlFor="lowStockThreshold" className={commonLabelClass}>Ngưỡng Tồn Kho Thấp</label>
                                            <input id="lowStockThreshold" name="lowStockThreshold" type="number" value={formData.lowStockThreshold} onChange={handleChange} placeholder="10" step="1" min="0" className={commonInputClass} disabled={isSubmitting} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 mt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    className="w-full sm:w-auto justify-center inline-flex items-center px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dull disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting || isUploadingImage}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto justify-center inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    disabled={isSubmitting || isUploadingImage}
                                >
                                    {isSubmitting ? (
                                        <><FaSpinner className="animate-spin -ml-1 mr-2.5 h-5 w-5" /> {isEditing ? "Đang lưu..." : "Đang thêm..."}</>
                                    ) : (
                                        <>{isEditing ? <FaSave className="mr-2" /> : <FaPlus className="mr-2" />} {submitButtonText}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;