import styles from './Logo.module.scss';

/**
 * Sultan Magnate Consulting logo.
 *
 * The mark is a vector trace of the official logo: two interlocking angular
 * brackets forming an "S", split by a diagonal bar. If an official vector file
 * is supplied later, replace the three path strings below — nothing else changes.
 *
 *   <Logo />                              the mark on its own (32px)
 *   <Logo variant="lockup" />             mark + stacked SULTAN / MAGNATE / CONSULTING
 *   <Logo variant="lockup" tagline />     … plus "Building Systems. Sustaining Legacies."
 *   <Logo tone="light" />                 white mark, for navy / blue backgrounds
 */
const MARK_VIEWBOX = '0 0 380 385';
const MARK_TOP = 'M75 65 L190 0 L340 85 L340 160 L300 185 L247 155 L293 128 L293 118 L190 62 L130 95 Z';
const MARK_BAR = 'M45 79 L380 275 L335 305 L0 109 Z';
const MARK_BOTTOM = 'M305 320 L190 385 L40 300 L40 225 L80 200 L133 230 L87 257 L87 267 L190 323 L250 290 Z';

const TONES = {
  color: 'url(#sm-logo-gradient)',
  light: '#ffffff',
  dark: '#0c1552',
};

export function LogoMark({ tone = 'color', size = 32, title, className }) {
  const fill = TONES[tone] ?? TONES.color;

  return (
    <svg
      className={className}
      viewBox={MARK_VIEWBOX}
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {tone === 'color' ? (
        <defs>
          <linearGradient id="sm-logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b3ff5" />
            <stop offset="1" stopColor="#1a1d8a" />
          </linearGradient>
        </defs>
      ) : null}
      <path d={MARK_TOP} fill={fill} />
      <path d={MARK_BAR} fill={fill} />
      <path d={MARK_BOTTOM} fill={fill} />
    </svg>
  );
}

function Logo({ variant = 'mark', tone = 'color', size = 32, tagline = false, className = '' }) {
  if (variant === 'mark') {
    return <LogoMark tone={tone} size={size} title="Sultan Magnate Consulting" className={className} />;
  }

  const toneClass = tone === 'light' ? styles.light : styles.dark;

  return (
    <span className={`${styles.logo} ${toneClass} ${className}`} style={{ '--logo-size': `${size}px` }}>
      <span className={styles.lockup}>
        <LogoMark tone={tone} size={size} />
        <span className={styles.wordmark} aria-label="Sultan Magnate Consulting">
          <span aria-hidden="true">Sultan</span>
          <span aria-hidden="true">Magnate</span>
          <span aria-hidden="true">Consulting</span>
        </span>
      </span>
      {tagline ? <span className={styles.tagline}>Building Systems. Sustaining Legacies.</span> : null}
    </span>
  );
}

export default Logo;
