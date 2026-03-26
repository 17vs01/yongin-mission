import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// 용인시청 부서 목록
const DEPARTMENTS = [
  '기획예산과', '행정지원과', '홍보담당관', '감사관',
  '안전관리과', '복지정책과', '노인복지과', '아동복지과',
  '교육청소년과', '문화체육과', '환경정책과', '교통과',
  '건설과', '도시계획과', '건축과', '세무과',
  '회계과', '토지정보과', '기타',
];

// 가입 혜택 목록
const BENEFITS = [
  {
    icon: '🙏',
    title: '기도의 힘을 나눠요',
    desc: '기도제목을 목사님과 성도님들과 나눌 수 있어요. 함께 기도할 때 더 큰 은혜가 임해요.',
  },
  {
    icon: '✅',
    title: '출석 기록이 쌓여요',
    desc: '매주 예배 출석이 자동으로 기록돼요. 내가 얼마나 열심히 참석했는지 한눈에 볼 수 있어요.',
  },
  {
    icon: '🏆',
    title: '출석 우수자 상품 기회',
    desc: '열심히 출석한 분께 상품을 드려요! 꾸준한 참석이 복이 돼요.',
  },
  {
    icon: '📢',
    title: '공지사항을 바로 받아요',
    desc: '모임 일정, 행사 안내 등 중요한 공지를 앱에서 바로 확인할 수 있어요.',
  },
  {
    icon: '💬',
    title: '성도님들과 소통해요',
    desc: '자유게시판에서 일상을 나누고 서로 격려하며 더 가까워질 수 있어요.',
  },
];

export default function RegisterPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // QR로 들어온 경우 가입 후 돌아갈 위치
  const from     = location.state?.from?.pathname ?? '/';
  const fromSearch = location.state?.from?.search ?? '';
  const fromQr   = location.state?.fromQr ?? false;

  const [form, setForm] = useState({
    name:       '',
    email:      '',
    password:   '',
    password2:  '',
    department: '',
    adminCode:  '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(!fromQr); // QR이면 혜택 먼저 보여주기

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim())        return setError('이름을 입력해주세요.');
    if (!form.department)         return setError('부서를 선택해주세요.');
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 해요.');
    if (form.password !== form.password2) return setError('비밀번호가 서로 달라요.');

    const isAdmin =
      form.adminCode.trim() !== '' &&
      form.adminCode.trim() === import.meta.env.VITE_ADMIN_SETUP_CODE;

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth, form.email, form.password
      );
      const uid = credential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        name:       form.name.trim(),
        email:      form.email,
        department: form.department,
        isAdmin,
        createdAt:  serverTimestamp(),
      });

      // 가입 후 원래 가려던 페이지로 (QR 출석이면 출석 페이지로!)
      navigate(from + fromSearch, { replace: true });
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use': setError('이미 사용 중인 이메일이에요.'); break;
        case 'auth/invalid-email':        setError('이메일 형식이 올바르지 않아요.'); break;
        default:                          setError('가입 실패: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-blue-900 flex flex-col items-center justify-start p-4 py-8">

      {/* 로고 */}
      <div className="text-center mb-5">
        <div className="text-4xl mb-2">✝️</div>
        <h1 className="text-white text-xl font-bold">용인시청 공무원선교회</h1>
        {fromQr && (
          <div className="mt-2 bg-white/20 rounded-xl px-4 py-2">
            <p className="text-blue-100 text-sm">
              📷 QR 출석을 위해 먼저 가입해주세요!
            </p>
          </div>
        )}
      </div>

      {/* ── 혜택 소개 (QR로 들어온 경우 먼저 보여주기) ── */}
      {!showForm && (
        <div className="w-full max-w-sm space-y-3 mb-5">
          <h2 className="text-white font-bold text-center text-lg mb-4">
            🎁 회원가입하면 이런 점이 좋아요!
          </h2>
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className="bg-white/15 rounded-2xl p-4 flex gap-3 items-start"
            >
              <span className="text-2xl shrink-0">{b.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{b.title}</p>
                <p className="text-blue-100 text-xs mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-white text-blue-700 font-bold rounded-2xl py-3 mt-2 hover:bg-blue-50 transition-colors shadow-lg"
          >
            지금 바로 가입하기 →
          </button>
          <p className="text-center text-blue-200 text-sm">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="text-white font-semibold underline"
            >
              로그인
            </Link>
          </p>
        </div>
      )}

      {/* ── 회원가입 폼 ── */}
      {showForm && (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            {fromQr && (
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ←
              </button>
            )}
            <h2 className="text-gray-800 font-bold text-lg">회원가입</h2>
          </div>

          {/* QR 출석 안내 */}
          {fromQr && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-blue-700 text-xs font-medium">
                ✅ 가입 완료 후 자동으로 출석 처리돼요!
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="홍길동"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부서 *</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">부서 선택</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 * (6자 이상)</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="6자 이상"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인 *</label>
              <input
                type="password"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                placeholder="비밀번호 다시 입력"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                관리자 코드 <span className="text-xs text-gray-400">(관리자만 입력)</span>
              </label>
              <input
                type="password"
                name="adminCode"
                value={form.adminCode}
                onChange={handleChange}
                placeholder="없으면 비워두기"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold rounded-lg py-2.5 mt-1 transition-colors"
            >
              {loading ? '가입 중...' : fromQr ? '가입하고 출석하기 ✅' : '가입하기'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="text-blue-600 font-semibold hover:underline"
            >
              로그인
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
