import styles from './PlaceholderPage.module.scss';

/**
 * Stands in for a route that exists in the MVP scope but has not been built
 * yet. Replace the usage in AppRoutes.jsx as each real page lands.
 */
function PlaceholderPage({ title, description, milestone }) {
  return (
    <section className={styles.page}>
      <h1>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
      {milestone ? <p className={styles.milestone}>Scheduled for {milestone}.</p> : null}
    </section>
  );
}

export default PlaceholderPage;
