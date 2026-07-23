import { useParams } from 'react-router';
import styles from './MarketDetail.module.css';

/**
 * MarketDetail — Single market view with price chart, prediction form,
 * participant stats, and user's positions.
 */
export default function MarketDetail() {
  const { id } = useParams();

  return (
    <div className={styles.page}>
      <h1 className="text-2xl font-heading">Market Detail</h1>
      <p className="text-muted">Market ID: {id}</p>
      <p className="text-muted">Price chart, prediction form, and positions — coming soon</p>
    </div>
  );
}
