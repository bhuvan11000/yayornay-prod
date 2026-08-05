import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Trophy, Target, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Dock from '../reactbits/Dock/Dock';

export function MobileDock() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);

  const items = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/markets', label: 'Markets', icon: BarChart3 },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/quests', label: 'Quests', icon: Target },
    { to: `/profile/${user?.username ?? ''}`, label: 'Profile', icon: User },
  ].map(({ to, label, icon: Icon }) => {
    const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);

    return {
      label,
      onClick: () => navigate(to),
      icon: (
        <Icon
          size={24}
          strokeWidth={2}
          className={`transition-colors duration-150 ${isActive ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'}`}
        />
      ),
    };
  });

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] flex justify-center pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <Dock items={items} baseItemSize={46} magnification={62} distance={160} />
    </nav>
  );
}
