import { createContext, useContext, useCallback, useState, useEffect, useMemo } from "react"; // Thêm useMemo
import { useNavigate } from "react-router-dom";
import { UserContext } from "./userContext";
import toast from 'react-hot-toast';
import { API_PATHS, BASE_URL } from "../utils/apiPath";
import axios from "axios";

const initialAppContextState = {
    navigate: () => console.warn("navigate called before AppProvider was ready"),
    user: null,
    userLoading: false,
    logoutUser: () => console.warn("logoutUser called before AppProvider was ready"),
    searchQuery: "",
    setSearchQuery: () => { },
    products: [],
    currency: '$', // Giữ lại currency
    // Cart related
    cartItems: {}, // { productId: quantity }
    addToCart: () => console.warn("addToCart called before AppProvider was ready"),
    removeFromCart: () => console.warn("removeFromCart called before AppProvider was ready"),
    updateCartItemQuantity: () => console.warn("updateCartItemQuantity called before AppProvider was ready"),
    clearCart: () => console.warn("clearCart called before AppProvider was ready"),
    getCartTotalQuantity: () => 0,
    getCartTotalPrice: () => 0,
};

export const AppContext = createContext(initialAppContextState);

export const AppContextProvider = ({ children }) => {
    const navigate = useNavigate();
    const userContextValue = useContext(UserContext);
    const {
        user = null,
        loading: userLoading = false,
        clearUser: clearUserFromUserContext = () => { }
    } = userContextValue || {};

    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState([]);
    const currency = '$'; // Bạn có thể lấy từ config hoặc để cố định

    // --- CART STATE AND LOGIC ---
    const [cartItems, setCartItems] = useState(() => {
        // Load cart từ localStorage nếu có
        try {
            const localCart = localStorage.getItem('cartItems');
            return localCart ? JSON.parse(localCart) : {};
        } catch (error) {
            console.error("Error parsing cartItems from localStorage", error);
            return {};
        }
    });

    useEffect(() => {
        // Lưu cart vào localStorage mỗi khi nó thay đổi
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = useCallback((productId, quantity = 1) => {
        // Tìm sản phẩm trong danh sách products để đảm bảo nó tồn tại
        const productToAdd = products.find(p => p._id === productId);
        if (!productToAdd) {
            toast.error("Sản phẩm không tồn tại!");
            return;
        }

        setCartItems(prevItems => {
            const existingQuantity = prevItems[productId] || 0;
            // Kiểm tra số lượng tồn kho (nếu cần thiết ngay lúc thêm)
            // if (existingQuantity + quantity > productToAdd.quantityInStock) {
            //     toast.error(`Chỉ còn ${productToAdd.quantityInStock - existingQuantity} sản phẩm ${productToAdd.name} trong kho.`);
            //     return prevItems;
            // }
            toast.success(`${productToAdd.name} đã được thêm vào giỏ!`);
            return {
                ...prevItems,
                [productId]: existingQuantity + quantity
            };
        });
    }, [products]); // Thêm products vào dependency nếu bạn có check quantityInStock ở đây

    const removeFromCart = useCallback((productId) => {
        setCartItems(prevItems => {
            const { [productId]: _, ...rest } = prevItems;
            const removedProduct = products.find(p => p._id === productId);
            if (removedProduct) {
                toast.success(`${removedProduct.name} đã được xóa khỏi giỏ.`);
            }
            return rest;
        });
    }, [products]);

    const updateCartItemQuantity = useCallback((productId, newQuantity) => {
        const productToUpdate = products.find(p => p._id === productId);
        if (!productToUpdate) return; // Sản phẩm không tồn tại

        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            // Kiểm tra số lượng tồn kho
            // if (newQuantity > productToUpdate.quantityInStock) {
            //     toast.error(`Số lượng ${productToUpdate.name} vượt quá tồn kho (${productToUpdate.quantityInStock}).`);
            //     setCartItems(prevItems => ({
            //         ...prevItems,
            //         [productId]: productToUpdate.quantityInStock // Giới hạn bằng tồn kho
            //     }));
            //     return;
            // }
            setCartItems(prevItems => ({
                ...prevItems,
                [productId]: newQuantity
            }));
        }
    }, [removeFromCart, products]); // Thêm products vào dependency

    const clearCart = useCallback(() => {
        setCartItems({});
        toast.success("Giỏ hàng đã được xóa.");
    }, []);

    const getCartTotalQuantity = useMemo(() => {
        return Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
    }, [cartItems]);

    const getCartTotalPrice = useMemo(() => {
        return Object.entries(cartItems).reduce((total, [productId, quantity]) => {
            const product = products.find(p => p._id === productId);
            if (product) {
                return total + (product.sellingPrice * quantity);
            }
            return total;
        }, 0);
    }, [cartItems, products]);
    // --- END CART LOGIC ---


    const fetchProducts = useCallback(async () => {
        try {
            const endpoint = `${BASE_URL}${API_PATHS.PRODUCT.GET_ALL_PRODUCTS}`;
            const response = await axios.get(endpoint, {
                // Bỏ Authorization header nếu API get all products không yêu cầu
                // headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
            });
            // Giả sử backend trả về: { success: true, data: [products...] }
            // Hoặc chỉ là [products...]
            const data = response.data?.data || response.data;

            if (Array.isArray(data)) {
                setProducts(data);
                // console.log("Fetched products:", data); // Kiểm tra dữ liệu category
            } else {
                console.warn("Cấu trúc dữ liệu không mong muốn từ endpoint sản phẩm:", response.data);
                toast.error("Nhận được định dạng dữ liệu không mong muốn cho sản phẩm.");
                setProducts([]);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách sản phẩm:", err);
            toast.error(err.response?.data?.message || "Không thể tải danh sách sản phẩm.");
            setProducts([]);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // Thêm fetchProducts vào dependency


    const logoutUser = useCallback(() => {
        if (typeof clearUserFromUserContext === 'function') {
            clearUserFromUserContext();
        }
        localStorage.removeItem('cartItems'); // Xóa giỏ hàng khi logout
        setCartItems({});
        toast.success("Đăng xuất thành công!");
        navigate('/');
    }, [navigate, clearUserFromUserContext]);

    const contextValue = {
        navigate,
        user,
        userLoading,
        logoutUser,
        searchQuery,
        setSearchQuery,
        products,
        currency, // Thêm currency vào context value
        // Cart
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        getCartTotalQuantity,
        getCartTotalPrice,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) { // Kiểm tra context có tồn tại không
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};