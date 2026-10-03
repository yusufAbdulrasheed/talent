import styles from './TagList.module.scss';

function TagList({ items, emptyLabel = 'Not provided', label }) {
  if (!items || items.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }

  return (
    <ul className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item} className={styles.tag}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default TagList;
