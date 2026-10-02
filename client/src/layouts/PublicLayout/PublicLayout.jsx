import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button/Button.jsx';
import Logo from '../../components/brand/Logo/Logo.jsx';
import { useAuth } from '../../auth/useAuth.js';
import { getRoleHomePath } from '../../auth/roles.js';
import styles from './PublicLayout.module.scss';

const CONTACT = {
  phone: '+234 901 941 4880',
  email: 'sultanmagnateconsultinglimited@gmail.com',
  address: 'No. 1 Alberka Building, Hassan Kastina Road, Zone 8, Lokoja, Kogi State',
};

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/training-programs', label: 'Training' },
  { to: '/blog', label: 'Blog' },
  { to: '/events', label: 'Events' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

const FOOTER_SECTIONS = [
  {
    title: 'Platform',
    links: [
      { to: '/services', label: 'Services' },
      { to: '/training-programs', label: 'Training programs' },
      { to: '/register', label: 'Join the talent pool' },
      { to: '/register', label: 'Hire talent' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/blog', label: 'Blog' },
      { to: '/events', label: 'Events' },
      { to: '/gallery', label: 'Gallery' },
      { to: '/testimonials', label: 'Testimonials' },
    ],
  },
  {
    title: 'Support',
    links: [
      { to: '/faq', label: 'FAQ' },
      { to: '/contact', label: 'Contact us' },
      { to: '/login', label: 'Sign in' },
    ],
  },
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
          <Link to="/" className={styles.brand} onClick={closeMenu} aria-label="Sultan Magnate Consulting home">
            <Logo variant="lockup" tone="light" size={34} />
          </Link>

          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            <span className={styles.menuToggleLabel}>{isMenuOpen ? 'Close' : 'Menu'}</span>
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
                <Button to={getRoleHomePath(user.role)} size="sm" className={styles.navCta} onClick={closeMenu}>
                  My dashboard
                </Button>
              ) : (
                <>
                  <Button
                    to="/login"
                    state={{ from: location }}
                    variant="ghost"
                    size="sm"
                    className={styles.navSignIn}
                    onClick={closeMenu}
                  >
                    Sign in
                  </Button>
                  <Button to="/register" size="sm" className={styles.navCta} onClick={closeMenu}>
                    Join the talent pool
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
          <div className={styles.footerBrandCol}>
            <Link to="/" className={styles.footerBrand} aria-label="Sultan Magnate Consulting home">
              <Logo variant="lockup" tone="light" size={46} tagline />
            </Link>
            <p className={styles.footerBlurb}>
              Sultan Magnate Consulting trains job-ready
              talent and connects them with employers &mdash; protecting candidate identity until a
              placement is agreed.
            </p>
            <ul className={styles.footerContact}>
              <li>{CONTACT.address}</li>
              <li>
                <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
            </ul>
          </div>

          <nav className={styles.footerNav} aria-label="Footer">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className={styles.footerGroup}>
                <h2 className={styles.footerGroupTitle}>{section.title}</h2>
                <ul className={styles.footerLinks}>
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.label}`}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.footerBar}>
          <div className={styles.footerBarInner}>
            <p>
              &copy; {new Date().getFullYear()} Sultan Magnate Consulting Limited &nbsp;&middot;&nbsp;
              RC B292964. All rights reserved.
            </p>
            <ul className={styles.footerBarLinks}>
              <li>
                <Link to="/faq">Privacy</Link>
              </li>
              <li>
                <Link to="/faq">Terms</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}

export default PublicLayout;
