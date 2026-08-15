import styles from './StatusBadge.module.scss';

/** Small coloured pill for a status value. Tone carries the meaning. */
function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

export default StatusBadge;
