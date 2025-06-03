import React from 'react'
import Sidebar from '../../components/Admin/Sidebar'
import { Outlet } from 'react-router-dom'

const AdminDashboard = () => {
  return (
    <div className='flex'>
      <Sidebar />

      <div className='flex-1 ml-16 md:ml-64 bg-gray-100 min-h-screen'>
        <Outlet />
      </div>
    </div>
  )
}

export default AdminDashboard
