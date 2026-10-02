import Button from '../../ui/Button/Button.jsx';
import styles from './PublicCTA.module.scss';

/** Closing call-to-action band shared by the marketing pages. */
function PublicCTA({ title, lead, primary, secondary }) {
  return (
    <section className={styles.cta}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 className={styles.title}>{title}</h2>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
        </div>
        <div className={styles.actions}>
          {primary ? (
            <Button to={primary.to} size="lg">
              {primary.label}
            </Button>
          ) : null}
          {secondary ? (
            <Button to={secondary.to} size="lg" variant="secondary">
              {secondary.label}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default PublicCTA;
