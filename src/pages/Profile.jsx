import { useParams } from 'react-router';
import styles from './Profile.module.css';

/**
 * Profile — Public player profile page.
 * Shows stats, rank badge, prediction history, achievements, seasonal badges.
 */
export default function Profile() {
  const { username } = useParams();

  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Player Profile</h1>
      <p className="text-muted">Username: {username}</p>
      <p className="text-muted">Profile stats, history, and achievements — coming soon</p>
    </div>
  );
}
