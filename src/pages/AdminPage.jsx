import React, { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, doc, updateDoc,
  deleteDoc, query, orderBy, where, serverTimestamp, limit,
} from 'firebase/firestore';
import QRCode from 'qrcode';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

// ── 탭 상수 ─────────────────────────────────────────────
const TABS = [
  { key: 'session',  label: '📋 출석 세션' },
  { key: 'notice',   label: '📢 공지 작성' },
  { key: 'prayer',   label: '🙏 기도제목'  },
  { key: 'members',  label: '👥 회원 목록' },
];

// ── 랜덤 4자리 코드 생성 ─────────────────────────────────
const makeCode = () => String(Math.floor(1000 + Math.random() * 9000));

export default function AdminPage() {
  const { userProfile } = useAuth();
  const [tab, setTab] = useState('session');

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-1">⚙️ 관리자 페이지</h2>
      <p className="text-gray-500 text-sm mb-4">환영합니다, {userProfile?.name}님!</p>

      {/* 탭 */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 본문 */}
      {tab === 'session' && <SessionTab />}
      {tab === 'notice'  && <NoticeTab  authorName={userProfile?.name ?? '관리자'} />}
      {tab === 'prayer'  && <PrayerTab  />}
      {tab === 'members' && <MembersTab />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// 1. 출석 세션 탭
// ══════════════════════════════════════════════════════════
function SessionTab() {
  const [title,     setTitle]     = useState('');
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSession, setQrSession] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'sessions'), orderBy('createdAt', 'desc'))
      );
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // 세션 생성
  const handleCreate = async () => {
    if (!title.trim()) return alert('세션 제목을 입력해주세요.');
    setCreating(true);
    try {
      const code = makeCode();
      const ref = await addDoc(collection(db, 'sessions'), {
        title:     title.trim(),
        code,
        isActive:  true,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      await fetchSessions();
      // 생성 직후 QR 자동 표시
      await showQR({ id: ref.id, title: title.trim(), code });
    } catch (err) {
      alert('세션 생성 실패: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // 세션 종료/재개 토글
  const toggleActive = async (session) => {
    try {
      await updateDoc(doc(db, 'sessions', session.id), {
        isActive: !session.isActive,
      });
      fetchSessions();
    } catch (err) {
      alert('변경 실패: ' + err.message);
    }
  };

  // QR 코드 생성
  const showQR = async (session) => {
    const url = `${window.location.origin}/attend?sid=${session.id}&code=${session.code}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    setQrDataUrl(dataUrl);
    setQrSession(session);
  };

  const handlePrintQR = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR 출석</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
        <h2>용인시청 공무원선교회</h2>
        <h3>${qrSession?.title}</h3>
        <img src="${qrDataUrl}" style="width:280px"/>
        <p style="font-size:24px;letter-spacing:8px;font-weight:bold">코드: ${qrSession?.code}</p>
        <p style="color:#666">QR 코드를 스캔하거나 코드를 직접 입력하세요</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      {/* 세션 생성 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">새 출석 세션 만들기</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 2025년 1월 3주차 예배"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl py-2.5 transition-colors"
        >
          {creating ? '생성 중...' : '세션 생성 + QR 발급'}
        </button>
      </div>

      {/* QR 모달 */}
      {qrDataUrl && qrSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
            <h3 className="font-bold text-gray-800 text-lg mb-1">QR 코드</h3>
            <p className="text-gray-500 text-sm mb-4">{qrSession.title}</p>
            <img src={qrDataUrl} alt="QR" className="mx-auto mb-3 rounded-xl" />
            <div className="bg-gray-50 rounded-xl py-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">코드 입력 방식</p>
              <p className="text-4xl font-bold tracking-widest text-blue-700">{qrSession.code}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrintQR}
                className="flex-1 bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-800"
              >
                🖨️ 인쇄하기
              </button>
              <button
                onClick={() => { setQrDataUrl(''); setQrSession(null); }}
                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 세션 목록 */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700 text-sm">세션 목록</h3>
        {loading ? (
          <p className="text-center text-gray-400 py-4">불러오는 중...</p>
        ) : sessions.length === 0 ? (
          <p className="text-center text-gray-400 py-4">세션이 없어요</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                <p className="text-xs text-gray-400">코드: {s.code}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s.isActive ? '진행중' : '종료'}
                </span>
                <button
                  onClick={() => showQR(s)}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200"
                >
                  QR
                </button>
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    s.isActive
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {s.isActive ? '종료' : '재개'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// 2. 공지 작성 탭
// ══════════════════════════════════════════════════════════
function NoticeTab({ authorName }) {
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 모두 입력해주세요.');
    setSaving(true);
    try {
      await addDoc(collection(db, 'notices'), {
        title:       title.trim(),
        content:     content.trim(),
        authorName,
        createdAt:   serverTimestamp(),
      });
      setTitle('');
      setContent('');
      alert('공지가 등록되었어요! 📢');
    } catch (err) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-gray-700">공지사항 작성</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="공지 제목"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="공지 내용"
          rows={6}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl py-2.5 transition-colors"
      >
        {saving ? '저장 중...' : '공지 등록하기'}
      </button>
    </form>
  );
}

// ══════════════════════════════════════════════════════════
// 3. 기도제목 탭 (비공개 포함 전체 열람)
// ══════════════════════════════════════════════════════════
function PrayerTab() {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | public | private

  useEffect(() => {
    const fetchPrayers = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, 'prayers'), orderBy('createdAt', 'desc'))
        );
        setPrayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } finally {
        setLoading(false);
      }
    };
    fetchPrayers();
  }, []);

  const filtered = prayers.filter((p) => {
    if (filter === 'public')  return p.isPublic;
    if (filter === 'private') return !p.isPublic;
    return true;
  });

  const formatDate = (ts) =>
    ts?.toDate().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) ?? '';

  return (
    <div className="space-y-3">
      {/* 필터 */}
      <div className="flex gap-2">
        {[['all', '전체'], ['public', '🌐 공개'], ['private', '🔒 비공개']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
              filter === k ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-4">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-6">기도제목이 없어요</p>
      ) : (
        filtered.map((p) => (
          <div
            key={p.id}
            className={`rounded-xl border p-3 ${
              p.isPublic ? 'bg-white border-gray-100' : 'bg-purple-50 border-purple-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-600">
                {p.userName} · {p.department}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                p.isPublic ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
              }`}>
                {p.isPublic ? '공개' : '비공개'}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.content}</p>
            <p className="text-xs text-gray-400 mt-1">{formatDate(p.createdAt)}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// 4. 회원 목록 탭
// ══════════════════════════════════════════════════════════
function MembersTab() {
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [attCounts, setAttCounts] = useState({}); // uid → 출석횟수

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [userSnap, attSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), orderBy('createdAt', 'asc'))),
          getDocs(collection(db, 'attendances')),
        ]);

        const counts = {};
        attSnap.docs.forEach((d) => {
          const uid = d.data().userId;
          counts[uid] = (counts[uid] ?? 0) + 1;
        });

        setMembers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAttCounts(counts);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">총 {members.length}명</p>
      {loading ? (
        <p className="text-center text-gray-400 py-4">불러오는 중...</p>
      ) : (
        members.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {m.name}
                {m.isAdmin && (
                  <span className="text-xs ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">관리자</span>
                )}
              </p>
              <p className="text-xs text-gray-400">{m.department} · {m.email}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-700">{attCounts[m.uid] ?? 0}</p>
              <p className="text-xs text-gray-400">회 출석</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
