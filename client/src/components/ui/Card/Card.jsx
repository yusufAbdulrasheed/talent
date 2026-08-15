import styles from './Card.module.scss';

/** Panel used to group content inside a portal page. */
function Card({ title, description, actions, children, className = '' }) {
  const hasHeader = title || description || actions;

  return (
    <section className={`${styles.card} ${className}`}>
      {hasHeader ? (
        <header className={styles.header}>
          <div className={styles.headings}>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export default Card;
