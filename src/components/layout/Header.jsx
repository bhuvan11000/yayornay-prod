import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Coins,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { formatCoins } from '../../lib/format';
import { getRankColor, getRankLabel } from '../../lib/ranks';
import { RankBadge } from '../gamification/RankBadge';
import Counter from '../reactbits/Counter/Counter';

/**
 * Header — the arena scoreboard bar.
 * Condensed-caps nav with amber underline for the active station,
 * a coin chip, rank badge and avatar dropdown.
 */

const NAV_ITEMS = [
  { to: '/markets', label: 'Markets' },
  { to: '/my-predictions', label: 'My Predictions' },
  { to: '/community', label: 'Community' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/quests', label: 'Quests' },
];

const NAV_LINK_BASE =
  'font-heading text-[13px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap px-3 py-1.5 text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)] max-lg:px-2 max-lg:text-xs';

const NAV_LINK_ACTIVE =
  'relative text-[var(--accent-amber)] after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:bg-[var(--accent-amber)] after:content-[""]';

const MOBILE_NAV_LINK_BASE =
  'flex items-center font-heading text-base font-semibold uppercase tracking-[0.08em] rounded-[var(--radius-sm)] px-4 py-3 text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]';

const MOBILE_NAV_LINK_ACTIVE = 'bg-[var(--accent-amber-muted)] text-[var(--accent-amber)]';

const DROPDOWN_ITEM_BASE =
  'flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]';

export function Header() {
  const { user, logout, getRankColor } = useAuthStore();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on navigation
  const handleNavClick = () => {
    setMobileMenuOpen(false);
    setAvatarDropdownOpen(false);
  };

  const handleLogout = async () => {
    handleNavClick();
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
        {/* ── Left: Logo + Desktop Nav ── */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to="/" className="group flex items-center gap-2.5" onClick={handleNavClick}>
            <span className="flex size-7 items-center justify-center rounded-[3px] bg-[var(--accent-amber)] font-mono text-[11px] font-bold text-[#16100a] shadow-[var(--shadow-sm)] transition-transform duration-150 group-hover:-rotate-6">
              PA
            </span>
            <span className="font-heading text-lg font-bold uppercase leading-none tracking-[0.08em] text-[var(--text-primary)]">
              Predict <span className="text-[var(--accent-amber)]">Arena</span>
            </span>
          </Link>

          <nav className="hidden items-center md:flex max-lg:gap-0">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${NAV_LINK_BASE} ${isActive ? NAV_LINK_ACTIVE : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

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

          {/* Rank Badge */}
          <RankBadge rank={rank} size="md" showLabel />

          {/* Avatar Dropdown */}
          <div className="relative max-md:hidden" ref={dropdownRef}>
            <button
              className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
              onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
              aria-expanded={avatarDropdownOpen}
              aria-haspopup="true"
            >
              <div
                className="flex size-8 items-center justify-center rounded-[3px] font-heading text-sm font-bold uppercase select-none"
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
                  onClick={() => { handleNavClick(); navigate(`/profile/${user.username}`); }}
                >
                  <User size={14} />
                  Profile
                </button>
                <button
                  className={DROPDOWN_ITEM_BASE}
                  onClick={() => { handleNavClick(); navigate('/settings'); }}
                >
                  <Settings size={14} />
                  Settings
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

          {/* Hamburger (mobile only) */}
          <button
            className="hidden size-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] max-md:flex"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[calc(var(--z-sticky)+1)] bg-black/60 animate-[fadeIn_0.2s_ease] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-[calc(var(--z-sticky)+2)] flex w-[280px] max-w-[80vw] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] transition-transform duration-[var(--transition-normal)] md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-4">
          <Link to="/" className="flex items-center gap-2.5" onClick={handleNavClick}>
            <span className="flex size-7 items-center justify-center rounded-[3px] bg-[var(--accent-amber)] font-mono text-[11px] font-bold text-[#16100a]">
              PA
            </span>
            <span className="font-heading text-lg font-bold uppercase leading-none tracking-[0.08em] text-[var(--text-primary)]">
              Predict <span className="text-[var(--accent-amber)]">Arena</span>
            </span>
          </Link>
          <button
            className="flex size-8 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border-none bg-transparent text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile nav links */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${MOBILE_NAV_LINK_BASE} ${isActive ? MOBILE_NAV_LINK_ACTIVE : ''}`
            }
            onClick={handleNavClick}
          >
            Home
          </NavLink>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${MOBILE_NAV_LINK_BASE} ${isActive ? MOBILE_NAV_LINK_ACTIVE : ''}`
              }
              onClick={handleNavClick}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="my-2 h-px bg-[var(--border-subtle)]" />

          <NavLink
            to={`/profile/${user?.username ?? ''}`}
            className={({ isActive }) =>
              `${MOBILE_NAV_LINK_BASE} ${isActive ? MOBILE_NAV_LINK_ACTIVE : ''}`
            }
            onClick={handleNavClick}
          >
            <User size={18} className="mr-2" />
            Profile
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${MOBILE_NAV_LINK_BASE} ${isActive ? MOBILE_NAV_LINK_ACTIVE : ''}`
            }
            onClick={handleNavClick}
          >
            <Settings size={18} className="mr-2" />
            Settings
          </NavLink>
          <button
            className={`${MOBILE_NAV_LINK_BASE} w-full cursor-pointer border-none bg-transparent text-left text-[var(--color-no)] hover:bg-[var(--color-no-muted)] hover:text-[var(--color-no)]`}
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </nav>
      </aside>
    </header>
  );
}
