import { photoUrl } from '../../../constants/photos.js';
import styles from './PhotoPanel.module.scss';

/**
 * Decorative rounded photo with an optional floating caption chip, used to
 * break up text-heavy marketing sections. `photo` is an ID from constants/photos.js.
 */
function PhotoPanel({ photo, alt = '', caption, icon: Icon, ratio = '4 / 5', className = '' }) {
  return (
    <figure className={`${styles.panel} ${className}`}>
      <img
        className={styles.image}
        src={photoUrl(photo, 900)}
        alt={alt}
        loading="lazy"
        style={{ aspectRatio: ratio }}
      />
      {caption ? (
        <figcaption className={styles.caption}>
          {Icon ? (
            <span className={styles.captionIcon} aria-hidden="true">
              <Icon size={18} />
            </span>
          ) : null}
          <span>{caption}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}

export default PhotoPanel;
