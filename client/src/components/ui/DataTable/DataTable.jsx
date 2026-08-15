import styles from './DataTable.module.scss';

/**
 * Generic table.
 *
 * @param {Array} columns  [{ key, header, render?, align? }]
 * @param {Array} rows
 * @param {(row) => string} getRowKey
 * @param {string} caption  Describes the table for screen readers.
 */
function DataTable({ columns, rows, getRowKey, caption }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.align === 'right' ? styles.right : ''}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === 'right' ? styles.right : ''}>
                  {column.render ? column.render(row) : (row[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
