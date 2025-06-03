import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { API_PATHS, BASE_URL } from '../../utils/apiPath'; // Đảm bảo đường dẫn đúng
import toast from 'react-hot-toast';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaTimes, FaSpinner, FaUsersSlash, FaSave } from 'react-icons/fa'; // Thêm FaWarehouse

// ----- Constants & UI Components -----
const commonInputClass = "block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-slate-50 disabled:cursor-not-allowed";
const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
const requiredSpan = <span className="text-red-500 ml-0.5">*</span>;

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <FaSpinner className="animate-spin text-4xl mb-3 text-primary" />
        <span>Đang tải danh sách nhà cung cấp...</span>
    </div>
);

const NoSuppliersState = ({ onAdd }) => (
    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
        <FaUsersSlash className="text-5xl mb-4" /> {/* Có thể đổi icon thành FaWarehouse */}
        <p className="text-lg mb-1">Không tìm thấy nhà cung cấp nào.</p>
        <p className="text-sm mb-4">Bắt đầu bằng cách thêm nhà cung cấp đầu tiên của bạn.</p>
        <button
            onClick={onAdd}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
        >
            <FaPlus /> Thêm Nhà Cung Cấp Mới
        </button>
    </div>
);

const NoSearchResultsState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <FaSearch className="text-5xl mb-3" />
        <span className="text-lg">Không có nhà cung cấp nào khớp với tìm kiếm.</span>
        <span className="text-sm">Hãy thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</span>
    </div>
);

const initialFormData = { name: '', email: '', number: '', address: '' };

