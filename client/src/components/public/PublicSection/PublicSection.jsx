import styles from './PublicSection.module.scss';

function PublicSection({
  id,
  tone = 'surface', 
  align = 'left', 
  eyebrow,
  title,
  lead,
  headerActions,
  children,
}) {
  const hasHeader = eyebrow || title || lead || headerActions;
  const classes = [styles.section, styles[tone], align === 'center' ? styles.center : '']
    .filter(Boolean)
    .join(' ');

  return (
    <section id={id} className={classes}>
      <div className={styles.inner}>
        {hasHeader ? (
          <header className={styles.header}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {lead ? <p className={styles.lead}>{lead}</p> : null}
            {headerActions ? <div className={styles.headerActions}>{headerActions}</div> : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}

export default PublicSection;
