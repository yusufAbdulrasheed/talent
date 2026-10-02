import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.scss';

/** Shown where a list has loaded successfully but has nothing in it. */
function EmptyState({ title, description, action, icon }) {
  const Icon = icon ?? Inbox;

  return (
    <div className={styles.wrapper}>
      <span className={styles.iconBadge}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}

export default EmptyState;
