import styles from './DashboardHero.module.scss';

function DashboardHero({ eyebrow, greeting, name, subtitle, photo, chips = [], script, children }) {
  return (
    <section className={styles.hero}>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.ringA} />
        <span className={styles.ringB} />
        <span className={styles.dots} />
      </div>

      <div className={styles.copy}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.title}>
          {greeting} {name ? <span className={styles.name}>{name}.</span> : null}
        </h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {children ? <div className={styles.actions}>{children}</div> : null}
      </div>

      {photo ? (
        <div className={styles.media} aria-hidden="true">
          <img className={styles.portrait} src={photo} alt="" loading="eager" />
          {script ? <p className={styles.script}>{script}</p> : null}
        </div>
      ) : null}

      {chips.length > 0 ? (
        <ul className={styles.chips}>
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <li key={chip.label} className={styles.chip}>
                {Icon ? (
                  <span className={styles.chipIcon} aria-hidden="true">
                    <Icon size={16} />
                  </span>
                ) : null}
                <span className={styles.chipText}>
                  <strong>{chip.value}</strong>
                  <span>{chip.label}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export default DashboardHero;
