import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Coins,
  Flame,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { formatCoins } from '../../lib/format';
import { getRankColor, getRankLabel } from '../../lib/ranks';
import { xpProgress } from '../../lib/levels';
import styles from './Header.module.css';

/**
 * Header — Persistent top navigation bar.
 *
 * Desktop:
 *  Left:  App name + nav links (Markets, Community, Leaderboard, Quests)
 *  Right: Coin balance, rank badge, XP bar, streak counter, avatar dropdown
 *
 * Mobile (< 768px):
 *  Left:  Hamburger menu, app name
 *  Right: Coin balance, rank badge
 *  Slide-out sidebar with all nav links + additional info
 */

const NAV_ITEMS = [
  { to: '/markets', label: 'Markets' },
  { to: '/community', label: 'Community' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/quests', label: 'Quests' },
];

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
  const xp = user.xp ?? 0;
  const rank = user.rank || 'Unranked';
  const rankColor = getRankColor();
  const streak = user.betting_streak ?? 0;
  const progress = xpProgress(xp);
  const avatarLetter = (user.username || 'U').charAt(0).toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* ── Left: Logo + Desktop Nav ── */}
        <div className={styles.left}>
          <Link to="/" className={styles.logo} onClick={handleNavClick}>
            Predict Arena
          </Link>

          <nav className={styles.desktopNav}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ── Right: Stats + Avatar ── */}
        <div className={styles.right}>
          {/* Coin Balance */}
          <div className={styles.coinBalance}>
            <Coins size={16} className={styles.coinIcon} />
            <span className={styles.coinAmount}>{formatCoins(coins)}</span>
          </div>

          {/* Rank Badge */}
          <div className={styles.rankBadge}>
            <span
              className={styles.rankDot}
              style={{ background: rankColor }}
            />
            <span className={styles.rankName}>{getRankLabel(rank)}</span>
          </div>

          {/* XP Progress Bar (desktop only) */}
          <div className={styles.xpBar} title={`Level ${progress.currentLevel} — ${formatCoins(progress.xpInLevel)} / ${formatCoins(progress.xpRequiredForNext)} XP`}>
            <span className={styles.xpLabel}>
              Lv.{progress.currentLevel}
            </span>
            <div className={styles.xpTrack}>
              <div
                className={styles.xpFill}
                style={{ width: `${Math.round(progress.progress * 100)}%` }}
              />
            </div>
          </div>

          {/* Streak Counter (if > 0) */}
          {streak > 0 && (
            <div className={styles.streak}>
              <Flame size={14} className={styles.streakIcon} />
              <span className={styles.streakCount}>{streak}</span>
            </div>
          )}

          {/* Avatar Dropdown */}
          <div className={styles.avatarWrapper} ref={dropdownRef}>
            <button
              className={styles.avatarButton}
              onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
              aria-expanded={avatarDropdownOpen}
              aria-haspopup="true"
            >
              <div
                className={styles.avatar}
                style={{ background: rankColor }}
              >
                {avatarLetter}
              </div>
              <ChevronDown
                size={14}
                className={`${styles.chevron} ${avatarDropdownOpen ? styles.chevronOpen : ''}`}
              />
            </button>

            {avatarDropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownUsername}>{user.username}</span>
                  <span className={styles.dropdownRank} style={{ color: rankColor }}>
                    {getRankLabel(rank)}
                  </span>
                </div>
                <div className={styles.dropdownDivider} />
                <button
                  className={styles.dropdownItem}
                  onClick={() => { handleNavClick(); navigate(`/profile/${user.username}`); }}
                >
                  <User size={14} />
                  Profile
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { handleNavClick(); navigate('/settings'); }}
                >
                  <Settings size={14} />
                  Settings
                </button>
                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
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
            className={styles.hamburger}
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
          className={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Sidebar ── */}
      <aside
        className={`${styles.mobileSidebar} ${mobileMenuOpen ? styles.mobileSidebarOpen : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.logo} onClick={handleNavClick}>
            Predict Arena
          </Link>
          <button
            className={styles.sidebarClose}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile nav links */}
        <nav className={styles.mobileNav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
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
                `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
              }
              onClick={handleNavClick}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/achievements"
            className={({ isActive }) =>
              `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
            }
            onClick={handleNavClick}
          >
            Achievements
          </NavLink>
        </nav>

        {/* Mobile sidebar footer stats */}
        <div className={styles.sidebarFooter}>
          {/* XP bar (mobile) */}
          <div className={styles.sidebarXpRow}>
            <span className={styles.sidebarXpLabel}>
              Level {progress.currentLevel}
            </span>
            <div className={styles.xpTrack}>
              <div
                className={styles.xpFill}
                style={{ width: `${Math.round(progress.progress * 100)}%` }}
              />
            </div>
            <span className={styles.sidebarXpText}>
              {formatCoins(progress.xpInLevel)} / {formatCoins(progress.xpRequiredForNext)} XP
            </span>
          </div>

          {/* Streak (mobile) */}
          {streak > 0 && (
            <div className={styles.sidebarRow}>
              <Flame size={14} className={styles.streakIcon} />
              <span>{streak}-day betting streak</span>
            </div>
          )}
        </div>
      </aside>
    </header>
  );
}