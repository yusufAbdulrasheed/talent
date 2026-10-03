import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import styles from './StatCard.module.scss';

function StatCard({ label, value, icon, hint, to, tone = 'default' }) {
  const Icon = icon;
  const classes = [styles.card, styles[tone], to ? styles.interactive : ''].filter(Boolean).join(' ');

  const content = (
    <>
      <span className={styles.icon} aria-hidden="true">
        {Icon ? <Icon size={20} strokeWidth={2.2} /> : null}
      </span>
      <span className={styles.body}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </span>
      {to ? <ChevronRight size={18} className={styles.arrow} aria-hidden="true" /> : null}
    </>
  );

  return to ? (
    <Link to={to} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}

export default StatCard;
