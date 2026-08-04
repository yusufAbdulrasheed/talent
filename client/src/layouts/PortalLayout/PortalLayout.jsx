import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button/Button.jsx';
import Alert from '../../components/feedback/Alert/Alert.jsx';
import { useAuth } from '../../auth/useAuth.js';
import { ROLE_LABELS } from '../../auth/roles.js';
import { getPortalNavigation } from './portalNavigation.js';
import styles from './PortalLayout.module.scss';

function PortalLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const links = getPortalNavigation(user.role);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#portal-content">
        Skip to main content
      </a>

      <header className={styles.topBar}>
        <Link to="/" className={styles.brand}>
          TMS
        </Link>
        <div className={styles.identity}>
          <span className={styles.role}>{ROLE_LABELS[user.role]}</span>
          <span className={styles.name}>{user.fullName}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleSignOut} isLoading={isSigningOut}>
          Sign out
        </Button>
      </header>

      <div className={styles.body}>
        <nav className={styles.sidebar} aria-label="Portal">
          <ul className={styles.navList}>
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main id="portal-content" className={styles.content}>
          {user.isEmailVerified ? null : (
            <Alert variant="warning" title="Verify your email address">
              Some actions stay locked until you confirm the address on your account.
            </Alert>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PortalLayout;
