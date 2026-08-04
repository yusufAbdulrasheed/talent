import { Link } from 'react-router-dom';
import Spinner from '../Spinner/Spinner.jsx';
import styles from './Button.module.scss';

/**
 * Shared button. Renders a react-router <Link> when `to` is supplied,
 * an <a> for `href`, and a <button> otherwise.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  to,
  href,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? <Spinner size="sm" label="Working" /> : null}
      {children}
    </button>
  );
}

export default Button;
