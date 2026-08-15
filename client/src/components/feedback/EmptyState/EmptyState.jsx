import styles from './EmptyState.module.scss';

/** Shown where a list has loaded successfully but has nothing in it. */
function EmptyState({ title, description, action }) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}

export default EmptyState;
