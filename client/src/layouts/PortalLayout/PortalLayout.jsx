import { useEffect, useState } from 'react';
import { Bell, ChevronRight, Headset, LogOut, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Alert from '../../components/feedback/Alert/Alert.jsx';
import Logo, { LogoMark } from '../../components/brand/Logo/Logo.jsx';
import { useAuth } from '../../auth/useAuth.js';
import { getPortalNavigation, PORTAL_SEARCH, PORTAL_SUBTITLE } from './portalNavigation.js';
import styles from './PortalLayout.module.scss';

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

const COLLAPSE_STORAGE_KEY = 'tms.portalSidebarCollapsed';

function readStoredCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function PortalLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(readStoredCollapsed);
  const links = getPortalNavigation(user.role);
  const search = PORTAL_SEARCH[user.role];

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(isCollapsed));
    } catch {
    }
  }, [isCollapsed]);

  useEffect(() => {
    document.documentElement.classList.add('portal-active');
    return () => document.documentElement.classList.remove('portal-active');
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/', { replace: true });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!search) return;
    const trimmed = searchValue.trim();
    navigate(trimmed ? `${search.to}?${search.param}=${encodeURIComponent(trimmed)}` : search.to);
  };

  return (
    <div
      className={`${styles.shell} ${isCollapsed ? styles.collapsed : ''}`}
      data-portal-role={user.role}
    >
      <a className={styles.skipLink} href="#portal-content">
        Skip to main content
      </a>

      <aside className={styles.sidebar} aria-label="Portal">
        <div className={styles.brandBlock}>
          <div className={styles.brandRow}>
            {isCollapsed ? (
              <LogoMark tone="light" size={32} title="Sultan Magnate Consulting" />
            ) : (
              <Logo variant="lockup" tone="light" size={38} tagline />
            )}
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={() => setIsCollapsed((previous) => !previous)}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
              <span className={styles.srOnly}>{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
            </button>
          </div>
          <p className={styles.brandSubtitle}>{PORTAL_SUBTITLE[user.role]}</p>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    title={isCollapsed ? link.label : undefined}
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                  >
                    {Icon ? <Icon size={19} className={styles.navIcon} aria-hidden="true" /> : null}
                    <span className={styles.navLabel}>{link.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <svg className={styles.sidebarWave} viewBox="0 0 264 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 96 C 70 40, 150 150, 264 60 L264 220 L0 220 Z" fill="url(#portal-wave-a)" />
          <path d="M0 150 C 90 90, 170 190, 264 120 L264 220 L0 220 Z" fill="url(#portal-wave-b)" />
          <defs>
            <linearGradient id="portal-wave-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3538f0" stopOpacity="0.35" />
              <stop offset="1" stopColor="#7b3cf5" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="portal-wave-b" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2a2fd0" stopOpacity="0.45" />
              <stop offset="1" stopColor="#141a70" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        <div className={styles.sidebarFooter}>
          <Link to="/contact" className={styles.supportLink} title={isCollapsed ? 'Help & Support' : undefined}>
            <span className={styles.supportIcon} aria-hidden="true">
              <Headset size={20} />
            </span>
            <span className={styles.supportText}>
              <strong>Help &amp; Support</strong>
              <span>We&rsquo;re here to help you</span>
            </span>
            <ChevronRight size={16} className={styles.supportArrow} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className={styles.footerLink}
            onClick={handleSignOut}
            disabled={isSigningOut}
            title={isCollapsed ? 'Sign out' : undefined}
          >
            <LogOut size={19} aria-hidden="true" />
            <span className={styles.navLabel}>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          {search ? (
            <form className={styles.search} role="search" onSubmit={handleSearchSubmit}>
              <Search size={17} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder={search.placeholder}
                aria-label={search.placeholder}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </form>
          ) : (
            <span />
          )}

          <div className={styles.topBarActions}>
            <span className={styles.iconButton} aria-hidden="true">
              <Bell size={20} />
            </span>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.avatar} title={user.fullName} aria-hidden="true">
              {getInitials(user.fullName)}
            </span>
            <div className={styles.identity}>
              <span className={styles.name}>{user.fullName}</span>
              <span className={styles.role}>{PORTAL_SUBTITLE[user.role]}</span>
            </div>
          </div>
        </header>

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
