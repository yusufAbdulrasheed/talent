import Spinner from '../../ui/Spinner/Spinner.jsx';
import styles from './FullPageLoader.module.scss';

function FullPageLoader({ label = 'Loading' }) {
  return (
    <div className={styles.wrapper}>
      <Spinner size="lg" label={label} />
    </div>
  );
}

export default FullPageLoader;
