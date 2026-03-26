import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function PrayerPage() {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        // 공개 기도제목만 가져오기
        const snap = await getDocs(
          query(
            collection(db, 'prayers'),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc')
          )
        );
        setPrayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('기도제목 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrayers();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate();
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return `${Math.floor(diff / 3600000) || 1}시간 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">🙏 기도제목 게시판</h2>
        <p className="text-gray-500 text-sm mt-0.5">출석 후 남긴 공개 기도제목이에요</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : prayers.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🕊️</p>
          <p>아직 등록된 기도제목이 없어요</p>
          <p className="text-sm mt-1">출석 후 기도제목을 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prayers.map((prayer) => (
            <div
              key={prayer.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
            >
              {/* 세션 제목 */}
              {prayer.sessionTitle && (
                <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                  {prayer.sessionTitle}
                </span>
              )}
              <p className="text-gray-800 text-sm leading-relaxed mt-2 whitespace-pre-wrap">
                {prayer.content}
              </p>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                <span>
                  🙏 {prayer.userName}
                  {prayer.department && ` · ${prayer.department}`}
                </span>
                <span>{formatDate(prayer.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
