import Button from '../Button/Button.jsx';
import styles from './Pagination.module.scss';

function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </Button>

      <p className={styles.status} aria-live="polite">
        Page {page} of {totalPages}
        {typeof total === 'number' ? ` · ${total} result${total === 1 ? '' : 's'}` : ''}
      </p>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </nav>
  );
}

export default Pagination;
