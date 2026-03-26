import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  collection, query, where, getDocs, addDoc,
  serverTimestamp, doc, getDoc, limit,
} from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

// 출석 방식 선택 화면
function MethodSelect({ onSelect }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="text-5xl mb-3">✝️</div>
        <h2 className="text-xl font-bold text-gray-800">출석 방법을 선택해주세요</h2>
        <p className="text-gray-400 text-sm mt-1">현장에서 QR 또는 코드로 출석해요</p>
      </div>

      {/* QR 스캔 버튼 */}
      <button
        onClick={() => onSelect('qr')}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl p-5 flex items-center gap-4 transition-colors shadow-sm"
      >
        <span className="text-4xl">📷</span>
        <div className="text-left">
          <p className="font-bold text-lg">QR 코드 스캔</p>
          <p className="text-blue-200 text-sm">현장에 붙은 QR을 카메라로 찍어요</p>
        </div>
      </button>

      {/* 코드 입력 버튼 */}
      <button
        onClick={() => onSelect('code')}
        className="w-full bg-white hover:bg-gray-50 border-2 border-blue-700 text-blue-700 rounded-2xl p-5 flex items-center gap-4 transition-colors shadow-sm"
      >
        <span className="text-4xl">🔢</span>
        <div className="text-left">
          <p className="font-bold text-lg">코드 직접 입력</p>
          <p className="text-gray-400 text-sm">관리자에게 받은 4자리 숫자를 입력해요</p>
        </div>
      </button>
    </div>
  );
}

// QR 스캔 화면
function QrScanner({ onResult, onBack }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const qr = new Html5Qrcode('qr-reader');
    scannerRef.current = qr;

    qr.start(
      { facingMode: 'environment' }, // 후면 카메라
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        qr.stop().catch(() => {});
        onResult(decodedText);
      },
      () => {} // 스캔 중 오류는 무시
    ).then(() => setScanning(true))
     .catch((err) => {
      setError('카메라를 사용할 수 없어요. 카메라 권한을 허용해주세요.');
      console.error(err);
    });

    return () => {
      qr.stop().catch(() => {});
    };
  }, [onResult]);

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-blue-600 text-sm flex items-center gap-1"
      >
        ← 뒤로가기
      </button>
      <h3 className="font-bold text-gray-800 text-lg">📷 QR 코드 스캔</h3>
      <p className="text-gray-500 text-sm">현장에 붙어있는 QR 코드를 카메라로 비춰주세요</p>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4 text-center">
          <p className="text-2xl mb-2">📵</p>
          <p>{error}</p>
          <button
            onClick={onBack}
            className="mt-3 text-blue-600 underline text-sm"
          >
            코드 입력으로 전환하기
          </button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border-4 border-blue-700 shadow-lg">
          <div id="qr-reader" className="w-full" />
        </div>
      )}

      {scanning && !error && (
        <p className="text-center text-gray-400 text-sm animate-pulse">
          QR 코드를 인식하는 중...
        </p>
      )}
    </div>
  );
}

// 코드 입력 화면
function CodeInput({ onSubmit, onBack, loading, error }) {
  const [code, setCode] = useState('');

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-blue-600 text-sm flex items-center gap-1"
      >
        ← 뒤로가기
      </button>
      <h3 className="font-bold text-gray-800 text-lg">🔢 코드 입력</h3>
      <p className="text-gray-500 text-sm">관리자에게 받은 4자리 숫자를 입력해주세요</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="0000"
          maxLength={4}
          inputMode="numeric"
          autoFocus
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-4xl font-bold text-center tracking-widest focus:outline-none focus:border-blue-500"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            ❌ {error}
          </div>
        )}

        <button
          onClick={() => onSubmit(code)}
          disabled={loading || code.length < 4}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white font-bold rounded-xl py-3 transition-colors"
        >
          {loading ? '확인 중...' : '출석 확인'}
        </button>
      </div>
    </div>
  );
}

