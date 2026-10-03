import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import styles from './InfoCard.module.scss';

function InfoCard({ icon: Icon, eyebrow, title, children, to, linkLabel = 'Learn more' }) {
  return (
    <article className={styles.card}>
      {Icon ? (
        <span className={styles.icon} aria-hidden="true">
          <Icon size={22} />
        </span>
      ) : null}
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h3 className={styles.title}>{title}</h3>
      {children ? <p className={styles.body}>{children}</p> : null}
      {to ? (
        <Link className={styles.link} to={to}>
          {linkLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      ) : null}
    </article>
  );
}

export default InfoCard;
