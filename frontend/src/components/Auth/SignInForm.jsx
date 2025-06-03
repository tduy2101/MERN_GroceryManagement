import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../Inputs/Input';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import { UserContext } from '../../context/userContext';

const SignInForm = ({ onSwitchToSignUp }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const { updateUser } = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }
        if (!password || password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        setError(null);

        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
                email,
                password
            });


            // Lấy các trường trực tiếp từ response.data vì backend trả về object phẳng
            const token = response.data.token;
            const userId = response.data._id; // Hoặc response.data.id tùy theo tên trường ID trong response
            const userName = response.data.name;
            const userEmail = response.data.email; // Đổi tên để không trùng state 'email'
            const userRole = response.data.role;
            const userAvatarUrl = response.data.profileImageUrl; // Lấy profileImageUrl làm avatar

            // Kiểm tra các trường quan trọng
            if (token && userEmail) { // Chỉ cần token và email là đủ để coi là thành công ban đầu
                // Tạo object user để truyền cho UserContext
                const userObjectForContext = {
                    _id: userId,
                    name: userName,
                    email: userEmail,
                    role: userRole,
                    profileImageUrl: userAvatarUrl
                };

                localStorage.setItem('token', token);
                updateUser(userObjectForContext); // Truyền object user đã được cấu trúc
                navigate('/'); // Điều hướng về trang chủ

            } else {
                setError('Login failed. Invalid or incomplete response from server.');
            }
        } catch (error) {
            console.error("Login API Error:", error.response?.data?.message || error.message || error);
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message); // Ví dụ: "Invalid email or password" từ backend
            } else if (error.response && error.response.status === 401) {
                setError('Invalid email or password.');
            }
            else {
                setError('An error occurred during login. Please try again.');
            }
        }
    };

    return (
        <div className="w-1/2 h-full overflow-y-auto bg-[#f9f9f9] absolute left-1/2 top-0 auth-hide-scrollbar">
            <div className="flex flex-col justify-center min-h-full w-4/5 mx-auto relative py-8 px-4 sm:px-0">
                <h2 className="font-bold text-[2.6em] text-[#673AB7] mt-[0.2em] mb-[0.1em]">Login</h2>

                <form id="form-login" onSubmit={handleLogin}>
                    {/* Email Input */}
                    <div className="auth-form-element-stack">
                        <label htmlFor="email-login" className="auth-label auth-label-light font-medium">Email</label>
                        <Input
                            id="email-login"
                            type="text"
                            name="email"
                            value={email}
                            onChange={({ target }) => setEmail(target.value)}
                            placeholder='user@example.com'
                            className="auth-input-base auth-input-style-light auth-input-light-theme placeholder:text-gray-400"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="auth-form-element-stack">
                        <label htmlFor="password-login" className="auth-label auth-label-light font-medium">Password</label>
                        <Input
                            id="password-login"
                            type="password"
                            name="password"
                            placeholder='Min 8 characters'
                            minLength={8}
                            value={password}
                            onChange={({ target }) => setPassword(target.value)}
                            className="auth-input-base auth-input-style-light auth-input-light-theme placeholder:text-gray-400"
                        />
                    </div>

                    {/* Footer of form */}
                    {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

                    <div className='italic text-xs'>
                        Don't have account?{' '}
                        <a onClick={onSwitchToSignUp} className="auth-terms-link underline">SignUp</a>
                    </div>

                    {/* Submit Form */}
                    <div className="auth-form-element-submit flex flex-row gap-4 items-start">
                        {/* Cột trái: Log In và Cancel */}
                        <div className="flex flex-col gap-3">
                            <button type="submit" className="auth-button-base auth-button-login-main">
                                Log In
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Cột phải: Sign Up */}
                        <div className="pt-0">
                            <button
                                type="button"
                                onClick={onSwitchToSignUp}
                                className="auth-button-base auth-button-off auth-button-off-login"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SignInForm;
