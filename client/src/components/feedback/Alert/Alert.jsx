import styles from './Alert.module.scss';

/**
 * Inline status message. `error` and `warning` announce assertively so a
 * failed submission is not missed by screen-reader users.
 */
function Alert({ children, variant = 'info', title }) {
  const isUrgent = variant === 'error' || variant === 'warning';

  return (
    <div
      className={`${styles.alert} ${styles[variant]}`}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
    >
      {title ? <p className={styles.title}>{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}

export default Alert;
