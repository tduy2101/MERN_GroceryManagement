import React, { useContext } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
  Navigate,
  BrowserRouter
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import UserProvider, { UserContext } from './context/userContext';
import { AppContextProvider} from './context/appContext';

// Pages and Components
import AuthPage from './pages/Auth/AuthPage';
import HomePage from './pages/HomePage/HomePage';
import Navbar from './components/HomeComponents/Navbar';
import Footer from './components/HomeComponents/Footer';
import UpdateProfile from './pages/ProfilePage/UpdateProfile';

import ConfirmPasswordChangePage from './pages/ProfilePage/ConfirmPasswordChangePage'

import AdminDashboard from './pages/Admin/AdminDashboard';
import Categories from './components/Admin/Categories';
import Suppliers from './components/Admin/Suppliers';
import Products from './components/Admin/Products';
import Users from './components/Admin/User';
import Dashboard from './components/Admin/Dashboard';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import PurchaseOrders from './components/Admin/PurchaseOrder';
import SalesOrders from './components/Admin/SalesOrder';

import AllProduct from './pages/HomePage/AllProduct';



// --- Protected Route Components ---
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  if (loading) return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  if (loading) return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />; 
  return children;
};

// --- Layout Component ---
const AppLayout = () => {
  return (
    <div className="app min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    
    <BrowserRouter>
      <UserProvider>
        <AppContextProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <Routes>

            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path='/products' element={<AllProduct />} />
              <Route path='/profile' element={<ProtectedRoute> <UpdateProfile /> </ProtectedRoute>} />
              <Route path="/confirm-password-change" element={<ProtectedRoute> <ConfirmPasswordChangePage /> </ProtectedRoute>} />
            </Route>

            {/* Admin Routes */}
            <Route path='/admin-system' element={<AdminRoute> <AdminDashboard/> </AdminRoute>}>
              <Route index element={<Dashboard />}/>
              <Route path="categories" element={<Categories/>}/>
              <Route path="products" element={<Products />}/>
              <Route path="suppliers" element={<Suppliers />}/>
              <Route path="users" element={<Users />}/>

              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="sales-orders" element={<SalesOrders />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<AuthPage initialView="login" />} />
            <Route path="/register" element={<AuthPage initialView="register" />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppContextProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;