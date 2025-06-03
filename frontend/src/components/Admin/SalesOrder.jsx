// src/pages/SalesOrders.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    FaEdit, FaTrashAlt, FaPlus, FaSearch, FaTimes, FaSpinner,
    FaShoppingCart, FaSave, FaMinusCircle, FaTruck, FaCheckCircle,
    FaChevronDown, FaTimesCircle, FaHourglassStart // Thêm icon nếu cần
} from 'react-icons/fa';
import { API_PATHS, BASE_URL } from '../../utils/apiPath'; // Đảm bảo đường dẫn này chính xác

// ----- Hằng số & Thành phần UI -----
const commonInputClass = "block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
const requiredSpan = <span className="text-red-500 ml-0.5">*</span>;

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <FaSpinner className="animate-spin text-4xl mb-3 text-primary" />
        <span>Đang tải danh sách đơn hàng...</span>
    </div>
);

const NoOrdersState = ({ onAdd, disabled }) => (
    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
        <FaShoppingCart className="text-5xl mb-4" />
        <p className="text-lg mb-1">Chưa có đơn hàng bán nào.</p>
        <p className="text-sm mb-4">Bắt đầu bằng cách tạo đơn hàng đầu tiên.</p>
        <button
            onClick={onAdd}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
            disabled={disabled}
        >
            <FaPlus /> Tạo Đơn Hàng Mới
        </button>
    </div>
);

const NoSearchResultsState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <FaSearch className="text-5xl mb-3" />
        <span className="text-lg">Không có đơn hàng nào khớp với tìm kiếm.</span>
    </div>
);

const initialProductLine = { product: '', quantity: 1, unitPrice: 0 };
const initialFormData = {
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    products: [{ ...initialProductLine }],
};

// Định nghĩa các giá trị trạng thái (value)
const UI_ORDER_STATUS_VALUES = {
    PROCESSING: 'processing', // Đang giao
    COMPLETED: 'completed',   // Đã giao
    CANCELLED: 'cancelled', // Đã hủy (nếu API có trả về)
    // PENDING: 'pending',    // Chờ xử lý
};

// Cấu hình chi tiết cho từng trạng thái để hiển thị
const ORDER_STATUS_CONFIG = {
    [UI_ORDER_STATUS_VALUES.PROCESSING]: {
        label: 'Đang giao',
        icon: FaTruck,
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        dropdownClassName: 'hover:bg-blue-50 text-blue-700',
    },
    [UI_ORDER_STATUS_VALUES.COMPLETED]: {
        label: 'Đã giao',
        icon: FaCheckCircle,
        className: 'bg-green-100 text-green-700 hover:bg-green-200',
        dropdownClassName: 'hover:bg-green-50 text-green-700',
    },
    [UI_ORDER_STATUS_VALUES.CANCELLED]: {
        label: 'Đã hủy',
        icon: FaTimesCircle,
        className: 'bg-red-100 text-red-700 cursor-not-allowed',
        dropdownClassName: 'text-red-700 cursor-not-allowed',
    },
    // [UI_ORDER_STATUS_VALUES.PENDING]: {
    //     label: 'Chờ xử lý',
    //     icon: FaHourglassStart,
    //     className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    //     dropdownClassName: 'hover:bg-yellow-50 text-yellow-700',
    // },
};

// Các trạng thái người dùng có thể chọn từ dropdown
const SELECTABLE_UI_STATUSES = [
    UI_ORDER_STATUS_VALUES.PROCESSING,
    UI_ORDER_STATUS_VALUES.COMPLETED,
    // UI_ORDER_STATUS_VALUES.PENDING,
];

