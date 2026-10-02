import { Construction } from 'lucide-react';
import styles from './PlaceholderPage.module.scss';

/**
 * Stands in for a route that exists in the MVP scope but has not been built
 * yet. Replace the usage in AppRoutes.jsx as each real page lands.
 */
function PlaceholderPage({ title, description, milestone }) {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <span className={styles.iconBadge}>
          <Construction size={24} aria-hidden="true" />
        </span>
        <h1>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
        {milestone ? <p className={styles.milestone}>Scheduled for {milestone}.</p> : null}
      </div>
    </section>
  );
}

export default PlaceholderPage;
