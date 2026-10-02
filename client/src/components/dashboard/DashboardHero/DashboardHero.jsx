import styles from './DashboardHero.module.scss';

/**
 * Signature banner at the top of every portal overview: greeting and actions
 * on a navy → violet gradient, with a decorative portrait — genuinely
 * transparent (the PNG's own alpha channel, pre-cut, not a CSS mask trick) —
 * plus a few floating "chips" for headline numbers.
 *
 *   <DashboardHero
 *     eyebrow="Recruiter console"
 *     greeting="Good morning,"
 *     name="David"
 *     subtitle="Find professionals who are ready…"
 *     photo="/illustrations/hero-recruiter.png"
 *     chips={[{ icon: Users, label: 'Verified talent', value: 18 }]}
 *   >
 *     <Button …>Find talent</Button>
 *   </DashboardHero>
 *
 * `photo` is a path into client/public/illustrations — pre-cut PNGs with a
 * real alpha channel, cropped tight to the subject. Stock imagery for mood
 * only; it never represents the signed-in user or a candidate.
 */
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