// 기도제목 모달
function PrayerModal({ onSubmit, onSkip, saving }) {
  const [prayerText, setPrayerText] = useState('');
  const [isPublic,   setIsPublic]   = useState(true);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-xl">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">🙏</div>
          <h3 className="font-bold text-gray-800 text-lg">오늘의 기도제목</h3>
          <p className="text-gray-500 text-sm">기도제목을 남겨보세요 (선택사항)</p>
        </div>

        <textarea
          value={prayerText}
          onChange={(e) => setPrayerText(e.target.value)}
          placeholder="오늘의 기도제목을 써주세요..."
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
        />

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
              isPublic ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            🌐 공개
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
              !isPublic ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            🔒 비공개
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium"
          >
            건너뛰기
          </button>
          <button
            onClick={() => onSubmit(prayerText, isPublic)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors disabled:bg-blue-300"
          >
            {saving ? '저장 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// 메인 출석 페이지
// ══════════════════════════════════════════════════════════
export default function AttendancePage() {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 화면 단계: select → qr | code → result
  const [step,        setStep]        = useState('select');
  const [method,      setMethod]      = useState('');
  const [status,      setStatus]      = useState('idle'); // idle | loading | success | error | alreadyDone
  const [errorMsg,    setErrorMsg]    = useState('');
  const [sessionId,   setSessionId]   = useState('');
  const [sessionTitle,setSessionTitle]= useState('');

  // 기도제목 모달
  const [showPrayer,   setShowPrayer]   = useState(false);
  const [prayerSaving, setPrayerSaving] = useState(false);

  // QR URL로 들어온 경우 자동 처리
  useEffect(() => {
    const sid  = searchParams.get('sid');
    const code = searchParams.get('code');
    if (sid && code) {
      processAttendance(sid, code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMethodSelect = (m) => {
    setMethod(m);
    setStep(m); // 'qr' 또는 'code'
  };

  // QR 스캔 결과 처리
  const handleQrResult = async (url) => {
    try {
      const parsed = new URL(url);
      const sid  = parsed.searchParams.get('sid');
      const code = parsed.searchParams.get('code');
      if (!sid || !code) {
        setErrorMsg('올바른 QR 코드가 아니에요.');
        setStatus('error');
        setStep('result');
        return;
      }
      await processAttendance(sid, code);
    } catch {
      setErrorMsg('QR 코드를 읽을 수 없어요.');
      setStatus('error');
      setStep('result');
    }
  };

  // 코드 입력 처리
  const handleCodeSubmit = async (code) => {
    if (!code || code.length < 4) return;
    setStatus('loading');
    try {
      const snap = await getDocs(
        query(
          collection(db, 'sessions'),
          where('code',     '==', code.trim()),
          where('isActive', '==', true),
          limit(1),
        )
      );
      if (snap.empty) {
        setErrorMsg('코드가 맞지 않거나 진행 중인 세션이 없어요.');
        setStatus('error');
        return;
      }
      await processAttendance(snap.docs[0].id, code.trim());
    } catch (err) {
      setErrorMsg('오류가 발생했어요. 다시 시도해주세요.');
      setStatus('error');
    }
  };

  // 핵심: 출석 처리
  const processAttendance = async (sid, inputCode) => {
    setStatus('loading');
    setStep('result');
    try {
      const sessionSnap = await getDoc(doc(db, 'sessions', sid));
      if (!sessionSnap.exists()) {
        setStatus('error'); setErrorMsg('존재하지 않는 세션이에요.'); return;
      }
      const session = sessionSnap.data();
      if (!session.isActive) {
        setStatus('error'); setErrorMsg('이미 종료된 출석 세션이에요.'); return;
      }
      if (session.code !== inputCode.trim()) {
        setStatus('error'); setErrorMsg('출석 코드가 틀렸어요.'); return;
      }

      // 중복 확인
      const dup = await getDocs(
        query(
          collection(db, 'attendances'),
          where('userId',    '==', currentUser.uid),
          where('sessionId', '==', sid),
          limit(1),
        )
      );
      if (!dup.empty) {
        setStatus('alreadyDone'); setErrorMsg('이번 세션은 이미 출석 완료했어요! 😊'); return;
      }

      // 출석 기록 저장
      await addDoc(collection(db, 'attendances'), {
        userId:         currentUser.uid,
        userName:       userProfile?.name       ?? '',
        userDepartment: userProfile?.department ?? '',
        sessionId:      sid,
        sessionTitle:   session.title           ?? '',
        createdAt:      serverTimestamp(),
      });

      setSessionId(sid);
      setSessionTitle(session.title ?? '');
      setStatus('success');
      setShowPrayer(true);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('오류가 발생했어요. 다시 시도해주세요.');
    }
  };

  // 기도제목 저장
  const handlePrayerSubmit = async (text, isPublic) => {
    if (!text.trim()) { setShowPrayer(false); navigate('/'); return; }
    setPrayerSaving(true);
    try {
      await addDoc(collection(db, 'prayers'), {
        userId:     currentUser.uid,
        userName:   userProfile?.name       ?? '',
        department: userProfile?.department ?? '',
        content:    text.trim(),
        isPublic,
        sessionId,
        sessionTitle,
        createdAt:  serverTimestamp(),
      });
      setShowPrayer(false);
      alert('기도제목이 등록되었어요 🙏');
      navigate('/');
    } catch (err) {
      alert('기도제목 저장 실패: ' + err.message);
    } finally {
      setPrayerSaving(false);
    }
  };

  return (
    <div className="p-4">

      {/* ── 방법 선택 ── */}
      {step === 'select' && (
        <MethodSelect onSelect={handleMethodSelect} />
      )}

      {/* ── QR 스캔 ── */}
      {step === 'qr' && (
        <QrScanner
          onResult={handleQrResult}
          onBack={() => setStep('select')}
        />
      )}

      {/* ── 코드 입력 ── */}
      {step === 'code' && (
        <CodeInput
          onSubmit={handleCodeSubmit}
          onBack={() => { setStep('select'); setStatus('idle'); setErrorMsg(''); }}
          loading={status === 'loading'}
          error={status === 'error' ? errorMsg : ''}
        />
      )}

      {/* ── 결과 화면 ── */}
      {step === 'result' && (
        <div className="mt-4">
          {status === 'loading' && (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">출석 확인 중...</p>
            </div>
          )}

          {status === 'success' && !showPrayer && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-green-700 font-bold text-lg">출석 완료!</p>
              <p className="text-green-600 text-sm mt-1">"{sessionTitle}"</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-2 text-sm font-semibold"
              >
                홈으로 →
              </button>
            </div>
          )}

          {status === 'alreadyDone' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">😊</div>
              <p className="text-yellow-700 font-semibold">{errorMsg}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 text-blue-600 text-sm underline"
              >홈으로 돌아가기</button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">❌</div>
                <p className="text-red-600 font-semibold">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setStep('select'); setStatus('idle'); setErrorMsg(''); }}
                className="w-full border border-blue-700 text-blue-700 rounded-xl py-2.5 text-sm font-semibold"
              >
                다시 시도하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 기도제목 모달 ── */}
      {showPrayer && (
        <PrayerModal
          onSubmit={handlePrayerSubmit}
          onSkip={() => { setShowPrayer(false); navigate('/'); }}
          saving={prayerSaving}
        />
      )}
    </div>
  );
}
