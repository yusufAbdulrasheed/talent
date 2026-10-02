import styles from './PublicSection.module.scss';

/**
 * A full-bleed marketing section with a centred container and an optional
 * eyebrow / title / lead header. `tone` picks the background surface.
 */
function PublicSection({
  id,
  tone = 'surface', // surface | raised | ink
  align = 'left', // left | center
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
