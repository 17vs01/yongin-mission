import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export default function NoticePage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'notices'), orderBy('createdAt', 'desc'))
        );
        setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('공지 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '';
    return ts.toDate().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">📢 공지사항</h2>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="text-sm bg-blue-700 text-white rounded-lg px-3 py-1.5 hover:bg-blue-800"
          >
            + 작성
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p>아직 공지사항이 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice, i) => (
            <div
              key={notice.id}
              onClick={() => navigate(`/notice/${notice.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {i === 0 && (
                <span className="text-xs bg-red-500 text-white rounded px-1.5 py-0.5 mr-2 font-semibold">NEW</span>
              )}
              <p className="font-semibold text-gray-800 text-sm inline">{notice.title}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{notice.authorName ?? '관리자'}</span>
                <span className="text-xs text-gray-400">{formatDate(notice.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
