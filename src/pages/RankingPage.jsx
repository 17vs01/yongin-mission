import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const { currentUser } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        // 전체 출석 기록을 가져와서 userId별로 집계
        const snap = await getDocs(collection(db, 'attendances'));

        const countMap = {}; // { uid: { name, department, count } }
        snap.docs.forEach((d) => {
          const data = d.data();
          const uid = data.userId;
          if (!countMap[uid]) {
            countMap[uid] = {
              uid,
              name:       data.userName       ?? '이름없음',
              department: data.userDepartment  ?? '',
              count:      0,
            };
          }
          countMap[uid].count += 1;
        });

        // 출석 횟수 내림차순 정렬
        const sorted = Object.values(countMap).sort((a, b) => b.count - a.count);
        setRanking(sorted);
      } catch (err) {
        console.error('순위 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  // 내 순위 찾기
  const myRankIndex = ranking.findIndex((r) => r.uid === currentUser?.uid);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">🏆 출석 순위</h2>
        <p className="text-gray-500 text-sm mt-0.5">열심히 참석한 분들이에요!</p>
      </div>

      {/* 내 순위 카드 */}
      {!loading && myRankIndex >= 0 && (
        <div className="bg-blue-700 text-white rounded-2xl p-4 mb-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-blue-200 text-xs">내 순위</p>
            <p className="text-2xl font-bold">{myRankIndex + 1}위</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">총 출석</p>
            <p className="text-2xl font-bold">{ranking[myRankIndex]?.count ?? 0}회</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📊</p>
          <p>아직 출석 기록이 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((person, idx) => {
            const isMe = person.uid === currentUser?.uid;
            return (
              <div
                key={person.uid}
                className={`rounded-2xl border p-4 flex items-center gap-3 transition-colors ${
                  isMe
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                {/* 순위 */}
                <div className="w-8 text-center">
                  {idx < 3 ? (
                    <span className="text-2xl">{MEDAL[idx]}</span>
                  ) : (
                    <span className="text-gray-400 font-bold text-sm">{idx + 1}</span>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>
                    {person.name}
                    {isMe && <span className="text-xs ml-1 text-blue-400">(나)</span>}
                  </p>
                  <p className="text-xs text-gray-400">{person.department}</p>
                </div>

                {/* 출석 횟수 */}
                <div className="text-right">
                  <p className={`font-bold text-lg ${isMe ? 'text-blue-700' : 'text-gray-700'}`}>
                    {person.count}
                  </p>
                  <p className="text-xs text-gray-400">회</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
