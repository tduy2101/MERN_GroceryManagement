import React from 'react'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'

const MainBanner = () => {
    return (
        <div className='relative'>
            <img src={assets.main_banner_bg} alt="banner" className='w-full hidden md:block rounded-2xl' />
            <img src={assets.main_banner_bg} alt="banner" className='w-full md:hidden rounded-2xl' />
            
            <div className='absolute inset-0 flex flex-col items-center md:items-start justify-end md:justify-center pb-24 md:pb-0 px-4 md:pl-18 lg:pl-24'>
                <h1 className='text-3x1 md:text-4xl lg:text-5xl font-bold text-center md:text-left max-w-72 md:max-w-80 lg:max-w-105 leading-tight lg:leading-15'>
                    The Best Grocery Store You Ever Seen!</h1>

                <div className='flex items-center mt-6 font-medium'>
                    <Link to={"/products"} className='group flex items-center gap-2 bg-gradient-to-r from-primary-dull flex-shrink-0 to-primary px-7 py-3 md:px-9 rounded hover:bg-primary transition text-white cursor-pointer'>
                        Shop now
                        <img className='md:hidden transition group-focus:translate-x-1' src={assets.white_arrow_icon} alt="arrow" />
                    </Link>

                    <Link to={"/products"} className='group items-center hidden gap-2 px-9 py-3 md:flex cursor-pointer'>
                        Explore deals
                        <img className='transition group-hover:translate-x-1' src={assets.black_arrow_icon} alt="arrow" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default MainBanner