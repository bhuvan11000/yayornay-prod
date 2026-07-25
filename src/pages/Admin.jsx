import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, RotateCcw, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '../config/supabase';
import { api } from '../lib/api';
import styles from './Admin.module.css';

function ConfirmModal({ open, title, children, onConfirm, onCancel, confirmLabel, danger }) {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{title}</h3>
        <div className={styles.modalBody}>{children}</div>
        <div className={styles.modalActions}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={danger ? styles.btnDanger : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DisputeList({ disputes }) {
  if (!disputes || disputes.length === 0) {
    return <span className="text-muted text-sm">No disputes</span>;
  }
  return (
    <div className={styles.disputeList}>
      {disputes.map(d => (
        <div key={d.id} className={styles.disputeItem}>
          <span className={styles.disputeUser}>{d.user_id?.slice(0, 8)}...</span>
          <span className={styles.disputeReason}>{d.reason}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ market, onAction }) {
  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewCardHeader}>
        <h3 className={styles.reviewTitle}>{market.title}</h3>
        {market.failed_resolutions > 0 && (
          <span className={styles.failedBadge}>{market.failed_resolutions} failed</span>
        )}
      </div>
      <p className={styles.reviewDesc}>{market.description}</p>
      {market.resolution_criteria && (
        <div className={styles.reviewCriteria}>
          <span className={styles.criteriaLabel}>Resolution:</span>
          {market.resolution_criteria}
        </div>
      )}
      <DisputeList disputes={market.disputes} />
      <div className={styles.reviewActions}>
        <button className="btn-yes btn-sm" onClick={() => onAction(market.id, 'yes')}>
          <CheckCircle size={14} /> Resolve YES
        </button>
        <button className="btn-no btn-sm" onClick={() => onAction(market.id, 'no')}>
          <XCircle size={14} /> Resolve NO
        </button>
        <button className={styles.btnCancel} onClick={() => onAction(market.id, 'cancel')}>
          <RotateCcw size={14} /> Cancel & Refund
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [reviewMarkets, setReviewMarkets] = useState([]);
  const [recentResolutions, setRecentResolutions] = useState([]);
  const [generationLogs, setGenerationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [confirm, setConfirm] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [reviewRes, resolvedRes, logsRes] = await Promise.all([
        supabase
          .from('markets')
          .select('*, disputes:market_disputes(*)')
          .eq('status', 'review')
          .order('created_at', { ascending: false }),
        supabase
          .from('markets')
          .select('id, title, resolution, resolved_at, resolution_source, status')
          .in('status', ['resolved', 'cancelled'])
          .gte('resolved_at', new Date(Date.now() - 86400000).toISOString())
          .order('resolved_at', { ascending: false })
          .limit(20),
        supabase
          .from('market_generation_log')
          .select('*')
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (reviewRes.error) throw reviewRes.error;
      if (resolvedRes.error) throw resolvedRes.error;
      if (logsRes.error) throw logsRes.error;

      setReviewMarkets(reviewRes.data || []);
      setRecentResolutions(resolvedRes.data || []);
      setGenerationLogs(logsRes.data || []);
    } catch (err) {
      console.error('Admin load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handleAction(marketId, action) {
    const market = reviewMarkets.find(m => m.id === marketId);
    if (!market) return;
    if (action === 'cancel') {
      setConfirm({ marketId, action, title: 'Cancel Market', message: `Refund all players for "${market.title}"?` });
    } else {
      setConfirm({ marketId, action, title: `Resolve as ${action.toUpperCase()}`, message: `Resolve "${market.title}" as ${action.toUpperCase()}? This will pay out winners.` });
    }
  }

  async function executeAction() {
    if (!confirm) return;
    const { marketId, action } = confirm;
    setActioning(marketId);
    setConfirm(null);
    try {
      if (action === 'cancel') {
        await api.post('/admin-cancel', { market_id: marketId });
      } else {
        await api.post('/admin-resolve', { market_id: marketId, resolution: action });
      }
      await loadData();
    } catch (err) {
      console.error('Action failed:', err);
      setError(err.message);
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Shield size={22} className={styles.shieldIcon} />
          <h1 className="text-2xl font-heading">Admin Panel</h1>
        </div>
        <button className="btn-ghost btn-sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} className={loading ? styles.spin : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Markets Needing Review
          {reviewMarkets.length > 0 && <span className={styles.badge}>{reviewMarkets.length}</span>}
        </h2>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : reviewMarkets.length === 0 ? (
          <div className={styles.empty}>
            <CheckCircle size={24} className={styles.emptyIcon} />
            <p className="text-secondary">All clear — no markets need review</p>
          </div>
        ) : (
          <div className={styles.reviewGrid}>
            {reviewMarkets.map(market => (
              <ReviewCard
                key={market.id}
                market={market}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Recent Resolutions <span className={styles.subtitle}>Last 24 hours</span>
        </h2>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : recentResolutions.length === 0 ? (
          <p className="text-muted">No resolutions in the last 24 hours</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.tableCell}>Market</span>
              <span className={styles.tableCell}>Resolution</span>
              <span className={styles.tableCell}>Source</span>
              <span className={styles.tableCell}>Time</span>
            </div>
            {recentResolutions.map(m => (
              <div key={m.id} className={styles.tableRow}>
                <span className={styles.tableCell}>{m.title}</span>
                <span className={styles.tableCell}>
                  {m.status === 'cancelled' ? (
                    <span className="text-warning">Cancelled</span>
                  ) : m.resolution === 'yes' ? (
                    <span className="text-yes">YES</span>
                  ) : (
                    <span className="text-no">NO</span>
                  )}
                </span>
                <span className={styles.tableCell}>
                  <span className="text-muted">{m.resolution_source || '—'}</span>
                </span>
                <span className={styles.tableCell}>
                  <span className={styles.timeCell}>
                    <Clock size={12} />
                    {m.resolved_at ? new Date(m.resolved_at).toLocaleString() : '—'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Generation Log <span className={styles.subtitle}>Last 7 days</span>
        </h2>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : generationLogs.length === 0 ? (
          <p className="text-muted">No generation logs</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.tableCell}>Time</span>
              <span className={styles.tableCell}>Status</span>
              <span className={styles.tableCell}>Created</span>
              <span className={styles.tableCell}>Rejected</span>
            </div>
            {generationLogs.map(log => (
              <div key={log.id} className={styles.tableRow}>
                <span className={styles.tableCell}>{new Date(log.created_at).toLocaleString()}</span>
                <span className={styles.tableCell}>
                  <span className={`${styles.statusPill} ${styles[`status${log.status}`]}`}>
                    {log.status}
                  </span>
                </span>
                <span className={styles.tableCell}>{log.markets_generated}</span>
                <span className={styles.tableCell}>{log.markets_rejected}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        confirmLabel={confirm?.action === 'cancel' ? 'Yes, Cancel & Refund' : 'Yes, Resolve'}
        danger={confirm?.action === 'cancel'}
        onConfirm={executeAction}
        onCancel={() => setConfirm(null)}
      >
        <p>{confirm?.message}</p>
      </ConfirmModal>

      {actioning && (
        <div className={styles.actioning}>
          <RotateCcw size={16} className={styles.spin} />
          Processing...
        </div>
      )}
    </div>
  );
}
