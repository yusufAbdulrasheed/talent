import { useId } from 'react';
import styles from './TextareaField.module.scss';

function TextareaField({ label, hint, error, id, rows = 4, className = '', ...rest }) {
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
      <textarea
        id={fieldId}
        rows={rows}
        className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
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

export default TextareaField;
