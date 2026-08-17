import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Coins, ChevronDown, User, Settings, LogOut, Info } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { formatCoins } from '../../lib/format';
import { getRankColor, getRankLabel } from '../../lib/ranks';
import { RankBadge } from '../gamification/RankBadge';
import Counter from '../reactbits/Counter/Counter';
import PillNav from '../reactbits/PillNav/PillNav';

/**
 * Header — the arena scoreboard bar.
 * Reactbits pill nav (squarish pills, sweep hover) as the title section,
 * plus a coin chip, rank badge and avatar dropdown.
 */

const NAV_ITEMS = [
  { href: '/markets', label: 'Markets' },
  { href: '/my-predictions', label: 'My Predictions' },
  { href: '/community', label: 'Community' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/quests', label: 'Quests' },
  { href: '/about', label: 'About' },
];

const DROPDOWN_ITEM_BASE =
  'flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]';

const LOGO = (
  <span className="flex items-center gap-2.5">
    <img
      src="/icon-192.png"
      alt="Yay or Nay"
      className="size-7 rounded-[3px] shadow-[var(--shadow-sm)]"
    />
    <span className="font-heading text-lg font-bold leading-none tracking-[0.08em]">
      <span className="text-[var(--color-yes)]">Yay</span>
      <span className="mx-1 text-[var(--accent-amber)]">or</span>
      <span className="text-[var(--color-no)]">Nay</span>
    </span>
  </span>
);

export function Header() {
  const { user, logout, getRankColor } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close avatar dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setAvatarDropdownOpen(false);
    await logout();
    navigate('/auth');
  };

  if (!user) return null;

  const coins = user.coins ?? 0;
  const rank = user.rank || 'Unranked';
  const rankColor = getRankColor();
  const isUnranked = rankColor === '#ffffff';
  const avatarLetter = (user.username || 'U').charAt(0).toUpperCase();

  return (
    <header className="relative z-[var(--z-sticky)] h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
        {/* ── Left: Pill Nav (logo + nav) ── */}
        <PillNav
          logo={LOGO}
          logoAlt="Yay or Nay"
          logoHref="/"
          items={NAV_ITEMS}
          activeHref={pathname}
          baseColor="var(--bg-tertiary)"
          pillColor="var(--bg-primary)"
          pillTextColor="var(--text-secondary)"
          hoveredPillTextColor="var(--text-primary)"
        />

        {/* ── Right: Stats + Avatar ── */}
        <div className="flex items-center gap-3">
          {/* Coin chip */}
          <div
            className="flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 animate-[coinPulse_0.3s_ease]"
            title={formatCoins(coins)}
          >
            <Coins size={15} className="shrink-0 text-[var(--color-warning)]" />
            <Counter
              key={coins}
              value={coins}
              fontSize={14}
              gap={2}
              textColor="var(--text-primary)"
              fontWeight={600}
              gradientHeight={6}
              gradientFrom="#29332c"
              counterStyle={{ fontFamily: 'JetBrains Mono, monospace', paddingLeft: 0, paddingRight: 0 }}
            />
          </div>

          {/* Rank Badge (desktop) */}
          <RankBadge rank={rank} size="md" showLabel className="hidden md:inline-flex" />

          {/* Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
              onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
              aria-expanded={avatarDropdownOpen}
              aria-haspopup="true"
            >
              <div
                className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] font-heading text-sm font-bold uppercase select-none"
                style={{ background: rankColor, color: isUnranked ? '#0B0E0C' : undefined }}
              >
                {avatarLetter}
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${avatarDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {avatarDropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-[var(--z-dropdown)] w-[200px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] animate-[headerScaleIn_0.15s_ease]">
                <div className="flex flex-col gap-0.5 px-4 py-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{user.username}</span>
                  <span className="font-heading text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: rankColor }}>
                    {getRankLabel(rank)}
                  </span>
                </div>
                <div className="h-px bg-[var(--border-subtle)]" />
                <button
                  className={DROPDOWN_ITEM_BASE}
                  onClick={() => { setAvatarDropdownOpen(false); navigate(`/profile/${user.username}`); }}
                >
                  <User size={14} />
                  Profile
                </button>
                <button
                  className={DROPDOWN_ITEM_BASE}
                  onClick={() => { setAvatarDropdownOpen(false); navigate('/settings'); }}
                >
                  <Settings size={14} />
                  Settings
                </button>
                <button
                  className={DROPDOWN_ITEM_BASE}
                  onClick={() => { setAvatarDropdownOpen(false); navigate('/about'); }}
                >
                  <Info size={14} />
                  About
                </button>
                <div className="h-px bg-[var(--border-subtle)]" />
                <button
                  className={`${DROPDOWN_ITEM_BASE} text-[var(--color-no)] hover:bg-[var(--color-no-muted)] hover:text-[var(--color-no)]`}
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
