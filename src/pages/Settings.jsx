import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Save, LogOut, User, Mail, Calendar, Hash, Award } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { RankBadge } from '../components/gamification/RankBadge';
import { XPBar } from '../components/gamification/XPBar';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import styles from './Settings.module.css';

export default function Settings() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/update-profile', { username: displayName.trim() });
      updateUser({ username: displayName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.message || 'Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const avatarLetter = (user.username || 'U').charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Settings</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <User size={18} />
          Profile
        </h2>

        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {avatarLetter}
          </div>
          <p className="text-sm text-muted">Avatar selection coming soon</p>
        </div>

        <div className={styles.field}>
          <label className="label">Display Name</label>
          <div className={styles.inputRow}>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={30}
            />
            <Button onClick={handleSave} disabled={saving || !displayName.trim()}>
              {saving ? 'Saving...' : saved ? 'Saved!' : <><Save size={14} /> Save</>}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Award size={18} />
          Progression
        </h2>
        <div className={styles.rankRow}>
          <span className={styles.label}>Rank</span>
          <RankBadge rank={user.rank || 'Unranked'} size="lg" showLabel />
        </div>
        <div className={styles.xpRow}>
          <span className={styles.label}>Level & XP</span>
          <XPBar xp={user.xp || 0} variant="full" />
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Mail size={18} />
          Account Info
        </h2>
        <div className={styles.infoRow}>
          <Mail size={14} className={styles.infoIcon} />
          <span className={styles.infoLabel}>Email</span>
          <span className={styles.infoValue}>{user.email || '—'}</span>
        </div>
        <div className={styles.infoRow}>
          <Calendar size={14} className={styles.infoIcon} />
          <span className={styles.infoLabel}>Joined</span>
          <span className={styles.infoValue}>{user.created_at ? formatDate(user.created_at) : '—'}</span>
        </div>
        <div className={styles.infoRow}>
          <Hash size={14} className={styles.infoIcon} />
          <span className={styles.infoLabel}>User ID</span>
          <span className={styles.infoValue} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
            {user.id?.slice(0, 8)}...
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <Button onClick={handleLogout} variant="danger" className={styles.logoutBtn}>
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </div>
  );
}