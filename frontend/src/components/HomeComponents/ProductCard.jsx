import React from "react";
import { useAppContext } from "../../context/appContext";
import { assets } from "../../assets/assets";

const ProductCard = ({ product }) => {
    const {
        currency,
        cartItems,
        navigate,
        addToCart, // Lấy hàm từ context
        updateCartItemQuantity // Lấy hàm từ context
    } = useAppContext();

    // Kiểm tra nếu product hoặc product.category không tồn tại để tránh lỗi
    // Điều này quan trọng nếu backend chưa populate category
    if (!product) {
        return null; // Hoặc một UI placeholder/loading
    }

    const itemInCartQuantity = cartItems[product._id] || 0;

    const handleCardClick = () => {
        // Đảm bảo product.category và product.category.name tồn tại
        const categoryName = product.category && product.category.name
            ? product.category.name.toLowerCase()
            : 'unknown-category'; // Giá trị mặc định nếu không có category name
        navigate(`/products/${categoryName}/${product._id}`);
        window.scrollTo(0, 0); // Dùng window.scrollTo
    };

    // Ngăn sự kiện click lan ra thẻ div cha khi click nút trong card
    const handleAddToCartClick = (e) => {
        e.stopPropagation();
        addToCart(product._id, 1);
    };

    const handleIncreaseQuantityClick = (e) => {
        e.stopPropagation();
        updateCartItemQuantity(product._id, itemInCartQuantity + 1);
    };

    const handleDecreaseQuantityClick = (e) => {
        e.stopPropagation();
        updateCartItemQuantity(product._id, itemInCartQuantity - 1);
    };

    return (
        <div
            onClick={handleCardClick}
            className="border border-gray-500/20 rounded-md md:px-4 px-3 py-2 bg-white min-w-56 max-w-56 w-full flex flex-col cursor-pointer" // Thêm flex flex-col
        >
            <div className="group flex items-center justify-center px-2 h-36 md:h-48 flex-grow"> {/* Giới hạn chiều cao và flex-grow */}
                <img
                    className="group-hover:scale-105 transition max-h-full max-w-full object-contain" // Đảm bảo ảnh vừa vặn
                    src={product.imageUrl || assets.default_product_image}
                    alt={product.name}
                />
            </div>
            <div className="text-gray-500/60 text-sm mt-2">
                {/* Hiển thị tên category - quan trọng là product.category phải là object */}
                <p>{product.category ? product.category.name : 'N/A'}</p>
                <p className="text-gray-700 font-medium text-lg truncate w-full h-6"> {/* Giới hạn chiều cao cho tên SP */}
                    {product.name}
                </p>
                <div className="flex items-center gap-0.5 my-1"> {/* Thêm margin y */}
                    {Array(5).fill('').map((_, i) => (
                        <img key={i} className="md:w-3.5 w-3" src={i < (product.rating || 4) ? assets.star_icon : assets.star_dull_icon} alt="" />
                    ))}
                    {/* Bạn có thể muốn hiển thị product.rating thực tế thay vì (4) */}
                    <p>({product.ratingCount || 0})</p>
                </div>
                <div className="flex items-end justify-between mt-3">
                    <p className="md:text-xl text-base font-medium text-indigo-500">
                        {currency}{product.sellingPrice.toFixed(2)}{" "}
                        {product.costPrice > product.sellingPrice && ( // Chỉ hiện giá gốc nếu có giảm giá
                            <span className="text-gray-500/60 md:text-sm text-xs line-through">
                                {currency}{product.costPrice.toFixed(2)}
                            </span>
                        )}
                    </p>
                    <div className="text-indigo-500">
                        {itemInCartQuantity === 0 ? (
                            <button
                                className="flex items-center justify-center gap-1 bg-indigo-100 border border-indigo-300 md:w-[80px] w-[64px] h-[34px] rounded text-indigo-600 font-medium hover:bg-indigo-200 transition-colors"
                                onClick={handleAddToCartClick}
                            >
                                <img src={assets.cart_icon} alt="" className="w-4 h-4" />
                                Add
                            </button>
                        ) : (
                            <div className="flex items-center justify-center gap-1 md:gap-2 md:w-20 w-16 h-[34px] bg-indigo-500/10 border border-indigo-300 rounded select-none">
                                <button
                                    onClick={handleDecreaseQuantityClick}
                                    className="cursor-pointer text-lg px-2 h-full text-indigo-600 hover:bg-indigo-200 rounded-l"
                                >
                                    -
                                </button>
                                <span className="w-5 text-center text-indigo-700 font-medium">{itemInCartQuantity}</span>
                                <button
                                    onClick={handleIncreaseQuantityClick}
                                    className="cursor-pointer text-lg px-2 h-full text-indigo-600 hover:bg-indigo-200 rounded-r"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;