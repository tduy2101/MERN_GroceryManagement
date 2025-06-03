import React from 'react'
import MainBanner from '../../components/HomeComponents/MainBanner'
import AllProduct from './AllProduct'

const HomePage = () => {
  return (
    <>
      <div className='px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-40 mt-10'>
        <MainBanner />
        <AllProduct />
      </div>
    </>
  )
}


export default HomePage

