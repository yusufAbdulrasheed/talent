import { photoUrl } from '../../../constants/photos.js';
import styles from './PhotoPromoCard.module.scss';

function PhotoPromoCard({ photo, icon, eyebrow, title, children, action, wide = false, className = '' }) {
  const Icon = icon;
  const classes = [styles.card, wide ? styles.wide : '', className].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      <img className={styles.photo} src={photoUrl(photo, 720, 900)} alt="" loading="lazy" />
      <span className={styles.scrim} aria-hidden="true" />
      <div className={styles.content}>
        {Icon ? (
          <span className={styles.icon} aria-hidden="true">
            <Icon size={20} />
          </span>
        ) : null}
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 className={styles.title}>{title}</h2>
        {children ? <div className={styles.body}>{children}</div> : null}
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
    </aside>
  );
}

export default PhotoPromoCard;