const Suppliers = () => {
    const [addEditModal, setAddEditModal] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [currentSupplierId, setCurrentSupplierId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenAddModal = useCallback(() => {
        setFormData(initialFormData);
        setCurrentSupplierId(null);
        setAddEditModal('ADD');
    }, []);

    const handleOpenEditModal = useCallback((supplier) => {
        setFormData({
            name: supplier.name || '',
            email: supplier.email || '',
            number: supplier.number || '',
            address: supplier.address || ''
        });
        setCurrentSupplierId(supplier._id);
        setAddEditModal('EDIT');
    }, []);

    const handleCloseModal = useCallback(() => {
        if (isSubmitting) return;
        setAddEditModal(null);
        setFormData(initialFormData);
        setCurrentSupplierId(null);
    }, [isSubmitting]);

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

    const fetchSuppliers = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const endpoint = `${BASE_URL}${API_PATHS.SUPPLIER.GET_ALL_SUPPLIERS}`;
            const response = await axios.get(endpoint, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });
            const data = response.data?.data || response.data;
            if (Array.isArray(data)) {
                setSuppliers(data);
                setFilteredSuppliers(data);
            } else {
                console.warn("Cấu trúc dữ liệu không mong muốn từ endpoint nhà cung cấp:", response.data);
                toast.error("Nhận được định dạng dữ liệu không mong muốn cho nhà cung cấp.");
                setSuppliers([]);
                setFilteredSuppliers([]);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Không thể tải danh sách nhà cung cấp.");
            setSuppliers([]);
            setFilteredSuppliers([]);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.number || !formData.address) {
            toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const headers = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            };
            if (addEditModal === 'EDIT' && currentSupplierId) {
                await axios.put(`${BASE_URL}${API_PATHS.SUPPLIER.UPDATE_SUPPLIER(currentSupplierId)}`, formData, { headers });
                toast.success("Cập nhật nhà cung cấp thành công!");
            } else if (addEditModal === 'ADD') {
                await axios.post(`${BASE_URL}${API_PATHS.SUPPLIER.CREATE_SUPPLIER}`, formData, { headers });
                toast.success("Thêm nhà cung cấp thành công!");
            }
            handleCloseModal();
            fetchSuppliers();
        } catch (error) {
            console.error("Lỗi khi gửi form nhà cung cấp:", error);
            toast.error(error.response?.data?.message || "Thao tác thất bại.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, addEditModal, currentSupplierId, handleCloseModal, fetchSuppliers]);

    const handleDelete = useCallback(async (supplierId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này? Hành động này không thể hoàn tác.")) {
            setIsSubmitting(true);
            try {
                await axios.delete(`${BASE_URL}${API_PATHS.SUPPLIER.DELETE_SUPPLIER(supplierId)}`, {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
                });
                toast.success("Xóa nhà cung cấp thành công!");
                fetchSuppliers();
            } catch (error) {
                console.error("Lỗi khi xóa nhà cung cấp:", error);
                toast.error(error.response?.data?.message || "Xóa nhà cung cấp thất bại.");
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [fetchSuppliers]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (searchTerm.trim() === '') {
            setFilteredSuppliers(suppliers);
        } else {
            const filtered = suppliers.filter(supplier =>
                supplier.name.toLowerCase().includes(lowercasedFilter) ||
                (supplier.email && supplier.email.toLowerCase().includes(lowercasedFilter)) ||
                (supplier.number && supplier.number.toLowerCase().includes(lowercasedFilter))
            );
            setFilteredSuppliers(filtered);
        }
    }, [searchTerm, suppliers]);

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const isEditing = addEditModal === 'EDIT';
    const modalTitle = isEditing ? "Chỉnh Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp Mới";
    const submitButtonText = isEditing ? "Lưu Thay Đổi" : "Thêm Nhà Cung Cấp";
    const isAnyTaskRunning = isSubmitting || isLoadingData;

    return (
        <div className='w-full min-h-screen flex flex-col gap-6 p-4 sm:p-6 bg-slate-50'>
            <div className="flex flex-col sm:flex-row items-center justify-between w-full pb-4 border-b border-slate-200">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-0">Quản Lý Nhà Cung Cấp</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-64 md:w-72">
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, SĐT..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            disabled={isLoadingData && suppliers.length === 0}
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                        className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dull text-white rounded-lg font-medium hover:from-primary-dark hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 flex items-center gap-2 shadow-sm hover:shadow-md whitespace-nowrap"
                        onClick={handleOpenAddModal}
                        disabled={isAnyTaskRunning}
                    >
                        <FaPlus /> Thêm Nhà Cung Cấp
                    </button>
                </div>
            </div>
            {isLoadingData && suppliers.length === 0 && !addEditModal ? <LoadingState />
                : !isLoadingData && suppliers.length === 0 && !searchTerm ? <NoSuppliersState onAdd={handleOpenAddModal} />
                    : !isLoadingData && filteredSuppliers.length === 0 && searchTerm ? <NoSearchResultsState />
                        : (
                            <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                                <table className="w-full text-sm text-left text-slate-700">
                                    <thead className="text-xs text-white uppercase bg-primary whitespace-nowrap">
                                        <tr>
                                            {['#', 'Tên Nhà Cung Cấp', 'Email', 'Số Điện Thoại', 'Địa Chỉ', 'Hành Động'].map(header => (
                                                <th key={header} scope="col" className="px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSuppliers.map((supplier, index) => (
                                            <tr key={supplier._id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-slate-900">{supplier.name}</td>
                                                <td className="px-4 py-3 text-slate-600">{supplier.email}</td>
                                                <td className="px-4 py-3 text-slate-600">{supplier.number}</td>
                                                <td className="px-4 py-3 text-slate-600 whitespace-normal break-words max-w-sm">{supplier.address}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                        <button
                                                            title="Chỉnh sửa nhà cung cấp"
                                                            className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleOpenEditModal(supplier)}
                                                            disabled={isAnyTaskRunning}
                                                        >
                                                            <FaEdit size={16} />
                                                        </button>
                                                        <button
                                                            title="Xóa nhà cung cấp"
                                                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleDelete(supplier._id)}
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
                                {isLoadingData && suppliers.length > 0 &&
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
                        className="bg-white my-auto p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5 sm:mb-6 pb-3 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800">{modalTitle}</h2>
                            <button
                                onClick={handleCloseModal}
                                className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors focus:outline-none disabled:opacity-50"
                                aria-label="Đóng modal"
                                disabled={isSubmitting}
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="supplierName" className={commonLabelClass}>Tên Nhà Cung Cấp {requiredSpan}</label>
                                <input id="supplierName" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Nhập tên nhà cung cấp" className={commonInputClass} required disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="supplierEmail" className={commonLabelClass}>Email {requiredSpan}</label>
                                <input id="supplierEmail" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Nhập email nhà cung cấp" className={commonInputClass} required disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="supplierNumber" className={commonLabelClass}>Số Điện Thoại {requiredSpan}</label>
                                <input id="supplierNumber" name="number" type="tel" value={formData.number} onChange={handleChange} placeholder="Nhập số điện thoại" className={commonInputClass} required disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="supplierAddress" className={commonLabelClass}>Địa Chỉ {requiredSpan}</label>
                                <textarea id="supplierAddress" name="address" value={formData.address} onChange={handleChange} placeholder="Nhập địa chỉ nhà cung cấp" rows="3" className={`${commonInputClass} min-h-[70px]`} required disabled={isSubmitting}></textarea>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 mt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    className="w-full sm:w-auto justify-center inline-flex items-center px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dull disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto justify-center inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    disabled={isSubmitting}
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

export default Suppliers;