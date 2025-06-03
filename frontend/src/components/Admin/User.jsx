import React, { useEffect, useState, useCallback, useContext } from "react";
import axios from "axios";
import toast from 'react-hot-toast';
import { API_PATHS, BASE_URL } from "../../utils/apiPath"; // Đảm bảo đường dẫn đúng
import { UserContext } from "../../context/userContext"; // Đảm bảo đường dẫn đúng
import { FaUserEdit, FaTrashAlt, FaPlus, FaSpinner, FaExclamationTriangle, FaUsers } from 'react-icons/fa';

// ----- Constants & UI Components -----
const commonInputClass = "block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-slate-50 disabled:cursor-not-allowed";
const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
const requiredSpan = <span className="text-red-500 ml-0.5">*</span>;

const LoadingState = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-slate-500">
        <FaSpinner className="animate-spin text-5xl mb-4 text-primary" />
        <span className="text-lg">Đang tải dữ liệu người dùng...</span>
    </div>
);

const ErrorState = ({ error, onRetry, isLoading }) => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center text-red-600 p-6 bg-red-50 rounded-lg shadow">
        <FaExclamationTriangle className="text-5xl mb-4" />
        <p className="text-xl font-semibold mb-2">Rất tiếc! Đã có lỗi xảy ra.</p>
        <p className="text-md mb-3">{error}</p>
        <button
            onClick={onRetry}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium flex items-center gap-2"
            disabled={isLoading}
        >
            {isLoading ? <FaSpinner className="animate-spin" /> : 'Thử lại'}
        </button>
    </div>
);

const NoUsersState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
        <FaUsers className="text-5xl mb-4" />
        <p className="text-lg mb-1">Không tìm thấy người dùng nào trong hệ thống.</p>
        <p className="text-sm">Bạn có thể bắt đầu bằng cách thêm người dùng mới.</p>
    </div>
);

const initialFormData = {
    name: "",
    email: "",
    password: "",
    address: "",
    role: "user", // Giá trị mặc định là 'user'
};

