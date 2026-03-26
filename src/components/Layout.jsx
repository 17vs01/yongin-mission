import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠어요?')) return;
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      alert('로그아웃 실패: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* 상단 헤더 */}
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div>
          <h1 className="font-bold text-base leading-tight">용인시청 공무원선교회</h1>
          {userProfile && (
            <p className="text-blue-200 text-xs">
              {userProfile.department} · {userProfile.name}
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-blue-200 hover:text-white text-xs border border-blue-400 rounded px-2 py-1 transition-colors"
        >
          로그아웃
        </button>
      </header>

      {/* 페이지 본문 */}
      <main className="flex-1 page-content">
        {children}
      </main>

      {/* 하단 내비게이션 */}
      <Navbar />
    </div>
  );
}
