import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 일반 회원 메뉴
const NAV_ITEMS = [
  { to: '/',          icon: '🏠', label: '홈'       },
  { to: '/notice',    icon: '📢', label: '공지'     },
  { to: '/freeboard', icon: '💬', label: '자유게시판' },
  { to: '/prayer',    icon: '🙏', label: '기도제목'  },
];

// 관리자 전용 추가 메뉴
const ADMIN_ITEMS = [
  { to: '/ranking', icon: '🏆', label: '출석순위' },
  { to: '/admin',   icon: '⚙️', label: '관리자'   },
];

export default function Navbar() {
  const { isAdmin } = useAuth();
  const items = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full text-xs gap-0.5 transition-colors ` +
              (isActive ? 'text-blue-600 font-semibold' : 'text-gray-400')
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
