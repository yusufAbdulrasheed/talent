import styles from './PageHeader.module.scss';

function PageHeader({ title, description, actions, meta }) {
  return (
    <header className={styles.header}>
      <div className={styles.headings}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {meta}
        </div>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export default PageHeader;
