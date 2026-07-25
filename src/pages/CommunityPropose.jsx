import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { ProposeForm } from '../components/community/ProposeForm';
import styles from './CommunityPropose.module.css';

export default function CommunityPropose() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userLevel = user?.level || 1;

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/community')}>
        <ArrowLeft size={16} />
        Back to Community
      </button>

      <div className={styles.header}>
        <h1 className="text-2xl font-heading">Propose a Market</h1>
        <p className={styles.subtitle}>
          Create a new prediction market for the community to vote on.
          {userLevel < 5 && (
            <span className={styles.levelNote}>
              You need Level 5 to propose (currently Level {userLevel})
            </span>
          )}
        </p>
      </div>

      <div className={styles.formCard}>
        <ProposeForm />
      </div>
    </div>
  );
}
