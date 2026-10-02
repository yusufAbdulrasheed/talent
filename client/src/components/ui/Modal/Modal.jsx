import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.scss';

/**
 * Accessible modal built on the native <dialog>: the browser handles focus
 * trapping, the Escape key and the inert backdrop. `onClose` fires for Escape,
 * the close button and a click on the backdrop.
 */
function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    // jsdom (tests) has no showModal; the dialog simply stays closed there.
    if (!dialog || typeof dialog.showModal !== 'function') return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${styles[size]}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the ::backdrop targets the dialog element itself.
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {isOpen ? (
        <div className={styles.panel}>
          <header className={styles.header}>
            <div>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              ) : null}
            </div>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.body}>{children}</div>
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}

export default Modal;
