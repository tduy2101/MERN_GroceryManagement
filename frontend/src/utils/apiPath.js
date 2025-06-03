export const BASE_URL = 'http://localhost:5000';

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        GET_PROFILE: "/api/auth/profile-user",
        UPDATE_PROFILE: `/api/auth/profile-user/update`,
        UPLOAD_IMAGE: '/auth/upload-image',
        REQUEST_PASSWORD_CHANGE: '/api/auth/request-password-change',
        CONFIRM_PASSWORD_CHANGE: '/api/auth/confirm-password-change',
    },

    USERS: {
        GET_ALL_USERS: '/api/users/get', 
        CREATE_USER: '/api/users/add', 
        UPDATE_USER: (userId) => `/api/users/update/${userId}`, 
        DELETE_USER: (userId) => `/api/users/delete/${userId}`, 
    },

    PRODUCT: {
        GET_ALL_PRODUCTS: '/api/product/get',             
        CREATE_PRODUCT: '/api/product/add',                  
        GET_PRODUCT_BY_ID: (id) => `/api/product/${id}`,
        UPDATE_PRODUCT: (id) => `/api/product/${id}`,
        DELETE_PRODUCT: (id) => `/api/product/${id}`,
        GET_PRODUCTS_BY_CATEGORY: (categoryId) => `/api/product/category/${categoryId}`,
        SEARCH_PRODUCTS: (key) => `/api/product/search/${key}`,
    },

    CATEGORY: {
        GET_ALL_CATEGORIES: "/api/category/get",
        CREATE_CATEGORY: "/api/category/add",
        UPDATE_CATEGORY: (categoryId) => `/api/category/${categoryId}`,
        DELETE_CATEGORY: (categoryId) => `/api/category/${categoryId}`,
    },

    SUPPLIER: {
        GET_ALL_SUPPLIERS: "/api/supplier/get",
        GET_SUPPLIER_BY_ID: (supplierId) => `/api/supplier/get/${supplierId}`,
        CREATE_SUPPLIER: "/api/supplier/add",
        UPDATE_SUPPLIER: (supplierId) => `/api/supplier/${supplierId}`,
        DELETE_SUPPLIER: (supplierId) => `/api/supplier/${supplierId}`,
    },

    PURCHASE_ORDER: {
        GET_ALL: '/api/purchase-orders',         
        GET_BY_ID: (id) => `/api/purchase-orders/${id}`, 
        CREATE: '/api/purchase-orders',          
        UPDATE: (id) => `/api/purchase-orders/${id}`,  
        DELETE: (id) => `/api/purchase-orders/${id}`,  
    },

    SALES_ORDER: {
        GET_ALL: '/api/sales-orders',        
        GET_BY_ID: (id) => `/api/sales-orders/${id}`, 
        CREATE: '/api/sales-orders',          
        UPDATE: (id) => `/api/sales-orders/${id}`, 
        DELETE: (id) => `/api/sales-orders/${id}`, 
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image",
    },
}