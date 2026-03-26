import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function FreeBoardPage() {
  const navigate = useNavigate();
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'freeboard'), orderBy('createdAt', 'desc'))
        );
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('게시판 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate();
    const now = new Date();
    const diff = now - d;
    if (diff < 60000)  return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">💬 자유게시판</h2>
        <button
          onClick={() => navigate('/freeboard/write')}
          className="text-sm bg-blue-700 text-white rounded-lg px-3 py-1.5 hover:bg-blue-800"
        >
          + 글쓰기
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📝</p>
          <p>아직 게시글이 없어요</p>
          <p className="text-sm mt-1">첫 번째 글을 작성해보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/freeboard/${post.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <p className="font-semibold text-gray-800 text-sm mb-1 truncate">{post.title}</p>
              <p className="text-gray-500 text-xs line-clamp-2 mb-2">{post.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{post.authorName} · {post.department}</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
