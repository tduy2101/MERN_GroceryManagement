import React from "react";
import "./NotFoundPage.css";

const NotFoundPage = () => {
    return (
        <section className="page_404">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center">
                    <div className="w-full text-center">
                        <div className="four_zero_four_bg">
                            <h1 className="text-8xl text-center">404</h1>
                        </div>

                        <div className="contant_box_404">
                            <h3 className="text-2xl font-bold mt-4">Look like you're lost</h3>
                            <p className="text-gray-600 mt-2">The page you are looking for is not available!</p>
                            <a href="/" className="link_404">Go to Home</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NotFoundPage;
