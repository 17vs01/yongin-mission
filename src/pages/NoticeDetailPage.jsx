import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export default function NoticeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [notice,  setNotice]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'notices', id));
        if (snap.exists()) setNotice({ id: snap.id, ...snap.data() });
        else navigate('/notice');
      } catch (err) {
        console.error(err);
        navigate('/notice');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('이 공지를 삭제할까요?')) return;
    try {
      await deleteDoc(doc(db, 'notices', id));
      navigate('/notice');
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  const formatDate = (ts) =>
    ts?.toDate().toLocaleString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) ?? '';

  if (loading) return <div className="text-center py-10 text-gray-400">불러오는 중...</div>;
  if (!notice) return null;

  return (
    <div className="p-4">
      <button
        onClick={() => navigate('/notice')}
        className="text-blue-600 text-sm mb-4 flex items-center gap-1"
      >
        ← 목록으로
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-2">{notice.title}</h2>
        <div className="flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-gray-100 mb-4">
          <span>{notice.authorName ?? '관리자'}</span>
          <span>{formatDate(notice.createdAt)}</span>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{notice.content}</p>
      </div>

      {isAdmin && (
        <button
          onClick={handleDelete}
          className="mt-4 w-full py-2.5 border border-red-300 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors"
        >
          🗑️ 공지 삭제
        </button>
      )}
    </div>
  );
}
