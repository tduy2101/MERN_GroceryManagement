// src/pages/Dashboard.jsx
import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler
} from "chart.js";
import { API_PATHS, BASE_URL } from "../../utils/apiPath";
import { UserContext } from "../../context/userContext";
import {
  FaUsers, FaBoxOpen, FaTags, FaWarehouse, FaUserShield, FaExclamationTriangle, FaSpinner,
  FaShoppingCart, FaFileInvoiceDollar, FaChartLine, FaPlusCircle
} from "react-icons/fa";
import { Link } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ----- Constants & UI Components -----
const chartColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#ef4444',
  '#22d3ee', '#a3e635', '#fbbf24'
];

const LoadingState = ({ message = "Đang tải dữ liệu..." }) => (
  <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
    <FaSpinner className="animate-spin text-4xl text-primary" />
    <p className="ml-3 text-slate-600">{message}</p>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col justify-center items-center min-h-[calc(100vh-150px)] p-6 text-center bg-red-50 rounded-lg">
    <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
    <h2 className="text-xl font-semibold text-red-700 mb-2">Không thể tải dữ liệu Dashboard</h2>
    <p className="text-red-600">{error}</p>
    <button
      onClick={onRetry}
      className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
    >
      Thử lại
    </button>
  </div>
);

const StatCard = ({ title, value, icon, colorClass = "text-primary", isLoading, unit = "" }) => (
  <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex items-center space-x-4">
    <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-').replace('-500', '-100').replace('-600', '-100')}`}>{React.cloneElement(icon, { className: `w-7 h-7 sm:w-8 sm:h-8 ${colorClass}` })}</div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      {isLoading ? (
        <FaSpinner className="animate-spin text-2xl text-slate-400 mt-1" />
      ) : (
        <p className={`text-2xl sm:text-3xl font-bold ${colorClass}`}>
          {typeof value === 'number' && unit === "₫" ? value.toLocaleString('vi-VN') : value}
          {unit && <span className="text-lg ml-1">{unit}</span>}
        </p>
      )}
    </div>
  </div>
);

const QuickActionButton = ({ to, icon, label }) => (
  <Link
    to={to}
    className={`flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary-dull transition-colors duration-200 font-medium text-sm`}
  >
    {icon}
    {label}
  </Link>
);

