// src/pages/Auth/AuthPage.jsx 
import React, { useState, useEffect, useRef } from 'react';
import paper from 'paper';
import './AuthPage.css';
import SignInForm from '../../components/Auth/SignInForm'; // Điều chỉnh đường dẫn nếu cần
import SignUpForm from '../../components/Auth/SignUpForm'; // Điều chỉnh đường dẫn nếu cần
import { useNavigate, useLocation } from 'react-router-dom'; // Thêm useLocation và useNavigate

// Thêm prop initialView, với giá trị mặc định là 'login'
const AuthPage = ({ initialView = 'login' }) => {
    // Khởi tạo isLoginView dựa trên initialView prop
    const [isLoginView, setIsLoginView] = useState(initialView === 'login');
    const canvasRef = useRef(null);
    const paperScopeRef = useRef(null);

    const [slideBoxMarginLeft, setSlideBoxMarginLeft] = useState('');
    const [topLayerMarginLeft, setTopLayerMarginLeft] = useState('');

    const [signUpFormKey, setSignUpFormKey] = useState(`signup-initial-key-${initialView}`);
    const [signInFormKey, setSignInFormKey] = useState(`signin-initial-key-${initialView}`);

    const navigate = useNavigate();
    const location = useLocation();

    // CẬP NHẬT: Đồng bộ isLoginView với URL khi URL thay đổi (ví dụ: nút back/forward trình duyệt)
    useEffect(() => {
        if (location.pathname === '/login' || location.pathname === '/auth/login') {
            if (!isLoginView) setIsLoginView(true);
        } else if (location.pathname === '/register' || location.pathname === '/auth/register' || location.pathname === '/signup' || location.pathname === '/auth/signup') {
            if (isLoginView) setIsLoginView(false);
        }
    }, [location.pathname, isLoginView]); // Chỉ chạy khi pathname thay đổi


    const switchToSignUp = () => {
        setSignInFormKey(`signin-key-${Date.now()}`);
        if (location.pathname !== '/register' && location.pathname !== '/auth/register' && location.pathname !== '/signup' && location.pathname !== '/auth/signup') {
            navigate('/register'); 
        } else {
            // Nếu đã ở đúng URL, chỉ cần đảm bảo isLoginView là false
            if (isLoginView) setIsLoginView(false);
        }
    };

    const switchToLogin = () => {
        // setIsLoginView(true); // Sẽ được xử lý bởi useEffect ở trên khi navigate
        setSignUpFormKey(`signup-key-${Date.now()}`);
        if (location.pathname !== '/login' && location.pathname !== '/auth/login') {
            navigate('/login');
        } else {
            // Nếu đã ở đúng URL, chỉ cần đảm bảo isLoginView là true
            if (!isLoginView) setIsLoginView(true);
        }
    };


    // useEffect cho isLoginView (để cập nhật style trượt)
    useEffect(() => {
        const updateSlideStyles = () => {
            const isMobile = window.innerWidth <= 768;
            let newSlideBoxMargin, newTopLayerMargin;
            if (isLoginView) {
                newSlideBoxMargin = isMobile ? '50%' : '50%';
                newTopLayerMargin = '-100%';
            } else {
                newSlideBoxMargin = '0%';
                newTopLayerMargin = '0%';
            }
            setSlideBoxMarginLeft(newSlideBoxMargin);
            setTopLayerMarginLeft(newTopLayerMargin);
        };
        updateSlideStyles(); // Chạy lần đầu
        window.addEventListener('resize', updateSlideStyles);
        return () => window.removeEventListener('resize', updateSlideStyles);
    }, [isLoginView]); // Phụ thuộc vào isLoginView

    // useEffect cho Paper.js
    useEffect(() => {
        if (!canvasRef.current) {
            console.error("AuthPage: Canvas ref is not available yet.");
            return;
        }
        let activePaperScope;
        if (!paperScopeRef.current) {
            activePaperScope = new paper.PaperScope();
            activePaperScope.setup(canvasRef.current);
            paperScopeRef.current = activePaperScope;
        } else {
            activePaperScope = paperScopeRef.current;
            if (!activePaperScope.view || activePaperScope.canvas !== canvasRef.current) {
                if (activePaperScope.view) activePaperScope.view.remove();
                activePaperScope.setup(canvasRef.current);
            }
            activePaperScope.activate();
        }
        if (!activePaperScope || !activePaperScope.settings) {
            console.error("AuthPage: CRITICAL - activePaperScope is not a valid PaperScope object!");
            return;
        }
        const currentPaper = activePaperScope;
        if (!currentPaper.view) {
            console.error("AuthPage: Paper.js view is NOT available on currentPaper after setup/activation.");
            return;
        }

        let canvasWidth, canvasHeight, canvasMiddleX, canvasMiddleY;
        const shapeGroup = new currentPaper.Group();
        let positionArray = [];
        const shapePathData = [
            'M231,352l445-156L600,0L452,54L331,3L0,48L231,352',
            'M0,0l64,219L29,343l535,30L478,37l-133,4L0,0z',
            'M0,65l16,138l96,107l270-2L470,0L337,4L0,65z',
            'M333,0L0,94l64,219L29,437l570-151l-196-42L333,0',
            'M331.9,3.6l-331,45l231,304l445-156l-76-196l-148,54L331.9,3.6z',
            'M389,352l92-113l195-43l0,0l0,0L445,48l-80,1L122.7,0L0,275.2L162,297L389,352',
            'M 50 100 L 300 150 L 550 50 L 750 300 L 500 250 L 300 450 L 50 100',
            'M 700 350 L 500 350 L 700 500 L 400 400 L 200 450 L 250 350 L 100 300 L 150 50 L 350 100 L 250 150 L 450 150 L 400 50 L 550 150 L 350 250 L 650 150 L 650 50 L 700 150 L 600 250 L 750 250 L 650 300 L 700 350 '
        ];
        function getCanvasBounds() {
            if (!currentPaper.view || !currentPaper.view.bounds) return false;
            canvasWidth = currentPaper.view.size.width;
            canvasHeight = currentPaper.view.size.height;
            canvasMiddleX = canvasWidth / 2;
            canvasMiddleY = canvasHeight / 2;
            const position1 = { x: (canvasMiddleX / 2) + 100, y: 100 };
            const position2 = { x: 200, y: canvasMiddleY };
            const position3 = { x: (canvasMiddleX - 50) + (canvasMiddleX / 2), y: 150 };
            const position4 = { x: 0, y: canvasMiddleY + 100 };
            const position5 = { x: canvasWidth - 130, y: canvasHeight - 75 };
            const position6 = { x: canvasMiddleX + 80, y: canvasHeight - 50 };
            const position7 = { x: canvasWidth + 60, y: canvasMiddleY - 50 };
            const position8 = { x: canvasMiddleX + 100, y: canvasMiddleY + 100 };
            positionArray = [position3, position2, position5, position4, position1, position6, position7, position8];
            return true;
        }
        function initializeShapes() {
            if (!getCanvasBounds()) return;
            shapeGroup.removeChildren();
            for (let i = 0; i < shapePathData.length; i++) {
                if (positionArray[i] && shapePathData[i] && typeof positionArray[i].x === 'number') {
                    const headerShape = new currentPaper.Path({
                        strokeColor: 'rgba(255, 255, 255, 0.5)',
                        strokeWidth: 2,
                        parent: shapeGroup,
                    });
                    headerShape.pathData = shapePathData[i];
                    headerShape.scale(2);
                    headerShape.position = new currentPaper.Point(positionArray[i].x, positionArray[i].y);
                }
            }
        }
        const paperOnFrame = (event) => {
            if (!currentPaper.project || !currentPaper.project.activeLayer || shapeGroup.children.length === 0) return;
            if (event.count % 4 === 0) {
                for (let i = 0; i < shapeGroup.children.length; i++) {
                    if (shapeGroup.children[i]) {
                        if (i % 2 === 0) shapeGroup.children[i].rotate(-0.1);
                        else shapeGroup.children[i].rotate(0.1);
                    }
                }
            }
        };
        const paperOnResize = () => {
            if (!currentPaper.view) return;
            if (!getCanvasBounds()) return;
            for (let i = 0; i < shapeGroup.children.length; i++) {
                if (shapeGroup.children[i] && positionArray[i] && typeof positionArray[i].x === 'number') {
                    shapeGroup.children[i].position = new currentPaper.Point(positionArray[i].x, positionArray[i].y);
                }
            }
            const isSmallScreen = currentPaper.view.size.width < 700;
            const childrenIndicesToToggle = [2, 3, 5];
            childrenIndicesToToggle.forEach(index => {
                if (shapeGroup.children[index]) {
                    shapeGroup.children[index].opacity = isSmallScreen ? 0 : 1;
                }
            });
        };
        currentPaper.view.onFrame = paperOnFrame;
        currentPaper.view.onResize = paperOnResize;
        initializeShapes();
        paperOnResize();
        return () => {
            const scopeToClean = paperScopeRef.current;
            if (scopeToClean) {
                if (scopeToClean.view) {
                    scopeToClean.view.onFrame = null;
                    scopeToClean.view.onResize = null;
                    scopeToClean.view.remove();
                }
                if (scopeToClean.project) scopeToClean.project.remove();
                paperScopeRef.current = null;
            }
        };
    }, []); // Không có dependency, chỉ chạy một lần

    const slideBoxBaseClasses = "absolute top-0 max-h-full overflow-hidden shadow-2xl z-30";

    return (
        <>
            <div id="auth-background-container" className="fixed inset-0">
                <div className="absolute left-0 top-0 w-1/2 h-full bg-[#673AB7] flex items-center justify-center p-8 z-[1]">
                    {isLoginView && (
                        <div className="text-center text-white opacity-0 animate-fadeIn">
                            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Chào mừng trở lại!</h1>
                            <p className="text-lg sm:text-xl">
                                Đăng nhập để tiếp tục hành trình tuyệt vời của bạn.
                            </p>
                        </div>
                    )}
                </div>
                <div className="absolute right-0 top-0 w-1/2 h-full bg-[#03A9F4] flex items-center justify-center p-8 z-[1]">
                    {!isLoginView && (
                        <div className="text-center text-white opacity-0 animate-fadeIn">
                            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Tham gia cùng chúng tôi!</h1>
                            <p className="text-lg sm:text-xl">
                                Tạo tài khoản mới và khám phá những điều không giới hạn.
                            </p>
                        </div>
                    )}
                </div>
                <canvas
                    id="canvas"
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full z-[2]"
                ></canvas>
            </div>

            <div
                id="slideBox"
                style={{
                    marginLeft: slideBoxMarginLeft,
                    transition: 'margin-left 0.7s ease-in-out',
                    width: '50vw',
                    height: '100vh',
                    border: '1px outset lightcyan',
                    borderRadius: '5px',
                }}
                className={`${slideBoxBaseClasses}`}
            >
                <div
                    style={{
                        marginLeft: topLayerMarginLeft,
                        transition: 'margin-left 0.7s ease-in-out',
                    }}
                    className="w-[200%] h-full relative"
                >
                    {/* Truyền key và hàm switch */}
                    <SignUpForm onSwitchToLogin={switchToLogin} key={signUpFormKey} />
                    <SignInForm onSwitchToSignUp={switchToSignUp} key={signInFormKey} />
                </div>
            </div>
        </>
    );
};

export default AuthPage;