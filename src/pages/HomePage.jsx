import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

// 아이폰인지 안드로이드인지 감지
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

// 이미 홈 화면에 설치됐는지 감지
function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

// 설치 안내 팝업
function InstallPopup({ onClose }) {
  const deviceType = getDeviceType();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-lg">📱 앱처럼 사용하기</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >✕</button>
        </div>

        <p className="text-gray-500 text-sm mb-4">
          홈 화면에 추가하면 앱처럼 바로 실행할 수 있어요!
        </p>

        {/* 아이폰 안내 */}
        {(deviceType === 'ios' || deviceType === 'other') && (
          <div className="bg-blue-50 rounded-xl p-4 mb-3">
            <p className="font-semibold text-blue-800 text-sm mb-2">🍎 아이폰 (Safari)</p>
            <div className="space-y-1.5 text-sm text-blue-700">
              <p>1. 하단 <span className="bg-blue-200 px-1.5 py-0.5 rounded font-medium">공유 버튼 □↑</span> 클릭</p>
              <p>2. <span className="bg-blue-200 px-1.5 py-0.5 rounded font-medium">홈 화면에 추가</span> 선택</p>
              <p>3. <span className="bg-blue-200 px-1.5 py-0.5 rounded font-medium">추가</span> 클릭</p>
            </div>
          </div>
        )}

        {/* 안드로이드 안내 */}
        {(deviceType === 'android' || deviceType === 'other') && (
          <div className="bg-green-50 rounded-xl p-4 mb-4">
            <p className="font-semibold text-green-800 text-sm mb-2">🤖 안드로이드 (Chrome)</p>
            <div className="space-y-1.5 text-sm text-green-700">
              <p>1. 우측 상단 <span className="bg-green-200 px-1.5 py-0.5 rounded font-medium">⋮ 메뉴</span> 클릭</p>
              <p>2. <span className="bg-green-200 px-1.5 py-0.5 rounded font-medium">홈 화면에 추가</span> 선택</p>
              <p>3. <span className="bg-green-200 px-1.5 py-0.5 rounded font-medium">추가</span> 클릭</p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl py-2.5 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [myAttendance,  setMyAttendance]  = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [recentNotice,  setRecentNotice]  = useState(null);
  const [loading,       setLoading]       = useState(true);

  // 작은 띠 배너 상태
  const [showStrip,  setShowStrip]  = useState(false);
  // 팝업 상태
  const [showPopup,  setShowPopup]  = useState(false);

  // 오늘 날짜 포맷
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  useEffect(() => {
    // 설치 안 됐고, 닫은 적 없으면 작은 띠 보여주기
    if (!isInstalled() && !sessionStorage.getItem('pwa-banner-closed')) {
      setShowStrip(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchData = async () => {
      try {
        const attSnap = await getDocs(
          query(collection(db, 'attendances'), where('userId', '==', currentUser.uid))
        );
        setMyAttendance(attSnap.size);

        const sessionSnap = await getDocs(
          query(collection(db, 'sessions'), where('isActive', '==', true), limit(1))
        );
        setActiveSession(sessionSnap.empty ? null : sessionSnap.docs[0].data());

        const noticeSnap = await getDocs(
          query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(1))
        );
        setRecentNotice(noticeSnap.empty ? null : noticeSnap.docs[0].data());
      } catch (err) {
        console.error('홈 데이터 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const closeStrip = (e) => {
    e.stopPropagation();
    sessionStorage.setItem('pwa-banner-closed', '1');
    setShowStrip(false);
  };

  return (
    <div className="p-4 space-y-4">

      {/* ── 작은 띠 배너 (누르면 팝업) ── */}
      {showStrip && (
        <div
          onClick={() => setShowPopup(true)}
          className="bg-indigo-600 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <span className="text-white text-sm font-medium">앱처럼 사용하기 — 홈 화면에 추가하기</span>
          </div>
          <button
            onClick={closeStrip}
            className="text-indigo-300 hover:text-white text-base ml-2 shrink-0"
          >✕</button>
        </div>
      )}

      {/* 설치 안내 팝업 */}
      {showPopup && <InstallPopup onClose={() => setShowPopup(false)} />}

      {/* ── 인사 카드 ── */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-5 text-white shadow-md">
        <p className="text-blue-100 text-sm">{today}</p>
        <h2 className="text-xl font-bold mt-1">
          안녕하세요, {userProfile?.name ?? ''}님! 👋
        </h2>
        <p className="text-blue-100 text-sm mt-1">{userProfile?.department}</p>
        <div className="mt-3 bg-white/20 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs">내 총 출석 횟수</p>
            <p className="text-2xl font-bold">{loading ? '…' : myAttendance}회</p>
          </div>
          <span className="text-4xl">✝️</span>
        </div>
      </div>

      {/* ── 출석 버튼 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-700 mb-3">📋 이번 주 출석</h3>
        {activeSession ? (
          <div className="space-y-2">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-green-700 font-semibold text-sm">✅ 출석 세션 진행 중!</p>
              <p className="text-green-600 text-xs mt-0.5">{activeSession.title}</p>
            </div>
            <button
              onClick={() => navigate('/attend')}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl py-3 transition-colors shadow-sm"
            >
              출석하기 →
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm">현재 진행 중인 출석 세션이 없어요</p>
            <p className="text-gray-300 text-xs mt-1">관리자가 세션을 시작하면 출석할 수 있어요</p>
          </div>
        )}
      </div>

      {/* ── 최근 공지 ── */}
      {recentNotice && (
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => navigate('/notice')}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">📢 최근 공지</h3>
            <span className="text-blue-600 text-xs">전체보기 →</span>
          </div>
          <p className="text-gray-800 text-sm font-medium truncate">{recentNotice.title}</p>
        </div>
      )}

      {/* ── 빠른 메뉴 ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '💬', label: '자유게시판', to: '/freeboard' },
          { icon: '🙏', label: '기도제목',   to: '/prayer'    },
          ...(isAdmin ? [{ icon: '🏆', label: '출석순위', to: '/ranking' }] : []),
          { icon: '📢', label: '공지사항',   to: '/notice'    },
        ].map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