const Users = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [users, setUsers] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    const TOKEN_KEY = "token";
    const { user: loggedInUser, loading: userContextLoading } = useContext(UserContext);

    const fetchUsers = useCallback(async () => {
        setIsLoadingData(true);
        setGlobalError(null);
        try {
            const response = await axios.get(`${BASE_URL}${API_PATHS.USERS.GET_ALL_USERS}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
            });
            const data = response.data?.data || response.data;
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                const msg = response.data?.message || "Lấy danh sách người dùng thất bại: Dữ liệu không mong muốn.";
                setGlobalError(msg); setUsers([]); toast.error(msg);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Lấy danh sách người dùng thất bại.";
            setGlobalError(errorMessage); setUsers([]); toast.error(errorMessage);
        } finally {
            setIsLoadingData(false);
        }
    }, [TOKEN_KEY]);

    useEffect(() => {
        if (!userContextLoading) {
            fetchUsers();
        }
    }, [fetchUsers, userContextLoading]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    }, []);

    const handleEditClick = useCallback((userToEdit) => {
        setIsEditMode(true);
        setEditingUserId(userToEdit._id);
        setFormData({
            name: userToEdit.name || '',
            email: userToEdit.email || '',
            address: userToEdit.address || "",
            role: userToEdit.role || 'user',
            password: "", // Luôn để trống password khi edit
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleCancelEdit = useCallback(() => {
        setIsEditMode(false);
        setEditingUserId(null);
        setFormData(initialFormData);
        setGlobalError(null);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.role) {
            toast.error("Tên, Email, và Vai trò là bắt buộc.");
            return;
        }
        if (!isEditMode && (!formData.password || formData.password.length < 8)) {
            toast.error("Mật khẩu là bắt buộc (ít nhất 8 ký tự) cho người dùng mới.");
            return;
        }
        if (isEditMode && formData.password && formData.password.length > 0 && formData.password.length < 8) {
            toast.error("Nếu thay đổi, mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }

        setIsSubmitting(true);
        setGlobalError(null);

        const token = localStorage.getItem(TOKEN_KEY);
        const headers = { Authorization: `Bearer ${token}` };
        let apiPromise;
        const dataToSend = { ...formData };

        if (isEditMode) {
            if (!dataToSend.password || dataToSend.password.trim() === "") {
                delete dataToSend.password;
            }
            apiPromise = axios.put(`${BASE_URL}${API_PATHS.USERS.UPDATE_USER(editingUserId)}`, dataToSend, { headers });
        } else {
            apiPromise = axios.post(`${BASE_URL}${API_PATHS.USERS.CREATE_USER}`, dataToSend, { headers });
        }

        try {
            const response = await apiPromise;
            if (response.data && (response.data.success === true || response.status === 200 || response.status === 201)) {
                toast.success(response.data.message || `Người dùng đã được ${isEditMode ? 'cập nhật' : 'thêm'} thành công!`);
                handleCancelEdit();
                fetchUsers();
            } else {
                const msg = response.data?.message || `Lỗi khi ${isEditMode ? 'cập nhật' : 'thêm'} người dùng.`;
                setGlobalError(msg);
                toast.error(msg);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || `Không thể ${isEditMode ? 'cập nhật' : 'thêm'} người dùng.`;
            setGlobalError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, isEditMode, editingUserId, handleCancelEdit, fetchUsers, TOKEN_KEY]);

    const handleDelete = useCallback(async (userIdToDelete) => {
        if (loggedInUser && loggedInUser._id === userIdToDelete) {
            toast.error("Bạn không thể tự xóa tài khoản của mình.");
            return;
        }
        const userToDeleteDetails = users.find(u => u._id === userIdToDelete);
        if (userToDeleteDetails && userToDeleteDetails.role === 'admin' && loggedInUser?.role !== 'superadmin') { // Giả sử có role 'superadmin'
            toast.error("Bạn không có quyền xóa tài khoản quản trị viên khác.");
            return;
        }

        if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.")) {
            setIsSubmitting(true);
            setGlobalError(null);
            try {
                const response = await axios.delete(`${BASE_URL}${API_PATHS.USERS.DELETE_USER(userIdToDelete)}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
                });
                if (response.data && (response.data.success === true || response.status === 200)) {
                    toast.success(response.data.message || "Xóa người dùng thành công!");
                    fetchUsers();
                } else {
                    toast.error(response.data?.message || "Lỗi khi xóa người dùng.");
                }
            } catch (err) {
                toast.error(err.response?.data?.message || err.message || "Không thể xóa người dùng.");
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [loggedInUser, users, fetchUsers, TOKEN_KEY]);

    const isAnyTaskRunning = isSubmitting || isLoadingData;

    if (userContextLoading) return <LoadingState />;
    if (isLoadingData && users.length === 0) return <LoadingState />;
    if (!isLoadingData && globalError && users.length === 0) return <ErrorState error={globalError} onRetry={fetchUsers} isLoading={isLoadingData} />;

    return (
        <div className='w-full min-h-screen flex flex-col gap-6 p-4 sm:p-6 bg-slate-50'>
            <div className="pb-4 border-b border-slate-200">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Quản Lý Người Dùng</h1>
            </div>

            {globalError && users.length > 0 && (
                <div className="my-4 p-3 text-sm text-center text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center gap-2">
                    <FaExclamationTriangle /> {globalError}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Form Section */}
                <div className="lg:w-1/3 xl:w-1/4 bg-white shadow-xl rounded-xl p-5 sm:p-6 self-start">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-700 mb-5 sm:mb-6 text-center border-b border-slate-200 pb-3">
                        {isEditMode ? "Chỉnh Sửa Thông Tin Người Dùng" : "Thêm Người Dùng Mới"}
                    </h2>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="userName" className={commonLabelClass}>Họ và Tên {requiredSpan}</label>
                            <input type="text" id="userName" name="name" value={formData.name} onChange={handleChange} placeholder="Nhập họ và tên" className={commonInputClass} required autoComplete="name" disabled={isSubmitting} />
                        </div>
                        <div>
                            <label htmlFor="userEmail" className={commonLabelClass}>Email {requiredSpan}</label>
                            <input type="email" id="userEmail" name="email" value={formData.email} onChange={handleChange} placeholder="vidu@email.com" className={commonInputClass} required autoComplete="email" disabled={isSubmitting} />
                        </div>
                        <div>
                            <label htmlFor="userPassword" className={commonLabelClass}>
                                Mật khẩu {isEditMode ? <span className="text-xs text-slate-500">(Để trống nếu không đổi)</span> : requiredSpan}
                            </label>
                            <input type="password" id="userPassword" name="password" value={formData.password} onChange={handleChange} placeholder="Ít nhất 8 ký tự" className={commonInputClass} required={!isEditMode} autoComplete="new-password" disabled={isSubmitting} />
                        </div>
                        <div>
                            <label htmlFor="userAddress" className={commonLabelClass}>Địa chỉ</label>
                            <textarea id="userAddress" name="address" value={formData.address} onChange={handleChange} placeholder="VD: Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP" rows="2" className={`${commonInputClass} min-h-[60px]`} autoComplete="street-address" disabled={isSubmitting}></textarea>
                        </div>
                        <div>
                            <label htmlFor="userRole" className={commonLabelClass}>Vai trò {requiredSpan}</label>
                            <select name="role" id="userRole" value={formData.role} onChange={handleChange} className={commonInputClass} required disabled={isSubmitting} >
                                <option value="" disabled>-- Chọn vai trò --</option>
                                <option value="admin">Quản trị viên (Admin)</option>
                                <option value="staff">Nhân viên (Staff)</option>
                                <option value="user">Người dùng (User)</option>
                            </select>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-3">
                            <button
                                type="submit"
                                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <><FaSpinner className="animate-spin -ml-1 mr-2.5 h-5 w-5" /> {isEditMode ? "Đang cập nhật..." : "Đang thêm..."}</>
                                ) : (
                                    <>{isEditMode ? <FaUserEdit className="mr-2" /> : <FaPlus className="mr-2" />} {isEditMode ? "Cập Nhật" : "Thêm Mới"}</>
                                )}
                            </button>
                            {isEditMode && (
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

                {/* Users List Section */}
                <div className="lg:w-2/3 xl:w-3/4">
                    <div className="bg-white shadow-xl rounded-xl p-1 sm:p-2 md:p-4">
                        <div className="overflow-x-auto">
                            {!isLoadingData && users.length === 0 && !globalError ? <NoUsersState /> : (
                                <table className="w-full text-sm text-left text-slate-700">
                                    <thead className="text-xs text-white uppercase bg-primary whitespace-nowrap">
                                        <tr>
                                            {['#', 'Họ Tên', 'Email', 'Địa Chỉ', 'Vai Trò', 'Hành Động'].map(header => (
                                                <th key={header} scope="col" className="px-3 sm:px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user, index) => {
                                            const isSelf = loggedInUser && loggedInUser._id === user._id;
                                            const canDelete = !isSelf && !(user.role === 'admin' && loggedInUser?.role !== 'superadmin'); // Giả định có superadmin

                                            return (
                                                <tr key={user._id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                                    <td className="px-3 sm:px-4 py-3 text-slate-500">{index + 1}</td>
                                                    <td className="px-3 sm:px-4 py-3 font-medium text-slate-900">{user.name}</td>
                                                    <td className="px-3 sm:px-4 py-3 text-slate-600">{user.email}</td>
                                                    <td className="px-3 sm:px-4 py-3 text-slate-600 whitespace-normal break-words max-w-xs">{user.address || 'Chưa cập nhật'}</td>
                                                    <td className="px-3 sm:px-4 py-3">
                                                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                                                        ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                                user.role === 'staff' ? 'bg-amber-100 text-amber-800' : // Đổi màu staff
                                                                    'bg-green-100 text-green-800'}`}>
                                                            {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : 'Người dùng'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                            <button
                                                                title="Chỉnh sửa người dùng"
                                                                className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                onClick={() => handleEditClick(user)}
                                                                disabled={isAnyTaskRunning}
                                                            >
                                                                <FaUserEdit size={15} />
                                                            </button>
                                                            <button
                                                                title={!canDelete ? (isSelf ? "Không thể tự xóa" : "Không thể xóa quản trị viên") : "Xóa người dùng"}
                                                                className={`p-1.5 sm:p-2 rounded-full transition-colors disabled:opacity-50
                                                                ${canDelete ? 'text-red-600 hover:text-red-800 hover:bg-red-100' : 'text-gray-400 cursor-not-allowed bg-gray-100'}`}
                                                                onClick={() => canDelete && handleDelete(user._id)}
                                                                disabled={isAnyTaskRunning || !canDelete}
                                                            >
                                                                <FaTrashAlt size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                            {isLoadingData && users.length > 0 &&
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

export default Users;