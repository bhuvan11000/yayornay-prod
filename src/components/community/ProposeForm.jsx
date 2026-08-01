import { useState, useMemo } from 'react';
import { Coins } from 'lucide-react';
import { usePropose } from '../../hooks/usePropose';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { getProposalCost } from '../../lib/rewards';
import { getRankInfo } from '../../lib/ranks';
import { formatCoins } from '../../lib/format';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const CATEGORIES = [
  { value: 'sports', label: 'Sports' },
  { value: 'tech', label: 'Tech' },
  { value: 'popculture', label: 'Pop Culture' },
  { value: 'politics', label: 'Politics' },
  { value: 'memes', label: 'Memes' },
];

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
}

function getMaxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split('T')[0];
}

export function ProposeForm({ onSuccess }) {
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const proposeMutation = usePropose();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [resolutionCriteria, setResolutionCriteria] = useState('');
  const [errors, setErrors] = useState({});

  const rank = user ? getRankInfo(user.coins).name : 'Unranked';
  const stake = getProposalCost(rank);

  const canSubmit = useMemo(() => {
    return (
      title.length >= 10 &&
      title.length <= 200 &&
      category &&
      closeDate &&
      resolutionCriteria.length >= 20 &&
      resolutionCriteria.length <= 300
    );
  }, [title, category, closeDate, resolutionCriteria]);

  const userLevel = user?.level || 1;
  if (userLevel < 3) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <Coins size={32} className="text-[var(--text-muted)]" />
        <h3 className="text-xl text-[var(--text-primary)]">Proposals Locked</h3>
        <p className="max-w-[400px] text-sm text-[var(--text-muted)]">
          Reach Level 3 to propose community markets. You are currently Level {userLevel}.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (title.length < 10 || title.length > 200) {
      setErrors((prev) => ({ ...prev, title: 'Must be 10-200 characters' }));
      return;
    }
    if (!category) {
      setErrors((prev) => ({ ...prev, category: 'Select a category' }));
      return;
    }
    if (!closeDate) {
      setErrors((prev) => ({ ...prev, closeDate: 'Select a close date' }));
      return;
    }
    if (resolutionCriteria.length < 20 || resolutionCriteria.length > 300) {
      setErrors((prev) => ({ ...prev, resolutionCriteria: 'Must be 20-300 characters' }));
      return;
    }

    if ((user?.coins || 0) < stake) {
      addToast('error', {
        title: 'Insufficient Coins',
        message: `You need ${formatCoins(stake)} coins to propose. You have ${formatCoins(user?.coins || 0)}.`,
      });
      return;
    }

    try {
      await proposeMutation.mutateAsync({
        title,
        category,
        closes_at: new Date(closeDate).toISOString(),
        resolution_criteria: resolutionCriteria,
      });
      onSuccess?.();
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      {errors.form && (
        <div className="rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] p-3 text-sm text-[var(--color-no)]">
          {errors.form}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-[var(--text-secondary)]">Title</Label>
          <span className="font-mono text-xs text-[var(--text-muted)]">{title.length}/200</span>
        </div>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Will GTA 6 release a new trailer before Aug 15?"
          maxLength={200}
          error={errors.title}
        />
        {title.length > 0 && title.length < 10 && (
          <span className="text-xs text-[var(--text-muted)]">
            {10 - title.length} more characters needed
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium text-[var(--text-secondary)]">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v)}>
          <SelectTrigger className="w-full border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <span className="text-xs font-medium text-[var(--color-no)]">{errors.category}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium text-[var(--text-secondary)]">Close Date</Label>
        <Input
          type="date"
          value={closeDate}
          onChange={(e) => setCloseDate(e.target.value)}
          min={getMinDate()}
          max={getMaxDate()}
          error={errors.closeDate}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-[var(--text-secondary)]">Resolution Criteria</Label>
          <span className="font-mono text-xs text-[var(--text-muted)]">{resolutionCriteria.length}/300</span>
        </div>
        <Textarea
          className={`min-h-[80px] w-full resize-y border bg-[var(--bg-input)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ${
            errors.resolutionCriteria
              ? 'border-[var(--color-no)]'
              : 'border-[var(--border-subtle)]'
          }`}
          value={resolutionCriteria}
          onChange={(e) => setResolutionCriteria(e.target.value)}
          placeholder="What exactly determines YES vs NO? Be specific..."
          maxLength={300}
          rows={3}
        />
        {resolutionCriteria.length > 0 && resolutionCriteria.length < 20 && (
          <span className="text-xs text-[var(--text-muted)]">
            {20 - resolutionCriteria.length} more characters needed
          </span>
        )}
        {errors.resolutionCriteria && (
          <span className="text-xs font-medium text-[var(--color-no)]">{errors.resolutionCriteria}</span>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-tertiary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        <Coins size={16} />
        <span>
          Stake: <strong className="font-mono text-[var(--color-warning)]">{formatCoins(stake)} coins</strong>{' '}
          (rank-scaled — {rank})
        </span>
      </div>

      <button
        type="submit"
        className="w-full cursor-pointer rounded-lg bg-[var(--accent-blue)] px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-blue-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSubmit || proposeMutation.isPending}
      >
        {proposeMutation.isPending
          ? 'Submitting...'
          : `Propose Market (costs ${formatCoins(stake)} coins)`
        }
      </button>
    </form>
  );
}
