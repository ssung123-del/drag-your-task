import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, BarChart2, Calendar, Download, Settings, LogOut, User, Heart } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
    children: React.ReactNode;
}

/**
 * 멀티플랫폼 반응형 레이아웃
 * - 모바일: 하단 탭 바 (iOS 스타일)
 * - 태블릿/PC: 좌측 사이드바 네비게이션
 * 
 * 왜 이렇게 나누었는가?
 * → 모바일은 한 손 조작이 편한 하단 탭이 최적
 * → 넓은 화면에서는 좌측 사이드바가 콘텐츠 공간 활용에 유리
 */
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { useMinistryStore } from '../store/useMinistryStore';

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const user = useMinistryStore(state => state.user);
    const clearData = useMinistryStore(state => state.clearData);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: unknown) {
            console.error("Login failed:", error);
            const code = typeof error === 'object' && error !== null && 'code' in error
                ? String((error as { code?: unknown }).code || '')
                : '';

            if (code.includes('auth/unauthorized-domain')) {
                alert("로그인 도메인이 Firebase에 등록되지 않았습니다. localhost로 접속했는지 확인해주세요.");
                return;
            }

            if (code.includes('auth/popup-blocked')) {
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            if (code.includes('auth/cancelled-popup-request')) {
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            alert("로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const handleLogout = async () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            await signOut(auth);
            clearData();
        }
    };

    const navItems = [
        { to: '/', icon: ClipboardList, label: '기록' },
        { to: '/shepherding', icon: Heart, label: '목양수첩' },
        { to: '/dashboard', icon: BarChart2, label: '통계' },
        { to: '/plans', icon: Calendar, label: '계획' },
        { to: '/export', icon: Download, label: '내보내기' },
        { to: '/settings', icon: Settings, label: '설정' },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* === 사이드바 (태블릿/PC: md 이상에서만 노출) === */}
            <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-card/80 backdrop-blur-xl border-r border-border p-6 sticky top-0 h-screen">
                {/* 앱 로고 & 타이틀 */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30">
                        🎯
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-text leading-tight">드래그 유얼<br />테스크</h1>
                        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Drag Your Task</span>
                    </div>
                </div>

                {/* 사이드바 네비게이션 메뉴 */}
                <nav className="flex-1 space-y-1.5">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                        : "text-text-secondary hover:bg-gray-100/10 hover:text-text"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className={clsx("text-sm", isActive ? "font-bold" : "font-medium")}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* 프로필/로그인 영역 (하단) */}
                <div className="mt-auto pt-6 border-t border-gray-100">
                    {user ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 px-2">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-indigo-50 shadow-sm" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                                        <User size={20} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text truncate">{user.displayName || "선교 사역자"}</p>
                                    <p className="text-[10px] text-text-secondary truncate">{user.email}</p>
                                    <p className="text-[10px] text-emerald-600 font-semibold">클라우드 동기화 연결됨</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                aria-label="로그아웃"
                            >
                                <LogOut size={14} />
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogin}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-95 group"
                            aria-label="Google 계정으로 로그인"
                        >
                            <div className="w-6 h-6 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-5 h-5">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.64z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </div>
                            <span className="text-sm font-bold text-text-secondary group-hover:text-indigo-600">Google 로그인</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* === 메인 콘텐츠 영역 === */}
            <div className="flex-1 flex flex-col min-h-screen max-w-full">
                {/* 모바일 헤더 (md 미만에서만 노출) */}
                <header className="md:hidden sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-5 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
                        🎯 드래그 유얼 테스크
                    </h1>

                    {/* 모바일 프로필/로그인 익스텐션 */}
                    <div className="flex items-center gap-2">
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-card p-1 pr-3 rounded-full border border-border active:scale-95 transition-all"
                                aria-label="로그아웃"
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-7 h-7 rounded-full shadow-sm" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                                        <User size={14} />
                                    </div>
                                )}
                                <span className="text-[10px] font-bold text-gray-500">로그아웃</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                                aria-label="Google 계정으로 로그인"
                            >
                                <User size={12} />
                                로그인
                            </button>
                        )}
                    </div>
                </header>

                {/* PC 상단 바 (md 이상, 미니멀) */}
                <header className="hidden md:flex sticky top-0 z-50 bg-card/60 backdrop-blur-xl border-b border-border px-8 py-4 items-center justify-between">
                    <div /> {/* 좌측 빈 공간: 사이드바가 이미 타이틀을 보여줌 */}
                    <span className="text-xs font-semibold text-text-secondary bg-background px-3 py-1 rounded-full">
                        Drag Your Task
                    </span>
                </header>

                {/* 메인 컨텐츠 */}
                <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 overflow-y-auto scroll-smooth">
                    {children}
                </main>

                {/* 모바일 하단 탭 바 (md 미만에서만 노출) */}
                <nav className="md:hidden fixed bottom-0 w-full bg-card/90 backdrop-blur-xl border-t border-border flex justify-around pb-safe pt-2 z-50 safe-area-bottom">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                clsx(
                                    "flex flex-col items-center justify-center w-full py-2 transition-all duration-200 active:scale-90",
                                    isActive ? "text-indigo-600" : "text-text-secondary hover:text-text"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        size={24}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={clsx("mb-1 transition-all", isActive && "transform scale-110")}
                                    />
                                    <span className={clsx("text-[10px] font-medium tracking-tight", isActive ? "font-bold" : "")}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default Layout;
