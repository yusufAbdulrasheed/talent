import Button from '../../components/ui/Button/Button.jsx';
import styles from './NotFoundPage.module.scss';

function NotFoundPage() {
  return (
    <section className={styles.page}>
      <p className={styles.code}>404</p>
      <h1>We couldn&apos;t find that page</h1>
      <p className={styles.body}>The link may be out of date, or the page may have moved.</p>
      <Button to="/">Back to home</Button>
    </section>
  );
}

export default NotFoundPage;
