import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import styles from './Alert.module.scss';

const VARIANT_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: OctagonAlert,
};

/**
 * Inline status message. `error` and `warning` announce assertively so a
 * failed submission is not missed by screen-reader users.
 */
function Alert({ children, variant = 'info', title }) {
  const isUrgent = variant === 'error' || variant === 'warning';
  const Icon = VARIANT_ICONS[variant] ?? Info;

  return (
    <div
      className={`${styles.alert} ${styles[variant]}`}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
    >
      <Icon className={styles.icon} size={18} aria-hidden="true" />
      <div className={styles.body}>
        {title ? <p className={styles.title}>{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Alert;
