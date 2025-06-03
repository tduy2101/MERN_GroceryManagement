import { FaBox, FaCog, FaHome, FaSignOutAlt, FaTable, FaTruck, FaUsers, FaShoppingCart} from 'react-icons/fa'; // Thêm FaThLarge cho logo
import { NavLink, useLocation } from 'react-router-dom'; // Thêm useLocation

const Sidebar = () => {
    const location = useLocation(); // Để kiểm tra path chính xác hơn cho active state

    const menuItems = [
        { name: "Dashboard", path: "/admin-system", icon: <FaHome size={20} />, exact: true }, // Thêm exact cho Dashboard
        { name: "Categories", path: "/admin-system/categories", icon: <FaTable size={20} /> },
        { name: "Products", path: "/admin-system/products", icon: <FaBox size={20} /> },
        { name: "Suppliers", path: "/admin-system/suppliers", icon: <FaTruck size={20} /> },
        { name: "Users", path: "/admin-system/users", icon: <FaUsers size={20} /> },

        { name: "PurchaseOrders", path: "/admin-system/purchase-orders", icon: <FaTruck size={20} /> },
        { name: "SalesOrders", path: "/admin-system/sales-orders", icon: <FaShoppingCart size={20} /> },

        { name: "Profile", path: "/profile", icon: <FaCog size={20} />, isExternal: true }, 
        { name: "Back to Site", path: "/", icon: <FaSignOutAlt size={20} /> }, 
    ];

    const primaryColor = "bg-primary-dull"; 
    const primaryDullColor = "bg-primary"; 
    const textColor = "text-slate-100";
    const hoverTextColor = "text-white";
    const activeTextColor = "text-white";
    const iconColor = "text-slate-300";
    const activeIconColor = "text-white"; 

    return (
        <div className={`flex flex-col h-screen ${primaryColor} ${textColor} w-16 md:w-64 fixed top-0 left-0 shadow-2xl transition-all duration-300 ease-in-out z-50 rounded-r-xl`}>
            {/* Logo Section */}
            <div className='h-20 flex items-center justify-center border-b border-slate-700 px-2'>
                <NavLink to="/admin-system" className="flex items-center gap-2" title="Inventory Management System">
                    <FaShoppingCart icon="fa-solid fa-cart-shopping" className={`text-3xl md:text-3xl ${activeIconColor}`}/>
                    <span className={`hidden md:block text-xl font-bold ${hoverTextColor} whitespace-nowrap`}>
                        DGang Admin
                    </span>
                </NavLink>
            </div>

            {/* Menu Items */}
            <nav className='flex-grow pt-4 pb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800'> {/* Thêm scrollbar tùy chỉnh */}
                <ul className='space-y-1 px-2'>
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                end={item.exact} // Sử dụng 'end' prop cho NavLink v6+ thay vì 'exact'
                                target={item.isExternal ? "_blank" : ""} // Mở tab mới cho link ngoài
                                rel={item.isExternal ? "noopener noreferrer" : ""}
                                className={({ isActive }) =>
                                    `flex items-center py-2.5 px-3 rounded-lg transition-all duration-200 group
                                    ${isActive
                                        ? `${primaryDullColor} ${activeTextColor} shadow-inner`
                                        : `${textColor} hover:${primaryDullColor} hover:${hoverTextColor}`
                                    }`
                                }
                            >
                                <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center 
                                    ${location.pathname === item.path || (item.exact && location.pathname === item.path) || (!item.exact && location.pathname.startsWith(item.path) && item.path !== "/admin-system")
                                        ? activeIconColor
                                        : `${iconColor} group-hover:${activeIconColor}`
                                    }`}
                                >
                                    {item.icon}
                                </span>
                                <span className={`ml-3 hidden md:block text-sm font-medium whitespace-nowrap`}>
                                    {item.name}
                                </span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            
            <div className="mt-auto p-2 border-t border-primary">
                <NavLink
                    to="/profile" // Hoặc path tới logout
                    target="_blank"
                    className={({ isActive }) =>
                        `flex items-center py-2.5 px-3 rounded-lg transition-colors duration-200 group
                        ${ isActive
                            ? `${primaryDullColor} ${activeTextColor}`
                            : `${textColor} hover:${primaryDullColor} hover:${hoverTextColor}`
                        }`           
                    }
                >
                     <FaCog className={`flex-shrink-0 w-6 h-6 ${iconColor} group-hover:${activeIconColor}`} />
                    <span className="ml-3 hidden md:block text-sm font-medium">Settings</span>
                </NavLink>
            </div>
        </div>
    )
}

export default Sidebar;