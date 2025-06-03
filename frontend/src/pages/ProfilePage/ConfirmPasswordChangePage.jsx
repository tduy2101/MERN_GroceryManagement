// src/pages/ConfirmPasswordChangePage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';

const ConfirmPasswordChangePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('Đang xử lý yêu cầu của bạn...');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setMessage('Token xác nhận không hợp lệ hoặc bị thiếu.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        const confirmChange = async () => {
            try {
                const response = await axiosInstance.post(API_PATHS.AUTH.CONFIRM_PASSWORD_CHANGE, { token });
                setMessage(response.data.message || 'Mật khẩu của bạn đã được thay đổi thành công!');
                setIsError(false);
                toast.success('Mật khẩu đã được cập nhật thành công!');
                // Tùy chọn: tự động chuyển hướng sau vài giây
                setTimeout(() => {
                    navigate('/login'); // Hoặc trang profile nếu muốn người dùng đăng nhập lại ngay
                }, 4000);
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Không thể xác nhận thay đổi mật khẩu. Token có thể đã hết hạn hoặc không hợp lệ. Vui lòng thử lại hoặc yêu cầu một link mới.';
                setMessage(errorMessage);
                setIsError(true);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        confirmChange();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Đang Xác Nhận</h1>
                        <p className="text-gray-600">{message}</p>
                    </>
                ) : (
                    <>
                        <h1 className={`text-3xl font-bold mb-6 ${isError ? 'text-red-600' : 'text-green-600'}`}>
                            {isError ? 'Xác Nhận Thất Bại' : 'Xác Nhận Thành Công'}
                        </h1>
                        <p className="text-lg text-gray-700 mb-6">{message}</p>
                        {!isError && (
                            <p className="mt-2 text-sm text-gray-500">Bạn sẽ được chuyển hướng sau giây lát...</p>
                        )}
                        <Link
                            to={isError ? "/profile" : "/login"} // Hoặc /forgot-password nếu lỗi
                            className={`mt-8 inline-block px-8 py-3 text-base font-semibold text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${isError ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' : 'bg-primary hover:bg-primary-dull focus:ring-primary'}`}
                        >
                            {isError ? 'Thử Lại' : 'Tới Trang Đăng Nhập'}
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfirmPasswordChangePage;