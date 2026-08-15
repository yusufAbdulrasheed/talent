import { useId } from 'react';
import styles from './SelectField.module.scss';

function SelectField({ label, hint, error, options, placeholder, id, className = '', ...rest }) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      <select
        id={fieldId}
        className={`${styles.select} ${error ? styles.selectError : ''}`}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default SelectField;