const SalesOrders = () => {
    const [addEditModal, setAddEditModal] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [productsData, setProductsData] = useState([]);
    const [localOrderStatuses, setLocalOrderStatuses] = useState({});
    const [activeStatusDropdown, setActiveStatusDropdown] = useState(null);
    const token = localStorage.getItem('token');
    const statusDropdownRef = useRef(null);

    const fetchProductsForModal = useCallback(async () => {
        try {
            const productsRes = await axios.get(`${BASE_URL}${API_PATHS.PRODUCT.GET_ALL_PRODUCTS}`, { headers: { Authorization: `Bearer ${token}` } });
            setProductsData(productsRes.data?.data || productsRes.data || []);
        } catch (err) {
            console.error('Lỗi tải sản phẩm:', err);
            toast.error("Không thể tải dữ liệu sản phẩm cho form.");
        }
    }, [token]);

    const handleOpenAddModal = useCallback(async () => {
        await fetchProductsForModal();
        setFormData(initialFormData);
        setCurrentOrderId(null);
        setAddEditModal('ADD');
    }, [fetchProductsForModal]);

    const handleOpenEditModal = useCallback(async (order) => {
        await fetchProductsForModal();
        setFormData({
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            customerAddress: order.customerAddress || '',
            products: order.products.map(p => ({
                product: p.product?._id || p.product || '',
                quantity: p.quantity || 1,
                unitPrice: p.unitPrice || 0
            }))
        });
        setCurrentOrderId(order._id);
        setAddEditModal('EDIT');
    }, [fetchProductsForModal]);

    const handleCloseModal = useCallback(() => {
        if (isSubmitting) return;
        setAddEditModal(null);
        setFormData(initialFormData);
        setCurrentOrderId(null);
    }, [isSubmitting]);

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && addEditModal) handleCloseModal();
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [addEditModal, handleCloseModal]);

    const fetchOrders = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const endpoint = `${BASE_URL}${API_PATHS.SALES_ORDER.GET_ALL}`;
            const response = await axios.get(endpoint, { headers: { "Authorization": `Bearer ${token}` } });
            const fetchedOrders = response.data?.data || response.data || [];

            if (Array.isArray(fetchedOrders)) {
                setOrders(fetchedOrders);
                setFilteredOrders(fetchedOrders);

                const initialStatuses = {};
                fetchedOrders.forEach(order => {
                    if (order.status && ORDER_STATUS_CONFIG[order.status]) {
                        initialStatuses[order._id] = order.status;
                    } else {
                        initialStatuses[order._id] = UI_ORDER_STATUS_VALUES.PROCESSING;
                    }
                });
                setLocalOrderStatuses(initialStatuses);
            } else {
                toast.error("Không thể tải dữ liệu đơn hàng bán.");
                setOrders([]); setFilteredOrders([]); setLocalOrderStatuses({});
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi tải danh sách đơn hàng bán.");
            setOrders([]); setFilteredOrders([]); setLocalOrderStatuses({});
        } finally {
            setIsLoadingData(false);
        }
    }, [token]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleFormInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleProductDetailChange = useCallback((index, field, value) => {
        setFormData(prev => {
            const newProducts = prev.products.map((p, i) => {
                if (i === index) {
                    if (field === 'product') {
                        const selectedProductData = productsData.find(pd => pd._id === value);
                        return {
                            ...p,
                            product: value,
                            unitPrice: selectedProductData ? (selectedProductData.sellingPrice ?? selectedProductData.price ?? 0) : 0,
                            quantity: p.quantity || 1,
                        };
                    }
                    if (field === 'quantity') {
                        return { ...p, quantity: value === '' ? '' : parseInt(value, 10) };
                    }
                    return { ...p, [field]: value };
                }
                return p;
            });
            return { ...prev, products: newProducts };
        });
    }, [productsData]);

    const handleAddProductLine = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { ...initialProductLine }]
        }));
    }, []);

    const handleRemoveProductLine = useCallback((indexToRemove) => {
        if (formData.products.length <= 1) {
            toast.error("Phải có ít nhất một sản phẩm trong đơn hàng.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, index) => index !== indexToRemove)
        }));
    }, [formData.products]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.customerName.trim()) {
            toast.error("Vui lòng nhập tên khách hàng."); return;
        }
        for (const p of formData.products) {
            if (!p.product) { toast.error("Vui lòng chọn sản phẩm cho tất cả các dòng."); return; }
            const quantityToSubmit = (p.quantity === '' || p.quantity === null || isNaN(p.quantity) || Number(p.quantity) <= 0) ? 1 : Number(p.quantity);
            if (quantityToSubmit <= 0) { toast.error(`Số lượng phải lớn hơn 0.`); return; }
            if (p.unitPrice === null || p.unitPrice < 0 || isNaN(p.unitPrice)) { toast.error(`Đơn giá không hợp lệ.`); return; }
        }

        setIsSubmitting(true);
        const payload = {
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerAddress: formData.customerAddress,
            products: formData.products.map(({ product, quantity, unitPrice }) => ({
                product,
                quantity: (quantity === '' || quantity === null || isNaN(quantity) || Number(quantity) <= 0) ? 1 : Number(quantity),
                unitPrice: Number(unitPrice)
            })),
        };

        try {
            const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
            let createdOrUpdatedOrderData;
            if (addEditModal === 'EDIT' && currentOrderId) {
                const response = await axios.put(`${BASE_URL}${API_PATHS.SALES_ORDER.UPDATE(currentOrderId)}`, payload, { headers });
                createdOrUpdatedOrderData = response.data?.data || response.data;
                toast.success("Cập nhật đơn hàng bán thành công!");
            } else if (addEditModal === 'ADD') {
                const response = await axios.post(`${BASE_URL}${API_PATHS.SALES_ORDER.CREATE}`, payload, { headers });
                createdOrUpdatedOrderData = response.data?.data || response.data;
                toast.success("Tạo đơn hàng bán thành công!");

                if (createdOrUpdatedOrderData && createdOrUpdatedOrderData._id) {
                    setLocalOrderStatuses(prev => ({
                        ...prev,
                        [createdOrUpdatedOrderData._id]: UI_ORDER_STATUS_VALUES.PROCESSING
                    }));
                }
            }
            handleCloseModal();
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thao tác đơn hàng bán thất bại.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, addEditModal, currentOrderId, token, handleCloseModal, fetchOrders]);

    const handleDelete = useCallback(async (orderId) => {
        if (window.confirm("Bạn chắc chắn muốn xóa đơn hàng bán này?")) {
            setIsSubmitting(true);
            try {
                await axios.delete(`${BASE_URL}${API_PATHS.SALES_ORDER.DELETE(orderId)}`, { headers: { "Authorization": `Bearer ${token}` } });
                toast.success("Xóa đơn hàng bán thành công!");
                setLocalOrderStatuses(prev => {
                    const newStatuses = { ...prev };
                    delete newStatuses[orderId];
                    return newStatuses;
                });
                fetchOrders();
            } catch (error) {
                toast.error(error.response?.data?.message || "Xóa đơn hàng bán thất bại.");
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [token, fetchOrders]);

    const toggleStatusDropdown = (orderId) => {
        setActiveStatusDropdown(prev => (prev === orderId ? null : orderId));
    };

    const handleChangeDisplayStatus = useCallback((orderId, newStatus) => {
        const orderFromApi = orders.find(o => o._id === orderId);
        if (orderFromApi && orderFromApi.status === UI_ORDER_STATUS_VALUES.CANCELLED) {
            toast.info("Không thể thay đổi trạng thái của đơn hàng đã hủy.");
            setActiveStatusDropdown(null);
            return;
        }

        setLocalOrderStatuses(prevStatuses => ({
            ...prevStatuses,
            [orderId]: newStatus
        }));
        setActiveStatusDropdown(null);

        const statusLabel = ORDER_STATUS_CONFIG[newStatus]?.label || newStatus;
        toast.success(`Trạng thái: "${statusLabel}".`);
    }, [orders]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target) && activeStatusDropdown) {
                setActiveStatusDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeStatusDropdown]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase().trim();
        if (lowercasedFilter === '') {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter(order =>
                (order.orderNumber && order.orderNumber.toLowerCase().includes(lowercasedFilter)) ||
                (order.customerName && order.customerName.toLowerCase().includes(lowercasedFilter)) ||
                (order._id && order._id.toLowerCase().includes(lowercasedFilter))
            );
            setFilteredOrders(filtered);
        }
    }, [searchTerm, orders]);

    const handleSearchChange = useCallback((e) => setSearchTerm(e.target.value), []);

    const isEditing = addEditModal === 'EDIT';
    const modalTitle = isEditing ? "Chỉnh Sửa Đơn Hàng Bán" : "Tạo Đơn Hàng Bán Mới";
    const submitButtonText = isEditing ? "Lưu Thay Đổi" : "Tạo Đơn Hàng";
    const isAnyTaskRunning = isSubmitting || isLoadingData;

    return (
        <div className='w-full min-h-screen flex flex-col gap-6 p-4 sm:p-6 bg-slate-50'>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full pb-4 border-b border-slate-200">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-0">Quản Lý Đơn Hàng Bán</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-64 md:w-72">
                        <input
                            type="text"
                            placeholder="Tìm mã ĐH, tên khách hàng..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            disabled={isLoadingData && orders.length === 0}
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                        className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dull text-white rounded-lg font-medium hover:from-primary-dark hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-150 flex items-center gap-2 shadow-sm hover:shadow-md whitespace-nowrap"
                        onClick={handleOpenAddModal}
                        disabled={isAnyTaskRunning}
                    >
                        <FaPlus /> Tạo Đơn Hàng
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {isLoadingData && orders.length === 0 && !addEditModal ? <LoadingState />
                : !isLoadingData && orders.length === 0 && !searchTerm ? <NoOrdersState onAdd={handleOpenAddModal} disabled={isAnyTaskRunning} />
                    : !isLoadingData && filteredOrders.length === 0 && searchTerm ? <NoSearchResultsState />
                        : (
                            <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                                <table className="w-full text-sm text-left text-slate-700">
                                    <thead className="text-xs text-white uppercase bg-primary whitespace-nowrap">
                                        <tr>
                                            {['#', 'Mã ĐH', 'Khách Hàng', 'SĐT', 'Ngày Tạo', 'Tổng Tiền', 'Trạng Thái', 'Hành Động'].map(header => (
                                                <th key={header} scope="col" className="px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((order, index) => {
                                            const currentDisplayStatus = localOrderStatuses[order._id] || UI_ORDER_STATUS_VALUES.PROCESSING;
                                            const statusConfig = ORDER_STATUS_CONFIG[currentDisplayStatus] || ORDER_STATUS_CONFIG[UI_ORDER_STATUS_VALUES.PROCESSING];
                                            const isActuallyCancelled = order.status === UI_ORDER_STATUS_VALUES.CANCELLED;

                                            return (
                                                <tr key={order._id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-900">{order.orderNumber || order.soCode || order._id.slice(-6).toUpperCase()}</td>
                                                    <td className="px-4 py-3 text-slate-600">{order.customerName || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{order.customerPhone || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{new Date(order.orderDate || order.createdAt).toLocaleDateString('vi-VN')}</td>
                                                    <td className="px-4 py-3 text-slate-600 font-semibold text-green-600">
                                                        {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
                                                    </td>
                                                    <td className="px-4 py-3 relative">
                                                        <button
                                                            onClick={() => !isActuallyCancelled && toggleStatusDropdown(order._id)}
                                                            disabled={isAnyTaskRunning || isActuallyCancelled}
                                                            title={isActuallyCancelled ? "Đã hủy (không thể đổi)" : `Trạng thái: ${statusConfig.label}. Nhấn để đổi.`}
                                                            className={`min-w-[100px] flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full transition-opacity
                                                            ${statusConfig.className}
                                                            ${(isAnyTaskRunning || isActuallyCancelled) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                                                        `}
                                                        >
                                                            {statusConfig.icon && <statusConfig.icon className="inline -mt-0.5" />}
                                                            {statusConfig.label}
                                                            {!isActuallyCancelled && <FaChevronDown className="ml-1 text-xs" />}
                                                        </button>
                                                        {activeStatusDropdown === order._id && !isActuallyCancelled && (
                                                            <div
                                                                ref={statusDropdownRef}
                                                                className="absolute z-10 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 right-0 sm:left-0"
                                                            >
                                                                <ul className="py-1 text-sm text-gray-700">
                                                                    {SELECTABLE_UI_STATUSES.map(statusValue => {
                                                                        const selectableConfig = ORDER_STATUS_CONFIG[statusValue];
                                                                        if (!selectableConfig) return null;
                                                                        return (
                                                                            <li key={statusValue}>
                                                                                <button
                                                                                    onClick={() => handleChangeDisplayStatus(order._id, statusValue)}
                                                                                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 ${selectableConfig.dropdownClassName} ${currentDisplayStatus === statusValue ? 'bg-gray-100 font-semibold' : ''}`}
                                                                                >
                                                                                    {selectableConfig.icon && <selectableConfig.icon className="inline" />}
                                                                                    {selectableConfig.label}
                                                                                </button>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                            <button
                                                                title="Chỉnh sửa"
                                                                className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                onClick={() => handleOpenEditModal(order)}
                                                                disabled={isAnyTaskRunning || currentDisplayStatus === UI_ORDER_STATUS_VALUES.COMPLETED || isActuallyCancelled}
                                                            > <FaEdit size={16} /> </button>
                                                            <button
                                                                title="Xóa"
                                                                className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                onClick={() => handleDelete(order._id)}
                                                                disabled={isAnyTaskRunning || currentDisplayStatus === UI_ORDER_STATUS_VALUES.COMPLETED || isActuallyCancelled}
                                                            > <FaTrashAlt size={16} /> </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                {isLoadingData && orders.length > 0 &&
                                    <div className="text-center py-3 text-sm text-slate-500 flex items-center justify-center">
                                        <FaSpinner className="animate-spin inline mr-2" />Đang cập nhật...
                                    </div>
                                }
                            </div>
                        )}

            {/* Modal for Add/Edit Sales Order */}
            {addEditModal && (
                <div
                    className="fixed inset-0 w-full h-full bg-black/60 flex justify-center items-start pt-10 sm:pt-0 sm:items-center z-50 p-4 transition-opacity duration-300 overflow-y-auto"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white my-auto p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl lg:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5 sm:mb-6 pb-3 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-800">{modalTitle}</h2>
                            <button
                                onClick={handleCloseModal}
                                className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors focus:outline-none disabled:opacity-50"
                                aria-label="Đóng modal" disabled={isSubmitting}
                            > <FaTimes size={20} /> </button>
                        </div>
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {/* Customer Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="customerName" className={commonLabelClass}>Tên Khách Hàng {requiredSpan}</label>
                                    <input id="customerName" name="customerName" type="text" value={formData.customerName} onChange={handleFormInputChange} placeholder="Nhập tên khách hàng" className={commonInputClass} required disabled={isSubmitting} />
                                </div>
                                <div>
                                    <label htmlFor="customerPhone" className={commonLabelClass}>Số Điện Thoại</label>
                                    <input id="customerPhone" name="customerPhone" type="tel" value={formData.customerPhone} onChange={handleFormInputChange} placeholder="Nhập SĐT khách hàng" className={commonInputClass} disabled={isSubmitting} />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="customerAddress" className={commonLabelClass}>Địa Chỉ Giao Hàng</label>
                                <textarea id="customerAddress" name="customerAddress" value={formData.customerAddress} onChange={handleFormInputChange} placeholder="Nhập địa chỉ giao hàng" rows="2" className={`${commonInputClass} min-h-[60px]`} disabled={isSubmitting}></textarea>
                            </div>
                            {/* Products Section */}
                            <div className="space-y-4 pt-3 border-t">
                                <h3 className="text-lg font-medium text-slate-700">Chi Tiết Sản Phẩm</h3>
                                {formData.products.map((item, index) => (
                                    <div key={index} className="p-3 border border-slate-200 rounded-md bg-slate-50 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr_1.5fr_auto] gap-3 items-end">
                                            <div>
                                                <label htmlFor={`product-select-${index}`} className={`${commonLabelClass} text-xs`}>Sản phẩm {requiredSpan}</label>
                                                <select
                                                    id={`product-select-${index}`}
                                                    value={item.product}
                                                    onChange={(e) => handleProductDetailChange(index, 'product', e.target.value)}
                                                    className={commonInputClass}
                                                    required
                                                    disabled={isSubmitting || productsData.length === 0}
                                                >
                                                    <option value="">-- Chọn sản phẩm --</option>
                                                    {productsData.map(p => <option key={p._id} value={p._id}>{p.name} (Tồn: {p.quantityInStock || 0}, Giá: {(p.sellingPrice ?? p.price ?? 0).toLocaleString('vi-VN')}₫)</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor={`quantity-input-${index}`} className={`${commonLabelClass} text-xs`}>Số Lượng {requiredSpan}</label>
                                                <input
                                                    id={`quantity-input-${index}`}
                                                    type="number"
                                                    min="1"
                                                    placeholder="1"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleProductDetailChange(index, 'quantity', val === '' ? '' : (parseInt(val, 10) || 1));
                                                    }}
                                                    className={commonInputClass}
                                                    required
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`unitPrice-input-${index}`} className={`${commonLabelClass} text-xs`}>
                                                    Đơn Giá Bán (VNĐ) {requiredSpan}
                                                </label>
                                                <input
                                                    id={`unitPrice-input-${index}`}
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    value={item.unitPrice ?? ''}
                                                    className={commonInputClass}
                                                    required
                                                    disabled={isSubmitting}
                                                    onChange={(e) => {
                                                        const raw = e.target.value;
                                                        handleProductDetailChange(
                                                            index,
                                                            'unitPrice',
                                                            raw === '' ? null : Number(raw)
                                                        );
                                                    }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProductLine(index)}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed h-10 self-end"
                                                title="Xóa dòng sản phẩm này"
                                                disabled={isSubmitting || formData.products.length <= 1}
                                            >
                                                <FaMinusCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {productsData.length === 0 && formData.products.some(p => !p.product) && <p className="text-xs text-amber-600 mt-1">Đang tải hoặc không có sản phẩm để chọn.</p>}
                                <button
                                    type="button"
                                    onClick={handleAddProductLine}
                                    className="mt-2 px-3 py-1.5 border border-dashed border-primary text-primary hover:bg-primary-lightest text-sm font-medium rounded-md flex items-center gap-2 disabled:opacity-60"
                                    disabled={isSubmitting}
                                >
                                    <FaPlus size={12} /> Thêm Dòng Sản Phẩm
                                </button>
                            </div>
                            {/* Footer Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 mt-2 border-t border-slate-200">
                                <button type="button" onClick={handleCloseModal} disabled={isSubmitting}
                                    className="w-full sm:w-auto justify-center inline-flex items-center px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dull disabled:opacity-60">
                                    Hủy
                                </button>
                                <button type="submit" disabled={isSubmitting}
                                    className="w-full sm:w-auto justify-center inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60">
                                    {isSubmitting ? (<><FaSpinner className="animate-spin -ml-1 mr-2.5 h-5 w-5" /> {isEditing ? "Đang lưu..." : "Đang tạo..."}</>)
                                        : (<>{isEditing ? <FaSave className="mr-2" /> : <FaPlus className="mr-2" />} {submitButtonText}</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesOrders;