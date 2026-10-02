import { AVATAR_FACES, photoUrl } from '../../../constants/photos.js';
import styles from './PublicHero.module.scss';

/**
 * Dark navy page-header band for the public marketing site. Sits directly
 * under the sticky header so the two read as one surface.
 *
 * Pass `photos={{ main, accent }}` (IDs from constants/photos.js) to switch to
 * a split layout with a decorative photo collage beside the copy.
 */
function PublicHero({ eyebrow, title, lead, align = 'left', photos, script, children }) {
  const hasPhotos = Boolean(photos?.main);
  const classes = [styles.hero, align === 'center' ? styles.center : '', hasPhotos ? styles.withPhotos : '']
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
          {children ? <div className={styles.actions}>{children}</div> : null}
        </div>

        {hasPhotos ? (
          <div className={styles.media} aria-hidden="true">
            <span className={styles.glow} />
            <img className={styles.mainPhoto} src={photoUrl(photos.main, 900, 720)} alt="" loading="eager" />
            {photos.accent ? (
              <img className={styles.accentPhoto} src={photoUrl(photos.accent, 360, 360)} alt="" loading="lazy" />
            ) : null}
            <div className={styles.faces}>
              <span className={styles.faceStack}>
                {AVATAR_FACES.map((id) => (
                  <img key={id} src={photoUrl(id, 80, 80)} alt="" loading="lazy" />
                ))}
              </span>
              <span>Skilled. Verified. Ready.</span>
            </div>
            {script ? <p className={styles.script}>{script}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default PublicHero;
