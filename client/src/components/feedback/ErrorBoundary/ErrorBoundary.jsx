import { Component } from 'react';
import styles from './ErrorBoundary.module.scss';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className={styles.wrapper} role="alert">
        <h1>Something went wrong</h1>
        <p className={styles.body}>The page failed to load. Reloading usually fixes it.</p>
        <button type="button" className={styles.action} onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
