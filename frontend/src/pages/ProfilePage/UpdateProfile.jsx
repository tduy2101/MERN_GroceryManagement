import React, { useState, useContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import { AppContext } from '../../context/appContext';
import { UserContext } from '../../context/UserContext';

import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import uploadImage from '../../utils/uploadImage';


const ProfileImageSelector = ({ currentImageUrl, onFileSelect, disabled, isLoading }) => {
    const [preview, setPreview] = useState(currentImageUrl);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (currentImageUrl && currentImageUrl !== preview && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0)) {
            setPreview(currentImageUrl);
        }
    }, [currentImageUrl, preview]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            onFileSelect(file);
        } else {
            setPreview(currentImageUrl);
            onFileSelect(null);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 shadow-md flex items-center justify-center bg-gray-100">
                {preview ? (
                    <img src={preview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={disabled || isLoading}
            />
            <button
                type="button"
                onClick={triggerFileInput}
                disabled={disabled || isLoading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dull focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-60"
            >
                {isLoading ? 'Đang tải lên...' : 'Thay đổi ảnh đại diện'}
            </button>
        </div>
    );
};


// --- Component chính UserProfilePage ---
const UserProfilePage = () => {
    const { user, updateUser: updateUserContext, loading: userLoading } = useContext(UserContext);
    const { navigate } = useContext(AppContext);

    const initialProfileData = {
        name: '',
        address: '',
    };
    const [profileFormData, setProfileFormData] = useState(initialProfileData);
    const [email, setEmail] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null);
    const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState('');

    const initialPasswordData = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    };
    const [passwordFormData, setPasswordFormData] = useState(initialPasswordData);

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setProfileFormData({
                name: user.name || '',
                address: user.address || '',
            });
            setEmail(user.email || '');
            setCurrentProfileImageUrl(user.profileImageUrl || '');
        } else {
            setProfileFormData(initialProfileData);
            setPasswordFormData(initialPasswordData);
            setEmail('');
            setCurrentProfileImageUrl('');
        }
    }, [user]);

    const handleProfilePicSelect = (file) => {
        setProfilePicFile(file);
        setProfileSuccess('');
        setProfileError('');
    };

    const handleProfileInputChange = (e) => {
        const { name, value } = e.target;
        setProfileFormData(prev => ({ ...prev, [name]: value }));
        setProfileError('');
        setProfileSuccess('');
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordFormData(prev => ({ ...prev, [name]: value }));
        setPasswordError('');
        setProfileSuccess('');
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        setIsUpdatingProfile(true);
        setIsUploadingImage(!!profilePicFile);

        if (!profileFormData.name.trim()) {
            setProfileError('Tên không được để trống.');
            setIsUpdatingProfile(false);
            setIsUploadingImage(false);
            return;
        }

        let newImageUrl = currentProfileImageUrl;

        try {
            if (profilePicFile) {
                const uploadRes = await uploadImage(profilePicFile);
                if (uploadRes && uploadRes.imageUrl) {
                    newImageUrl = uploadRes.imageUrl;
                } else {
                    throw new Error("Lỗi tải ảnh lên.");
                }
            }
            setIsUploadingImage(false);

            const updatedData = {
                name: profileFormData.name,
                address: profileFormData.address,
                profileImageUrl: newImageUrl,
            };

            const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, updatedData);

            if (response.data) {
                // Giả sử API trả về user object đầy đủ hoặc chỉ user object trong res.data.user
                const updatedUserFromServer = response.data.user || response.data;
                updateUserContext({ token: localStorage.getItem('token'), user: updatedUserFromServer });

                setProfileSuccess('Thông tin cá nhân đã được cập nhật!');
                toast.success('Cập nhật thông tin thành công!');
                setProfilePicFile(null);
                // currentProfileImageUrl sẽ được cập nhật qua useEffect khi user context thay đổi
            }
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Lỗi cập nhật thông tin.";
            setProfileError(message);
            toast.error(message);
            setIsUploadingImage(false);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setProfileSuccess('');

        const { currentPassword, newPassword, confirmNewPassword } = passwordFormData;

        if (!currentPassword) {
            setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }
        if (!newPassword || newPassword.length < 8) {
            setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
            return;
        }
        if (newPassword === currentPassword) {
            setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.REQUEST_PASSWORD_CHANGE, {
                currentPassword,
                newPassword,
            });

            toast.success(response.data.message || 'Yêu cầu đổi mật khẩu đã được gửi. Vui lòng kiểm tra email để xác nhận.');
            setProfileSuccess('Yêu cầu đổi mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn để hoàn tất việc thay đổi.');
            setPasswordFormData(initialPasswordData); // Reset form mật khẩu

        } catch (err) {
            const message = err.response?.data?.message || err.message || "Lỗi khi yêu cầu đổi mật khẩu.";
            setPasswordError(message);
            toast.error(message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (userLoading && !user) {
        return <div className="flex justify-center items-center h-screen"><p>Đang tải...</p></div>;
    }
    if (!user) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <p className="mb-4">Không tìm thấy thông tin người dùng.</p>
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dull">
                    Đăng nhập
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Tài khoản của tôi</h1>

            {profileSuccess && <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg shadow">{profileSuccess}</div>}

            {/* Phần cập nhật thông tin cá nhân */}
            <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8 mb-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">Thông tin cá nhân</h2>
                {profileError && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md">{profileError}</div>}
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <ProfileImageSelector
                        currentImageUrl={currentProfileImageUrl}
                        onFileSelect={handleProfilePicSelect}
                        disabled={isUpdatingProfile}
                        isLoading={isUploadingImage}
                    />
                    <div>
                        <label htmlFor="profileName" className="block text-sm font-medium text-gray-700">Tên hiển thị</label>
                        <input
                            type="text"
                            name="name" // Khớp với key trong profileFormData
                            id="profileName"
                            value={profileFormData.name}
                            onChange={handleProfileInputChange}
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
                            disabled={isUpdatingProfile}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="profileEmail" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            id="profileEmail"
                            value={email} // Email vẫn dùng state riêng do readOnly
                            readOnly
                            className="mt-1 block w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed focus:outline-none sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi qua giao diện này.</p>
                    </div>
                    <div>
                        <label htmlFor="profileAddress" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                        <input
                            type="text"
                            name="address" // Khớp với key trong profileFormData
                            id="profileAddress"
                            value={profileFormData.address}
                            onChange={handleProfileInputChange}
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
                            placeholder="Nhập địa chỉ của bạn"
                            disabled={isUpdatingProfile}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isUpdatingProfile || isUploadingImage}
                            className="px-8 py-3 text-base font-semibold text-white bg-primary rounded-lg shadow-md hover:bg-primary-dull focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isUpdatingProfile ? (isUploadingImage ? 'Đang tải ảnh...' : 'Đang lưu...') : 'Lưu thông tin'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Phần thay đổi mật khẩu */}
            <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">Thay đổi mật khẩu</h2>
                {passwordError && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md">{passwordError}</div>}
                <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                        <label htmlFor="currentPasswordInput" className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            name="currentPassword" 
                            id="currentPasswordInput"
                            autoComplete="current-password"
                            value={passwordFormData.currentPassword}
                            onChange={handlePasswordInputChange}
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
                            disabled={isChangingPassword}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="newPasswordInput" className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                        <input
                            type="password"
                            name="newPassword" // Khớp với key trong passwordFormData
                            id="newPasswordInput"
                            autoComplete="new-password"
                            value={passwordFormData.newPassword}
                            onChange={handlePasswordInputChange}
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
                            disabled={isChangingPassword}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmNewPasswordInput" className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            name="confirmNewPassword" // Khớp với key trong passwordFormData
                            id="confirmNewPasswordInput"
                            autoComplete="new-password"
                            value={passwordFormData.confirmNewPassword}
                            onChange={handlePasswordInputChange}
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
                            disabled={isChangingPassword}
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="px-8 py-3 text-base font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isChangingPassword ? 'Đang xử lý...' : 'Yêu Cầu Đổi Mật Khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfilePage;