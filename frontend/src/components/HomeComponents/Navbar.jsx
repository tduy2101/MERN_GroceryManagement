import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/appContext';

// ----- Constants & UI Components -----
const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/products', label: 'Sản phẩm' },
    { to: 'https://www.facebook.com/duy.hoangthai.351/?locale=vi_VN', label: 'Liên hệ' },
];

const SearchInput = ({ value, onChange, onSearch, className = '', placeholder = 'Tìm kiếm...' }) => (
    <div className={`flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full focus-within:border-primary transition-colors ${className}`}>
        <input
            value={value || ""}
            onChange={onChange}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="py-1.5 w-28 md:w-32 lg:w-40 bg-transparent outline-none placeholder-gray-500 text-sm"
            type="text"
            placeholder={placeholder}
        />
        <img src={assets.search_icon} alt="search" className='w-4 h-4 cursor-pointer opacity-60 hover:opacity-100' onClick={onSearch} />
    </div>
);

const UserMenu = React.forwardRef(({ user, userMenuOpen, onToggle, onMenuClick, onLogout }, ref) => (
    <div className='relative' ref={ref}>
        <button onClick={onToggle} className="flex items-center justify-center rounded-full p-0.5 border-2 border-transparent hover:border-primary focus:border-primary transition-all">
            <img
                src={user?.profileImageUrl || assets.profile_icon}
                className='w-8 h-8 md:w-9 md:h-9 object-cover rounded-full'
                alt="profile"
            />
        </button>
        {userMenuOpen && (
            <ul className='absolute top-full mt-2 right-0 bg-white shadow-xl border border-gray-200 py-2 w-max min-w-[220px] rounded-md text-sm z-50'>
                <li className='p-3 px-4 flex items-center gap-3 border-b border-gray-100'>
                    <img
                        src={user?.profileImageUrl || assets.profile_icon}
                        className='w-10 h-10 opacity-90 rounded-full object-cover'
                        alt="avatar"
                    />
                    <div>
                        <span className="font-semibold block text-gray-800">{user?.name || 'User'}</span>
                        <span className="text-xs text-gray-500">{user?.email}</span>
                    </div>
                </li>
                <li onClick={() => onMenuClick('profile')} className='p-3 px-4 hover:bg-primary/10 cursor-pointer flex items-center gap-3 text-gray-700 hover:text-primary'>
                    <img src={assets.user_information_icon} alt="profile" className="w-5 h-5 opacity-70" />
                    User Information
                </li>
                <li onClick={() => onMenuClick('my_orders')} className='p-3 px-4 hover:bg-primary/10 cursor-pointer flex items-center gap-3 text-gray-700 hover:text-primary'>
                    <img src={assets.nav_cart_icon} alt="orders" className="w-5 h-5 opacity-70" />
                    My Orders
                </li>
                {user?.role === 'admin' && (
                    <>
                        <hr className="my-1 border-gray-100" />
                        <li onClick={() => onMenuClick('admin_system')} className='p-3 px-4 hover:bg-primary/10 cursor-pointer flex items-center gap-3 text-gray-700 hover:text-primary font-medium'>
                            <img src={assets.management_icon} alt="admin" className="w-5 h-5 opacity-70" />
                            System Management
                        </li>
                    </>
                )}
                <hr className="my-1 border-gray-100" />
                <li onClick={onLogout} className='p-3 px-4 hover:bg-red-500/10 text-red-600 cursor-pointer flex items-center gap-3'>
                    <img src={assets.logout_icon} alt="logout" className="w-5 h-5 opacity-70" />
                    Logout
                </li>
            </ul>
        )}
    </div>
));

const MobileMenu = ({ open, onClose, onLogin, searchQuery, onSearchChange, onSearch, user, onUserMenuClick }) => (
    open ? (
        <div className={`absolute top-full left-0 w-full bg-white shadow-lg py-3 flex flex-col items-start gap-0.5 px-4 text-base sm:hidden z-40 border-t border-gray-200`}>
            {navLinks.map(link => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) => `w-full py-2.5 px-3 rounded ${isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-gray-100"}`}
                >{link.label}</NavLink>
            ))}
            <div className="w-full my-2 px-3">
                <SearchInput value={searchQuery} onChange={onSearchChange} onSearch={onSearch} placeholder="Tìm kiếm sản phẩm..." className="" />
            </div>
            <div className="mt-3 w-full px-3">
                <button
                    onClick={onLogin}
                    className="w-full text-center cursor-pointer px-6 py-2.5 bg-primary hover:bg-primary-dull transition text-white rounded-md text-base font-medium"
                >
                    Đăng nhập / Đăng ký
                </button>
            </div>
        </div>
    ) : null
);

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const localNavigate = useNavigate();
    const userMenuRef = useRef(null);
    const {
        user,
        logoutUser,
        searchQuery,
        setSearchQuery,
        totalCartItemCount
    } = useAppContext();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = useCallback(() => {
        if (searchQuery && searchQuery.trim() !== "") {
            localNavigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    }, [searchQuery, localNavigate]);

    const handleLoginClick = useCallback(() => {
        setMobileMenuOpen(false);
        localNavigate('/login');
    }, [localNavigate]);

    const handleUserMenuToggle = useCallback(() => {
        setUserMenuOpen(prev => !prev);
    }, []);

    const handleUserMenuClick = useCallback((type) => {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        if (type === 'profile') {
            localNavigate('/profile');
        } else if (type === 'admin_system') {
            localNavigate('/admin-system');
        } else if (type === 'my_orders') {
            localNavigate('/my-orders');
        }
    }, [localNavigate]);

    const handleLogout = useCallback(() => {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        logoutUser();
    }, [logoutUser]);

    const handleMobileMenuToggle = useCallback(() => {
        setMobileMenuOpen(o => !o);
    }, []);

    const handleMobileMenuClose = useCallback(() => {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
    }, []);

    const handleSearchChange = useCallback((e) => setSearchQuery && setSearchQuery(e.target.value), [setSearchQuery]);

    return (
        <nav className="flex items-center justify-between px-4 sm:px-6 md:px-16 lg:px-24 xl:px-32 py-3 md:py-4 border-b border-gray-200 bg-white relative top-0 left-0 right-0 z-50 transition-all">
            <NavLink
                to="/"
                onClick={handleMobileMenuClose}
                className="text-center font-bold uppercase bg-gradient-to-r from-cyan-400 flex-shrink-0 to-blue-500 text-transparent bg-clip-text text-[22px] sm:text-[28px]"
            >
                DGang Store 🛒
            </NavLink>
            <div className="hidden sm:block flex-grow"></div>
            <div className="hidden sm:flex items-center gap-5 md:gap-7 lg:gap-8">
                {navLinks.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => isActive ? "text-primary font-semibold" : "text-gray-600 hover:text-primary transition-colors"}
                    >{link.label}</NavLink>
                ))}
            </div>
            <div className="flex items-center gap-2 md:gap-4 lg:gap-5 ml-0 sm:ml-6 md:ml-8">
                <div className="hidden md:flex">
                    <SearchInput value={searchQuery} onChange={handleSearchChange} onSearch={handleSearch} />
                </div>
                <div onClick={() => localNavigate("/cart")} className="relative cursor-pointer p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <img src={assets.nav_cart_icon} alt="cart" className='w-5 h-5 md:w-6 md:h-6 opacity-80' />
                    {(totalCartItemCount || 0) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 text-xs text-white bg-primary w-4 h-4 md:w-[18px] md:h-[18px] rounded-full flex items-center justify-center font-bold">
                            {totalCartItemCount}
                        </span>
                    )}
                </div>
                {!user ? (
                    <button
                        onClick={handleLoginClick}
                        className="hidden sm:block px-4 py-1.5 md:px-5 md:py-2 bg-gradient-to-r from-primary-dull flex-shrink-0 to-primary transition text-white rounded-full text-xs md:text-sm font-medium cursor-pointer"
                    >
                        Đăng nhập
                    </button>
                ) : (
                    <UserMenu
                        ref={userMenuRef}
                        user={user}
                        userMenuOpen={userMenuOpen}
                        onToggle={handleUserMenuToggle}
                        onMenuClick={handleUserMenuClick}
                        onLogout={handleLogout}
                    />
                )}
                <button onClick={handleMobileMenuToggle} aria-label="Menu" className="sm:hidden p-1.5 rounded-full hover:bg-gray-100">
                    <img src={mobileMenuOpen ? assets.menu_icon : assets.menu_icon} alt="menu" className="w-6 h-6" />
                </button>
            </div>
            <MobileMenu
                open={mobileMenuOpen}
                onClose={handleMobileMenuClose}
                onLogin={handleLoginClick}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearch={handleSearch}
                user={user}
                onUserMenuClick={handleUserMenuClick}
            />
        </nav>
    );
};

export default Navbar;