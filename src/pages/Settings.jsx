import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Save, LogOut, User, Mail, Calendar, Hash, Award } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { RankBadge } from '../components/gamification/RankBadge';
import { XPBar } from '../components/gamification/XPBar';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';

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
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-heading">Settings</h1>

      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="flex items-center gap-2 text-lg text-[var(--text-primary)]">
          <User size={18} />
          Profile
        </h2>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)] font-heading text-xl font-bold uppercase text-white select-none">
            {avatarLetter}
          </div>
          <p className="text-sm text-muted">Avatar selection coming soon</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="label">Display Name</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
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

      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="flex items-center gap-2 text-lg text-[var(--text-primary)]">
          <Award size={18} />
          Progression
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Rank</span>
          <RankBadge rank={user.rank || 'Unranked'} size="lg" showLabel />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Level & XP</span>
          <XPBar xp={user.xp || 0} variant="full" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h2 className="flex items-center gap-2 text-lg text-[var(--text-primary)]">
          <Mail size={18} />
          Account Info
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Mail size={14} className="shrink-0 text-[var(--text-muted)]" />
          <span className="w-20 shrink-0 text-[var(--text-muted)]">Email</span>
          <span className="text-[var(--text-primary)]">{user.email || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="shrink-0 text-[var(--text-muted)]" />
          <span className="w-20 shrink-0 text-[var(--text-muted)]">Joined</span>
          <span className="text-[var(--text-primary)]">{user.created_at ? formatDate(user.created_at) : '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Hash size={14} className="shrink-0 text-[var(--text-muted)]" />
          <span className="w-20 shrink-0 text-[var(--text-muted)]">User ID</span>
          <span className="font-mono text-xs text-[var(--text-primary)]">
            {user.id?.slice(0, 8)}...
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <Button onClick={handleLogout} variant="danger" className="w-full">
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </div>
  );
}
