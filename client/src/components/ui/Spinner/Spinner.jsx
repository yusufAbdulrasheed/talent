import styles from './Spinner.module.scss';

function Spinner({ label = 'Loading', size = 'md' }) {
  return (
    <span className={`${styles.spinner} ${styles[size]}`} role="status" aria-live="polite">
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default Spinner;
