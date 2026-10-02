import { Link } from 'react-router-dom';
import Logo from '../../../components/brand/Logo/Logo.jsx';
import styles from './AuthPanel.module.scss';

/** Shared centred card used by every authentication screen. */
function AuthPanel({ title, subtitle, children, footer }) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.panel}>
        <Link to="/" className={styles.brand} aria-label="Sultan Magnate Consulting home">
          <Logo variant="lockup" size={44} tagline />
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
        {children}
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </section>
  );
}

export default AuthPanel;