// ----- Main Component -----
const Dashboard = () => {
  const { user, loading: userLoading } = useContext(UserContext);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    totalPurchaseOrders: 0,
    totalSalesOrders: 0,
    totalStockValue: 0,
    totalRevenueThisMonth: 0,
    productsData: [],
    salesOrdersData: [],
    purchaseOrdersData: [],
    categoriesData: [],
  });

  const fetchStatsData = useCallback(async () => {
    setIsLoadingStats(true);
    setErrorStats(null);
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
      const [usersRes, productsRes, categoriesRes, suppliersRes, purchaseOrdersRes, salesOrdersRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}${API_PATHS.USERS.GET_ALL_USERS}`, authHeader),
        axios.get(`${BASE_URL}${API_PATHS.PRODUCT.GET_ALL_PRODUCTS}`, authHeader),
        axios.get(`${BASE_URL}${API_PATHS.CATEGORY.GET_ALL_CATEGORIES}`, authHeader),
        axios.get(`${BASE_URL}${API_PATHS.SUPPLIER.GET_ALL_SUPPLIERS}`, authHeader),
        axios.get(`${BASE_URL}${API_PATHS.PURCHASE_ORDER.GET_ALL}`, authHeader),
        axios.get(`${BASE_URL}${API_PATHS.SALES_ORDER.GET_ALL}`, authHeader),
      ]);
      const getData = (res) => (res.status === 'fulfilled' ? (res.value.data?.data || res.value.data || []) : []);
      const users = getData(usersRes);
      const products = getData(productsRes);
      const categories = getData(categoriesRes);
      const suppliers = getData(suppliersRes);
      const purchaseOrders = getData(purchaseOrdersRes);
      const salesOrders = getData(salesOrdersRes);
      const adminCount = users.filter((u) => u.role === "admin").length;
      const totalStockValue = products.reduce((acc, p) => acc + (p.quantityInStock * (p.costPrice || p.lastPurchasePrice || 0)), 0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const totalRevenueThisMonth = salesOrders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((acc, order) => acc + (order.totalAmount || 0), 0);
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: users.length,
        adminUsers: adminCount,
        totalCategories: categories.length,
        categoriesData: categories,
        totalSuppliers: suppliers.length,
        totalPurchaseOrders: purchaseOrders.length,
        totalSalesOrders: salesOrders.length,
        totalStockValue,
        totalRevenueThisMonth,
        productsData: products,
        salesOrdersData: salesOrders,
        purchaseOrdersData: purchaseOrders,
      }));
    } catch (err) {
      console.error("Lỗi không mong muốn khi tải dữ liệu dashboard:", err);
      setErrorStats("Đã có lỗi xảy ra trong quá trình xử lý dữ liệu.");
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchStatsData();
    } else if (!userLoading && !user) {
      setErrorStats("Người dùng chưa được xác thực. Vui lòng đăng nhập.");
      setIsLoadingStats(false);
    }
  }, [userLoading, user, fetchStatsData]);

  // ----- Chart Data & Options -----
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { font: { size: 12 }, color: '#475569', padding: 15 } },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.75)', titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 }, padding: 10, cornerRadius: 6, boxPadding: 3,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: '#e2e8f0' },
      },
      x: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { display: false },
      },
    }
  };

  const getSalesAndPurchasesByDay = (days = 7) => {
    const labels = [];
    const salesData = [];
    const purchaseData = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      labels.push(dateString);
      const dailySales = stats.salesOrdersData
        .filter(order => new Date(order.createdAt).toDateString() === date.toDateString())
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      salesData.push(dailySales);
      const dailyPurchases = stats.purchaseOrdersData
        .filter(order => new Date(order.createdAt).toDateString() === date.toDateString())
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      purchaseData.push(dailyPurchases);
    }
    return { labels, salesData, purchaseData };
  };
  const salesPurchaseTrendData = getSalesAndPurchasesByDay(7);

  const lineChartData = {
    labels: salesPurchaseTrendData.labels,
    datasets: [
      {
        label: 'Doanh Thu Bán Hàng',
        data: salesPurchaseTrendData.salesData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Chi Phí Nhập Hàng',
        data: salesPurchaseTrendData.purchaseData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.3,
        fill: true,
      }
    ]
  };
  const lineChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: { display: true, text: 'Doanh Thu & Chi Phí Nhập (7 Ngày Gần Nhất)', font: { size: 16, weight: '600' }, color: '#1e293b', padding: { top: 10, bottom: 25 } }
    },
    scales: {
      ...commonChartOptions.scales,
      y: {
        ...commonChartOptions.scales.y,
        ticks: {
          ...commonChartOptions.scales.y.ticks,
          callback: function (value) { return value.toLocaleString('vi-VN') + '₫'; }
        }
      }
    }
  };

  const getTopSellingProducts = (topN = 5) => {
    const productSales = {};
    stats.salesOrdersData.forEach(order => {
      order.products.forEach(item => {
        const productId = item.product?._id || item.product;
        const productName = stats.productsData.find(p => p._id === productId)?.name || 'Sản phẩm không xác định';
        if (productName !== 'Sản phẩm không xác định') {
          productSales[productName] = (productSales[productName] || 0) + (item.quantity || 0);
        }
      });
    });
    const sortedProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN);
    return {
      labels: sortedProducts.map(([name]) => name),
      data: sortedProducts.map(([, quantity]) => quantity),
    };
  };
  const topProductsData = getTopSellingProducts(5);

  const topSellingBarData = {
    labels: topProductsData.labels,
    datasets: [{
      label: 'Số lượng đã bán',
      data: topProductsData.data,
      backgroundColor: 'rgba(20, 184, 166, 0.75)',
      borderColor: 'rgb(20, 184, 166)',
      borderWidth: 1,
      borderRadius: 5,
    }]
  };
  const topSellingBarOptions = {
    ...commonChartOptions,
    indexAxis: 'y',
    plugins: {
      ...commonChartOptions.plugins,
      title: { display: true, text: 'Top 5 Sản Phẩm Bán Chạy Nhất', font: { size: 16, weight: '600' }, color: '#1e293b', padding: { top: 10, bottom: 25 } }
    },
    scales: {
      x: { ...commonChartOptions.scales.y, title: { display: true, text: 'Số lượng bán', color: '#475569', font: { size: 12, weight: '500' } } },
      y: { ...commonChartOptions.scales.x },
    }
  };

  const [productCategoryPieData, setProductCategoryPieData] = useState(null);
  useEffect(() => {
    if (stats.productsData.length > 0 && stats.categoriesData.length > 0) {
      const categoryCounts = {};
      stats.productsData.forEach(product => {
        const categoryId = product.category?._id || product.category;
        const categoryName = stats.categoriesData.find(cat => cat._id === categoryId)?.name || 'Chưa phân loại';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });
      setProductCategoryPieData({
        labels: Object.keys(categoryCounts),
        datasets: [{
          label: 'Số lượng sản phẩm',
          data: Object.values(categoryCounts),
          backgroundColor: chartColors,
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 8,
        }]
      });
    } else if (stats.productsData.length > 0 && stats.categoriesData.length === 0) {
      const categoryCounts = { 'Chưa phân loại': stats.productsData.length };
      setProductCategoryPieData({
        labels: Object.keys(categoryCounts),
        datasets: [{
          label: 'Số lượng sản phẩm',
          data: Object.values(categoryCounts),
          backgroundColor: ['#64748b'],
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 8,
        }]
      });
    }
  }, [stats.productsData, stats.categoriesData]);

  const productCategoryPieOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: { display: true, text: 'Phân Bổ Sản Phẩm Theo Danh Mục', font: { size: 16, weight: '600' }, color: '#1e293b', padding: { top: 10, bottom: 25 } }
    }
  };

  if (userLoading) return <LoadingState />;
  if (errorStats && !isLoadingStats) return <ErrorState error={errorStats} onRetry={fetchStatsData} />;

  const totalProducts = stats.productsData?.length || 0;
  const lowStockProductsCount = stats.productsData?.filter(p => p.quantityInStock < (p.lowStockThreshold || 10)).length || 0;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Dashboard Quản Lý Tạp Hóa</h1>
        {user && <p className="text-slate-600 mt-1">Chào mừng trở lại, {user.name || user.email}!</p>}
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 mb-8">
        <StatCard title="Tổng Sản Phẩm" value={totalProducts} icon={<FaBoxOpen />} isLoading={isLoadingStats} colorClass="text-blue-500" />
        <StatCard title="Sản Phẩm Sắp Hết" value={lowStockProductsCount} icon={<FaExclamationTriangle />} isLoading={isLoadingStats} colorClass="text-red-500" />
        <StatCard title="Giá Trị Tồn Kho" value={stats.totalStockValue} unit="₫" icon={<FaWarehouse />} isLoading={isLoadingStats} colorClass="text-amber-500" />
        <StatCard title="Doanh Thu Tháng Này" value={stats.totalRevenueThisMonth} unit="₫" icon={<FaChartLine />} isLoading={isLoadingStats} colorClass="text-green-500" />
        <StatCard title="Tổng Phiếu Nhập" value={stats.totalPurchaseOrders} icon={<FaFileInvoiceDollar style={{ transform: 'rotate(180deg)' }} />} isLoading={isLoadingStats} colorClass="text-indigo-500" />
        <StatCard title="Tổng Đơn Bán" value={stats.totalSalesOrders} icon={<FaShoppingCart />} isLoading={isLoadingStats} colorClass="text-pink-500" />
        <StatCard title="Danh Mục" value={stats.totalCategories} icon={<FaTags />} isLoading={isLoadingStats} colorClass="text-teal-500" />
        {user?.role === 'admin' && <StatCard title="Tổng Người Dùng" value={stats.totalUsers} icon={<FaUsers />} isLoading={isLoadingStats} />}
      </div>
      {user?.role === 'admin' && (
        <div className="mb-8 p-4 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Lối Tắt Nhanh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionButton to="/admin-system/purchase-orders" icon={<FaPlusCircle />} label="Tạo Phiếu Nhập" />
            <QuickActionButton to="/admin-system/sales-orders" icon={<FaPlusCircle />} label="Tạo Đơn Bán" />
            <QuickActionButton to="/admin-system/products" icon={<FaPlusCircle />} label="Thêm Sản Phẩm" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl min-h-[320px] sm:min-h-[400px]">
          {isLoadingStats ? (
            <div className="flex justify-center items-center h-full"> <FaSpinner className="animate-spin text-3xl text-primary" /> </div>
          ) : stats.salesOrdersData.length > 0 || stats.purchaseOrdersData.length > 0 ? (
            <div className="h-80 sm:h-96">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          ) : <p className="text-center text-slate-500 pt-16">Chưa đủ dữ liệu doanh thu/chi phí.</p>}
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl min-h-[320px] sm:min-h-[400px]">
          {isLoadingStats ? (
            <div className="flex justify-center items-center h-full"> <FaSpinner className="animate-spin text-3xl text-primary" /> </div>
          ) : topProductsData.labels.length > 0 ? (
            <div className="h-80 sm:h-96">
              <Bar data={topSellingBarData} options={topSellingBarOptions} />
            </div>
          ) : <p className="text-center text-slate-500 pt-16">Chưa có dữ liệu sản phẩm bán chạy.</p>}
        </div>
      </div>
      {productCategoryPieData && !isLoadingStats && (
        <div className="grid grid-cols-1">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl min-h-[320px] sm:min-h-[400px]">
            <div className="h-80 sm:h-96">
              <Pie data={productCategoryPieData} options={productCategoryPieOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;