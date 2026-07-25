import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Coins } from 'lucide-react';
import { usePropose } from '../../hooks/usePropose';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { getProposalCost } from '../../lib/rewards';
import { getRankInfo } from '../../lib/ranks';
import { formatCoins } from '../../lib/format';
import styles from './ProposeForm.module.css';

const CATEGORIES = [
  { value: '', label: 'Select a category' },
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

export function ProposeForm() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const proposeMutation = usePropose();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      description.length >= 20 &&
      description.length <= 500 &&
      category &&
      closeDate &&
      resolutionCriteria.length >= 20 &&
      resolutionCriteria.length <= 300
    );
  }, [title, description, category, closeDate, resolutionCriteria]);

  const userLevel = user?.level || 1;
  if (userLevel < 5) {
    return (
      <div className={styles.locked}>
        <div className={styles.lockedIcon}>
          <Coins size={32} />
        </div>
        <h3 className={styles.lockedTitle}>Proposals Locked</h3>
        <p className={styles.lockedText}>
          Reach Level 5 to propose community markets. You are currently Level {userLevel}.
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
    if (description.length < 20 || description.length > 500) {
      setErrors((prev) => ({ ...prev, description: 'Must be 20-500 characters' }));
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
        description,
        category,
        closes_at: new Date(closeDate).toISOString(),
        resolution_criteria: resolutionCriteria,
      });
      navigate('/community');
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {errors.form && (
        <div className={styles.formError}>{errors.form}</div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>
          Title <span className={styles.counter}>{title.length}/200</span>
        </label>
        <input
          className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Will GTA 6 release a new trailer before Aug 15?"
          maxLength={200}
        />
        {title.length > 0 && title.length < 10 && (
          <span className={styles.hint}>{10 - title.length} more characters needed</span>
        )}
        {errors.title && <span className={styles.error}>{errors.title}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Description <span className={styles.counter}>{description.length}/500</span>
        </label>
        <textarea
          className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide context for this market..."
          maxLength={500}
          rows={3}
        />
        {description.length > 0 && description.length < 20 && (
          <span className={styles.hint}>{20 - description.length} more characters needed</span>
        )}
        {errors.description && <span className={styles.error}>{errors.description}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Category</label>
        <select
          className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.category && <span className={styles.error}>{errors.category}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Close Date</label>
        <input
          className={`${styles.input} ${errors.closeDate ? styles.inputError : ''}`}
          type="date"
          value={closeDate}
          onChange={(e) => setCloseDate(e.target.value)}
          min={getMinDate()}
          max={getMaxDate()}
        />
        {errors.closeDate && <span className={styles.error}>{errors.closeDate}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Resolution Criteria <span className={styles.counter}>{resolutionCriteria.length}/300</span>
        </label>
        <textarea
          className={`${styles.textarea} ${errors.resolutionCriteria ? styles.inputError : ''}`}
          value={resolutionCriteria}
          onChange={(e) => setResolutionCriteria(e.target.value)}
          placeholder="What exactly determines YES vs NO? Be specific..."
          maxLength={300}
          rows={3}
        />
        {resolutionCriteria.length > 0 && resolutionCriteria.length < 20 && (
          <span className={styles.hint}>{20 - resolutionCriteria.length} more characters needed</span>
        )}
        {errors.resolutionCriteria && <span className={styles.error}>{errors.resolutionCriteria}</span>}
      </div>

      <div className={styles.stakeInfo}>
        <Coins size={16} />
        <span>Stake: <strong>{formatCoins(stake)} coins</strong> (rank-scaled — {rank})</span>
      </div>

      <button
        type="submit"
        className={styles.submit}
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
