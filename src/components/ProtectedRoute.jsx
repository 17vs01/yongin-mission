import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 로그인이 필요한 페이지를 감싸는 컴포넌트
 *
 * - 로그인 안 된 상태에서 /attend?sid=...&code=... 로 접근
 *   → 회원가입 페이지로 이동 (QR 파라미터 보존)
 * - 그 외 로그인 안 된 경우
 *   → 로그인 페이지로 이동
 * - adminOnly=true 이면 관리자만 접근 가능
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // QR 코드로 출석 페이지에 들어온 경우 → 회원가입으로 유도
    const isQrAttend =
      location.pathname === '/attend' &&
      location.search.includes('sid=') &&
      location.search.includes('code=');

    if (isQrAttend) {
      // 회원가입 후 다시 출석 페이지로 돌아올 수 있도록 from 기억
      return (
        <Navigate
          to="/register"
          state={{ from: location, fromQr: true }}
          replace
        />
      );
    }

    // 일반 페이지 → 로그인으로
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
