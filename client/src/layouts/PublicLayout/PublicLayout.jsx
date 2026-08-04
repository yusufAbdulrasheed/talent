import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button/Button.jsx';
import { useAuth } from '../../auth/useAuth.js';
import { getRoleHomePath } from '../../auth/roles.js';
import styles from './PublicLayout.module.scss';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/training-programs', label: 'Training' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/events', label: 'Events' },
  { to: '/testimonials', label: 'Testimonials' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

function PublicLayout() {
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand} onClick={closeMenu}>
            TMS
          </Link>

          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>

          <nav
            id="primary-navigation"
            aria-label="Primary"
            className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}
          >
            <ul className={styles.navList}>
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={closeMenu}
                    className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className={styles.actions}>
              {isAuthenticated ? (
                <Button to={getRoleHomePath(user.role)} size="sm" onClick={closeMenu}>
                  My dashboard
                </Button>
              ) : (
                <>
                  <Button
                    to="/login"
                    state={{ from: location }}
                    variant="ghost"
                    size="sm"
                    onClick={closeMenu}
                  >
                    Sign in
                  </Button>
                  <Button to="/register" size="sm" onClick={closeMenu}>
                    Register
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>&copy; {new Date().getFullYear()} Talent Recruitment &amp; Training Management System.</p>
          <nav aria-label="Footer">
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/training-programs">Training programs</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </>
  );
}

export default PublicLayout;
