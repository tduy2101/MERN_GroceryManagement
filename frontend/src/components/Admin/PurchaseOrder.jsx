// src/pages/PurchaseOrders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import toast from 'react-hot-toast';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaTimes, FaSpinner, FaBoxOpen, FaSave, FaMinusCircle } from 'react-icons/fa';
import { API_PATHS, BASE_URL } from '../../utils/apiPath';

// ----- Constants & UI Components -----
const commonInputClass = "block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
const requiredSpan = <span className="text-red-500 ml-0.5">*</span>;

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <FaSpinner className="animate-spin text-4xl mb-3 text-primary" />
        <span>Đang tải danh sách phiếu nhập...</span>
    </div>
);

const NoOrdersState = ({ onAdd, disabled }) => (
    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
        <FaBoxOpen className="text-5xl mb-4" />
        <p className="text-lg mb-1">Chưa có phiếu nhập nào.</p>
        <p className="text-sm mb-4">Bắt đầu bằng cách tạo phiếu nhập đầu tiên của bạn.</p>
        <button
            onClick={onAdd}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
            disabled={disabled}
        >
            <FaPlus /> Tạo Phiếu Nhập Mới
        </button>
    </div>
);

const NoSearchResultsState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <FaSearch className="text-5xl mb-3" />
        <span className="text-lg">Không có phiếu nhập nào khớp với tìm kiếm.</span>
    </div>
);

const initialProductLine = { product: '', quantity: 1, unitPrice: 0, tempId: Date.now().toString() + Math.random().toString(36).substring(2) };
const initialFormData = {
    supplier: '',
    products: [initialProductLine]
};

