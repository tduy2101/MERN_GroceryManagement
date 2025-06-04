// SignUpForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import { validateEmail } from '../../utils/helper';
import ProfilePhotoSelector from '../Inputs/ProfilePhotoSelector'; 
import Input from '../Inputs/Input'; 
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import uploadImage from '../../utils/uploadImage';

const SignUpForm = ({ onSwitchToLogin }) => {
    const [profilePic, setProfilePic] = useState(null);
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [adminInviteToken, setAdminInviteToken] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Hàm để reset các trường của form
    const resetForm = () => {
        setUserName("");
        setEmail("");
        setPassword("");
        setProfilePic(null); 
        setAdminInviteToken("");
        setAgreeToTerms(false);
        setError(null); 
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(null); // Reset lỗi trước mỗi lần submit

        // Validate inputs
        if (!validateEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!userName.trim()) {
            setError('Please enter a username.');
            return;
        }
        if (!password || password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (!agreeToTerms) {
            setError('You must agree to the terms and privacy policy.');
            return;
        }


        setLoading(true);
        let profileImageUrl = "";

        try {
            // Upload profile picture if provided
            if (profilePic) {
                const imgUploadRes = await uploadImage(profilePic, 'avatar');
                if (imgUploadRes && imgUploadRes.imageUrl) {
                    profileImageUrl = imgUploadRes.imageUrl;
                } else {
                    console.warn("Image upload did not return a valid imageUrl. Proceeding without profile image.");
                }
            }

            // Gọi API đăng ký
            const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
                name: userName.trim(),
                email,
                password,
                adminInviteToken: adminInviteToken.trim() || undefined,
                profileImageUrl: profileImageUrl || undefined
            });

            // Kiểm tra response từ API register
            if (response.status === 201) {
                toast.success("Bạn đã đăng ký thành công!\nMời bạn đăng nhập lại! <3");
                resetForm(); // Reset các trường trong form
                navigate('/login'); // Chuyển hướng đến trang login
            } else {
                setError(response.data.message || "Đăng ký không thành công. Vui lòng thử lại.");
            }

        } catch (err) {
            console.error("Sign up error:", err.response?.data || err.message || err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message); // Lỗi từ backend 
            } else if (err.request) {
                setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
            }
            else {
                setError('Đã xảy ra lỗi không mong muốn trong quá trình đăng ký. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false); // Kết thúc loading dù thành công hay thất bại
        }
    };

    return (
        <div className="w-1/2 h-full overflow-y-auto bg-[#2C3034] absolute left-0 top-0 auth-hide-scrollbar">
            <div className="flex flex-col justify-center min-h-full w-4/5 mx-auto relative py-8 px-4 sm:px-0">
                <h2 className="text-[2.6em] text-[#03A9F4] mt-[0.2em] mb-[0.1em] font-bold">Sign Up</h2>

                <form onSubmit={handleSignUp} id="form-signup">

                    <ProfilePhotoSelector
                        image={profilePic}
                        setImage={setProfilePic}
                        disabled={loading} // Thêm disabled nếu cần
                    />

                    {/* Email */}
                    <div className="auth-form-element-stack">
                        <label htmlFor="email-signup" className="auth-label auth-label-dark font-medium">Email</label>
                        <Input
                            id="email-signup"
                            type="email"
                            name="email"
                            value={email}
                            onChange={({ target }) => setEmail(target.value)}
                            className="auth-input-base auth-input-style-dark auth-input-dark-theme placeholder:text-gray-400"
                            placeholder='user@example.com'
                            disabled={loading}
                            required 
                        />
                    </div>

                    {/* Username */}
                    <div className="auth-form-element-stack">
                        <label htmlFor="username-signup" className="auth-label auth-label-dark font-medium">Username</label>
                        <Input
                            id="username-signup"
                            type="text"
                            name="username"
                            value={userName}
                            onChange={({ target }) => setUserName(target.value)}
                            placeholder='Username'
                            className="auth-input-base auth-input-style-dark auth-input-dark-theme placeholder:text-gray-400"
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="auth-form-element-stack">
                        <label htmlFor="password-signup" className="auth-label auth-label-dark font-medium">Password</label>
                        <Input
                            id="password-signup"
                            type="password"
                            name="password"
                            value={password}
                            onChange={({ target }) => setPassword(target.value)}
                            placeholder='Min 8 characters'
                            className="auth-input-base auth-input-style-dark auth-input-dark-theme placeholder:text-gray-400"
                            disabled={loading}
                            required
                            minLength={8} // HTML5 validation
                        />
                    </div>

                    {/* Admin Invite Token (Optional) */}
                    <div className="auth-form-element-stack">
                        <label htmlFor="admin-invite-token" className="auth-label auth-label-dark font-medium">Admin Invite Token <span className="text-xs text-gray-400">(Optional)</span></label>
                        <Input
                            id="admin-invite-token"
                            type="password" // Giữ type password để ẩn token
                            name="adminInviteToken"
                            value={adminInviteToken}
                            onChange={({ target }) => setAdminInviteToken(target.value)}
                            placeholder="Enter if you have one"
                            className="auth-input-base auth-input-style-dark auth-input-dark-theme placeholder:text-gray-400"
                            disabled={loading}
                        />
                    </div>

                    {/* Terms checkbox */}
                    <div className="auth-form-element-checkbox">
                        <input
                            id="confirm-terms"
                            type="checkbox"
                            name="confirmTerms"
                            className="auth-custom-checkbox" // Đảm bảo class này được style đúng
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            disabled={loading}
                            required
                        />
                        <label htmlFor="confirm-terms" className="auth-form-checkbox-label auth-form-checkbox-label-dark ">
                            Tôi đồng ý với <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="auth-terms-link">Điều khoản dịch vụ</a> và <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="auth-terms-link">Chính sách bảo mật</a>.
                        </label>
                    </div>

                    {error && <p className="text-red-500 text-xs py-2">{error}</p>}

                    {/* Submit */}
                    <div className="auth-form-element-submit mt-4">
                        <button
                            type="submit"
                            className="auth-button-base auth-button-signup-main" // Đảm bảo class này được style đúng
                            disabled={loading}
                        >
                            {loading ? 'Đang đăng ký...' : 'Sign up'}
                        </button>
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="auth-button-base auth-button-off auth-button-off-signup" // Đảm bảo class này được style đúng
                            disabled={loading}
                        >
                            Log In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpForm;