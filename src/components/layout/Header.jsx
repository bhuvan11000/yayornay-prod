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
import { useShouldAnimate } from '../../lib/countUpSession';
import { RankBadge } from '../gamification/RankBadge';
import CountUp from '../reactbits/CountUp/CountUp';

/**
 * Header — Persistent top navigation bar.
 *
 * Desktop:
 *  Left:  App name + nav links (Markets, Community, Leaderboard, Quests)
 *  Right: Coin balance, rank badge, avatar dropdown
 *
 * Mobile (< 768px):
 *  Left:  Hamburger menu, app name
 *  Right: Coin balance, rank badge
 *  Slide-out sidebar with all nav links + additional info
 */

const NAV_ITEMS = [
  { to: '/markets', label: 'Markets' },
  { to: '/my-predictions', label: 'My Predictions' },
  { to: '/community', label: 'Community' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/quests', label: 'Quests' },
];

const NAV_LINK_BASE =
  'rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium whitespace-nowrap text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] max-lg:px-2 max-lg:text-xs';

const NAV_LINK_ACTIVE =
  'relative bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-3/5 after:-translate-x-1/2 after:rounded-full after:bg-[var(--accent-blue)] after:content-[""]';

const MOBILE_NAV_LINK_BASE =
  'flex items-center rounded-[var(--radius-md)] px-4 py-3 text-base font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]';

const MOBILE_NAV_LINK_ACTIVE = 'bg-[var(--accent-blue-muted)] text-[var(--accent-blue)]';

const DROPDOWN_ITEM_BASE =
  'flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]';

const LOGO_CLASS =
  'font-heading text-lg font-bold whitespace-nowrap text-[var(--text-primary)] transition-colors duration-150 hover:text-[var(--accent-blue)]';

export function Header() {
  const { user, logout, getRankColor } = useAuthStore();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const coinsAnimate = useShouldAnimate('header-coins', user?.coins ?? 0);

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
  const avatarLetter = (user.username || 'U').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-16 items-center border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 max-md:px-4">
        {/* ── Left: Logo + Desktop Nav ── */}
        <div className="flex items-center gap-8">
          <Link to="/" className={LOGO_CLASS} onClick={handleNavClick}>
            Predict Arena
          </Link>

          <nav className="hidden items-center gap-1 md:flex max-lg:gap-0">
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
        <div className="flex items-center gap-4">
          {/* Coin Balance */}
          <div
            className="flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] px-2 py-1 animate-[coinPulse_0.3s_ease]"
            title={formatCoins(coins)}
          >
            <Coins size={16} className="shrink-0 text-[var(--color-warning)]" />
            {coinsAnimate ? (
              <CountUp
                key={coins}
                to={coins}
                from={0}
                duration={0.8}
                separator=","
                className="font-mono text-sm font-semibold text-[var(--text-primary)]"
              />
            ) : (
              <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                {formatCoins(coins)}
              </span>
            )}
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
                className="flex size-8 items-center justify-center rounded-full font-heading text-sm font-bold text-white uppercase select-none"
                style={{ background: rankColor }}
              >
                {avatarLetter}
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${avatarDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {avatarDropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-[var(--z-dropdown)] w-[200px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] animate-[headerScaleIn_0.15s_ease]">
                <div className="flex flex-col gap-0.5 px-4 py-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{user.username}</span>
                  <span className="text-xs font-medium" style={{ color: rankColor }}>
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
            className="hidden size-9 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] max-md:flex"
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
          className="fixed inset-0 z-[calc(var(--z-sticky)+1)] bg-black/50 animate-[fadeIn_0.2s_ease] md:hidden"
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
          <Link to="/" className={LOGO_CLASS} onClick={handleNavClick}>
            Predict Arena
          </Link>
          <button
            className="flex size-8 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border-none bg-transparent text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
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
