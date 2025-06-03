import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

const Input = ({ value, onChange, placeholder, type = 'text', className, ...rest }) => {
    const [showPassword, setShowPassword] = useState(true);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="relative">
            <input
                type={type === "password" ? (showPassword ? "password" : "text") : type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    if (onChange) onChange(e);
                }}                
                className={className}
                autoComplete={type === "password" ? "current-password" : "on"}
                {...rest}
            />
            {type === "password" && (
                <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                    onClick={toggleShowPassword}
                >
                    {showPassword ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
                </span>
            )}
        </div>
    );
};

export default Input;
