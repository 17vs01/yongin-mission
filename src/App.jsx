import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// 페이지 임포트
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import HomePage            from './pages/HomePage';
import AttendancePage      from './pages/AttendancePage';
import NoticePage          from './pages/NoticePage';
import NoticeDetailPage    from './pages/NoticeDetailPage';
import FreeBoardPage       from './pages/FreeBoardPage';
import FreeBoardWritePage  from './pages/FreeBoardWritePage';
import FreeBoardDetailPage from './pages/FreeBoardDetailPage';
import PrayerPage          from './pages/PrayerPage';
import RankingPage         from './pages/RankingPage';
import AdminPage           from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── 공개 페이지 (로그인 없이 접근 가능) ── */}
          <Route path="/login"    element={<LoginPage />}    />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── 로그인 필요 페이지 ── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout><HomePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attend"
            element={
              <ProtectedRoute>
                <Layout><AttendancePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notice"
            element={
              <ProtectedRoute>
                <Layout><NoticePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notice/:id"
            element={
              <ProtectedRoute>
                <Layout><NoticeDetailPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/freeboard"
            element={
              <ProtectedRoute>
                <Layout><FreeBoardPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/freeboard/write"
            element={
              <ProtectedRoute>
                <Layout><FreeBoardWritePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/freeboard/:id"
            element={
              <ProtectedRoute>
                <Layout><FreeBoardDetailPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prayer"
            element={
              <ProtectedRoute>
                <Layout><PrayerPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <ProtectedRoute adminOnly>
                <Layout><RankingPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── 관리자 전용 페이지 ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Layout><AdminPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ── 없는 경로는 홈으로 ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
