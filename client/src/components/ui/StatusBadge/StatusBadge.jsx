import styles from './StatusBadge.module.scss';

function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

export default StatusBadge;