const PurchaseOrders = () => {
    const [addEditModal, setAddEditModal] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [productsData, setProductsData] = useState([]);
    const token = localStorage.getItem('token');

    // --- Modal Handling ---
    const fetchSuppliersAndProductsForModal = useCallback(async () => {
        try {
            const [suppliersRes, productsRes] = await Promise.all([
                axios.get(`${BASE_URL}${API_PATHS.SUPPLIER?.GET_ALL_SUPPLIERS || '/api/supplier/get'}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_URL}${API_PATHS.PRODUCT?.GET_ALL_PRODUCTS || '/api/product/get'}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setSuppliers(suppliersRes.data?.data || suppliersRes.data || []);
            setProductsData(productsRes.data?.data || productsRes.data || []);
        } catch (err) {
            console.error('Lỗi tải NCC hoặc sản phẩm:', err);
            toast.error("Không thể tải dữ liệu cho form.");
        }
    }, [token]);

    const handleOpenAddModal = useCallback(async () => {
        await fetchSuppliersAndProductsForModal();
        setFormData(initialFormData);
        setCurrentOrderId(null);
        setAddEditModal('ADD');
    }, [fetchSuppliersAndProductsForModal]);

    const handleOpenEditModal = useCallback(async (order) => {
        await fetchSuppliersAndProductsForModal();
        setFormData({
            supplier: order.supplier?._id || order.supplier || '',
            products: order.products.map(p => ({
                product: p.product?._id || p.product || '',
                quantity: p.quantity || 1,
                unitPrice: p.unitPrice || 0,
                tempId: p._id || Date.now().toString() + Math.random().toString(36).substring(2)
            }))
        });
        setCurrentOrderId(order._id);
        setAddEditModal('EDIT');
    }, [fetchSuppliersAndProductsForModal]);

    const handleCloseModal = useCallback(() => {
        if (isSubmitting) return;
        setAddEditModal(null);
        setFormData(initialFormData);
        setCurrentOrderId(null);
    }, [isSubmitting]);

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') handleCloseModal();
        };
        if (addEditModal) document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [addEditModal, handleCloseModal]);

    // --- Data Fetching ---
    const fetchOrders = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const endpoint = `${BASE_URL}${API_PATHS.PURCHASE_ORDER?.GET_ALL || '/api/purchase-orders'}`;
            const response = await axios.get(endpoint, { headers: { "Authorization": `Bearer ${token}` } });
            const data = response.data?.data || response.data || [];
            if (Array.isArray(data)) {
                setOrders(data);
                setFilteredOrders(data);
            } else {
                console.warn("Dữ liệu phiếu nhập không hợp lệ:", response.data);
                toast.error("Không thể tải dữ liệu phiếu nhập.");
                setOrders([]);
                setFilteredOrders([]);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi tải danh sách phiếu nhập.");
        } finally {
            setIsLoadingData(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // --- Form Handling for Modal ---
    const handleSupplierChange = useCallback((e) => {
        setFormData(prev => ({ ...prev, supplier: e.target.value }));
    }, []);

    const handleProductDetailChange = useCallback((tempId, field, value) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.map(p =>
                p.tempId === tempId ? { ...p, [field]: value } : p
            )
        }));
    }, []);

    const handleAddProductLine = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { ...initialProductLine, tempId: Date.now().toString() + Math.random().toString(36).substring(2) }]
        }));
    }, []);

    const handleRemoveProductLine = useCallback((tempIdToRemove) => {
        if (formData.products.length <= 1) {
            toast.error("Phải có ít nhất một sản phẩm trong phiếu nhập.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter(p => p.tempId !== tempIdToRemove)
        }));
    }, [formData.products]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.supplier) {
            toast.error("Vui lòng chọn nhà cung cấp.");
            return;
        }
        if (formData.products.some(p => !p.product || p.quantity <= 0 || p.unitPrice < 0)) {
            toast.error("Thông tin sản phẩm không hợp lệ (Sản phẩm, SL > 0, Đơn giá >= 0).");
            return;
        }
        setIsSubmitting(true);
        const payload = {
            supplier: formData.supplier,
            products: formData.products.map(({ ...rest }) => ({
                product: rest.product,
                quantity: Number(rest.quantity),
                unitPrice: Number(rest.unitPrice)
            }))
        };
        try {
            const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
            if (addEditModal === 'EDIT' && currentOrderId) {
                await axios.put(`${BASE_URL}${API_PATHS.PURCHASE_ORDER?.UPDATE(currentOrderId) || `/api/purchase-orders/${currentOrderId}`}`, payload, { headers });
                toast.success("Cập nhật phiếu nhập thành công!");
            } else if (addEditModal === 'ADD') {
                await axios.post(`${BASE_URL}${API_PATHS.PURCHASE_ORDER?.CREATE || '/api/purchase-orders'}`, payload, { headers });
                toast.success("Thêm phiếu nhập thành công!");
            }
            handleCloseModal();
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thao tác phiếu nhập thất bại.");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, addEditModal, currentOrderId, token, handleCloseModal, fetchOrders]);

    // --- Delete Handling ---
    const handleDelete = useCallback(async (orderId) => {
        if (window.confirm("Bạn chắc chắn muốn xóa phiếu nhập này?")) {
            setIsSubmitting(true);
            try {
                await axios.delete(`${BASE_URL}${API_PATHS.PURCHASE_ORDER?.DELETE(orderId) || `/api/purchase-orders/${orderId}`}`, { headers: { "Authorization": `Bearer ${token}` } });
                toast.success("Xóa phiếu nhập thành công!");
                fetchOrders();
            } catch (error) {
                toast.error(error.response?.data?.message || "Xóa phiếu nhập thất bại.");
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [token, fetchOrders]);

    // --- Search/Filter ---
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (searchTerm.trim() === '') {
            setFilteredOrders(orders);
        } else {
            const filtered = orders.filter(order =>
                (order.poCode && order.poCode.toLowerCase().includes(lowercasedFilter)) ||
                (order.supplier?.name && order.supplier.name.toLowerCase().includes(lowercasedFilter)) ||
                (order._id && order._id.toLowerCase().includes(lowercasedFilter))
            );
            setFilteredOrders(filtered);
        }
    }, [searchTerm, orders]);

    const handleSearchChange = useCallback((e) => setSearchTerm(e.target.value), []);

    // --- Render Helpers ---
    const isEditing = addEditModal === 'EDIT';
    const modalTitle = isEditing ? "Chỉnh Sửa Phiếu Nhập" : "Tạo Phiếu Nhập Mới";
    const submitButtonText = isEditing ? "Lưu Thay Đổi" : "Tạo Phiếu Nhập";
    const isAnyTaskRunning = isSubmitting || isLoadingData;

    return (
        <div className='w-full min-h-screen flex flex-col gap-6 p-4 sm:p-6 bg-slate-50'>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full pb-4 border-b border-slate-200">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-0">Quản Lý Phiếu Nhập Hàng</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-64 md:w-72">
                        <input
                            type="text"
                            placeholder="Tìm mã phiếu, nhà cung cấp..."
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
                        <FaPlus /> Tạo Phiếu Nhập
                    </button>
                </div>
            </div>
            {/* Content Area: Loading, Empty, or Table */}
            {isLoadingData && orders.length === 0 && !addEditModal ? <LoadingState />
                : !isLoadingData && orders.length === 0 && !searchTerm ? <NoOrdersState onAdd={handleOpenAddModal} disabled={isAnyTaskRunning} />
                    : !isLoadingData && filteredOrders.length === 0 && searchTerm ? <NoSearchResultsState />
                        : (
                            <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                                <table className="w-full text-sm text-left text-slate-700">
                                    <thead className="text-xs text-white uppercase bg-primary whitespace-nowrap">
                                        <tr>
                                            {['#', 'Mã Phiếu', 'Nhà Cung Cấp', 'Ngày Tạo', 'Tổng Tiền', 'Hành Động'].map(header => (
                                                <th key={header} scope="col" className="px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((order, index) => (
                                            <tr key={order._id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-slate-900">{order.poCode || order._id.slice(-6).toUpperCase()}</td>
                                                <td className="px-4 py-3 text-slate-600">{order.supplier?.name || 'N/A'}</td>
                                                <td className="px-4 py-3 text-slate-600">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-4 py-3 text-slate-600 font-semibold text-green-600">
                                                    {(order.totalAmount || 0).toLocaleString('vi-VN')}₫
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                        <button
                                                            title="Chỉnh sửa"
                                                            className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleOpenEditModal(order)}
                                                            disabled={isAnyTaskRunning}
                                                        > <FaEdit size={16} /> </button>
                                                        <button
                                                            title="Xóa"
                                                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleDelete(order._id)}
                                                            disabled={isAnyTaskRunning}
                                                        > <FaTrashAlt size={16} /> </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {isLoadingData && orders.length > 0 &&
                                    <div className="text-center py-3 text-sm text-slate-500 flex items-center justify-center">
                                        <FaSpinner className="animate-spin inline mr-2" />Đang cập nhật...
                                    </div>
                                }
                            </div>
                        )}
            {/* Modal for Add/Edit Purchase Order */}
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
                            {/* Supplier Selection */}
                            <div>
                                <label htmlFor="supplier" className={commonLabelClass}>Nhà Cung Cấp {requiredSpan}</label>
                                <select
                                    id="supplier"
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleSupplierChange}
                                    className={commonInputClass}
                                    required
                                    disabled={isSubmitting || suppliers.length === 0}
                                >
                                    <option value="">-- Chọn nhà cung cấp --</option>
                                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                {suppliers.length === 0 && <p className="text-xs text-amber-600 mt-1">Đang tải hoặc không có nhà cung cấp.</p>}
                            </div>
                            {/* Products Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-slate-700 border-b pb-2">Chi Tiết Sản Phẩm</h3>
                                {formData.products.map((item) => (
                                    <div key={item.tempId} className="p-3 border border-slate-200 rounded-md bg-slate-50 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr_1.5fr_auto] gap-3 items-end">
                                            <div>
                                                <label htmlFor={`product-${item.tempId}`} className={`${commonLabelClass} text-xs`}>Sản phẩm {requiredSpan}</label>
                                                <select
                                                    id={`product-${item.tempId}`}
                                                    value={item.product}
                                                    onChange={(e) => handleProductDetailChange(item.tempId, 'product', e.target.value)}
                                                    className={commonInputClass}
                                                    required
                                                    disabled={isSubmitting || productsData.length === 0}
                                                >
                                                    <option value="">-- Chọn sản phẩm --</option>
                                                    {productsData.map(p => <option key={p._id} value={p._id}>{p.name} (Tồn: {p.quantityInStock || 0})</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor={`quantity-${item.tempId}`} className={`${commonLabelClass} text-xs`}>Số Lượng {requiredSpan}</label>
                                                <input
                                                    id={`quantity-${item.tempId}`}
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleProductDetailChange(item.tempId, 'quantity', e.target.value)}
                                                    className={commonInputClass}
                                                    required
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`unitPrice-${item.tempId}`} className={`${commonLabelClass} text-xs`}>Đơn Giá (VNĐ) {requiredSpan}</label>
                                                <input
                                                    id={`unitPrice-${item.tempId}`}
                                                    type="number"
                                                    value={item.unitPrice ?? ''}
                                                    className={commonInputClass}
                                                    required
                                                    disabled={isSubmitting}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === '') {
                                                            handleProductDetailChange(item.tempId, 'unitPrice', null);
                                                        } else {
                                                            const numericValue = parseFloat(value);
                                                            handleProductDetailChange(item.tempId, 'unitPrice', isNaN(numericValue) ? null : numericValue);
                                                        }
                                                    }} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProductLine(item.tempId)}
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

export default PurchaseOrders;