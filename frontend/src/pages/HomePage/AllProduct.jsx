import React, { useState, useEffect } from 'react'
import { useAppContext } from '../../context/appContext';
import ProductCard from '../../components/HomeComponents/ProductCard';

const AllProduct = () => {
    const { products, searchQuery } = useAppContext();
    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {
        if (searchQuery.length > 0) {
            setFilteredProducts(products.filter(
                product => product.name.toLowerCase().includes(searchQuery.toLowerCase())
            ));
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    return (
        <div className='mt-20 px-4 md:px-8'>
            {/* Header */}
            <div className='mb-6'>
                <h2 className='text-3xl font-bold text-gray-800 uppercase tracking-wide'>
                    All Products
                </h2>
                <div className='w-20 h-1 bg-primary mt-2 rounded-full'></div>
            </div>

            {/* Product grid */}
            {filteredProducts.filter(p => p.quantityInStock > 0).length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6'>
                    {filteredProducts
                        .filter(product => product.quantityInStock > 0)
                        .map((product, index) => (
                            <div key={index} className='hover:scale-105 transition-transform duration-300'>
                                <ProductCard product={product} />
                            </div>
                        ))}
                </div>
            ) : (
                <div className='text-center text-gray-500 mt-10 text-lg'>
                    No products found.
                </div>
            )}
        </div>
    );
}

export default AllProduct;
