import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export default function FreeBoardWritePage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim())   return setError('제목을 입력해주세요.');
    if (!content.trim()) return setError('내용을 입력해주세요.');

    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'freeboard'), {
        title:       title.trim(),
        content:     content.trim(),
        authorId:    currentUser.uid,
        authorName:  userProfile?.name       ?? '',
        department:  userProfile?.department ?? '',
        createdAt:   serverTimestamp(),
      });
      navigate('/freeboard');
    } catch (err) {
      setError('저장 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={() => navigate('/freeboard')}
        className="text-blue-600 text-sm mb-4 flex items-center gap-1"
      >
        ← 목록으로
      </button>

      <h2 className="text-xl font-bold text-gray-800 mb-4">✏️ 글쓰기</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={8}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl py-3 transition-colors"
        >
          {loading ? '저장 중...' : '게시하기'}
        </button>
      </form>
    </div>
  );
}
