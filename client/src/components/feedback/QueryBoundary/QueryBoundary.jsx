import Alert from '../Alert/Alert.jsx';
import Button from '../../ui/Button/Button.jsx';
import Spinner from '../../ui/Spinner/Spinner.jsx';
import { getErrorMessage } from '../../../api/http.js';
import styles from './QueryBoundary.module.scss';

/**
 * Renders the loading and failure states of a TanStack Query result so pages
 * only have to describe the success case.
 */
function QueryBoundary({ query, loadingLabel = 'Loading', children }) {
  if (query.isPending) {
    return (
      <div className={styles.loading}>
        <Spinner label={loadingLabel} />
        <p>{loadingLabel}…</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className={styles.error}>
        <Alert variant="error">{getErrorMessage(query.error)}</Alert>
        <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return children(query.data);
}

export default QueryBoundary;
