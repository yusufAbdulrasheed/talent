import styles from './AuthPanel.module.scss';

/** Shared centred card used by every authentication screen. */
function AuthPanel({ title, subtitle, children, footer }) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.panel}>
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
