import styles from './Logo.module.scss';

// Geometry traced from the supplied brand artwork (point-symmetric navy frame + gold bar).
const MARK_VIEWBOX = '0 0 158.3 186';
const MARK_ASPECT = 158.3 / 186; // width / height
const MARK_TOP =
  'M71.5 0 L139.3 39.3 L139.3 77 L118.5 90 L94 75.5 L120 58.5 L71.5 30 L44.8 47 L19.5 32.5 Z';
const MARK_BOTTOM =
  'M71.5 186 L3.7 146.7 L3.7 109 L24.5 96 L49 110.5 L23 127.5 L71.5 156 L98.2 139 L123.5 153.5 Z';
const MARK_BAR = 'M0 37.5 L158.3 129 L134.3 144.5 L0 66.8 Z';

const TONES = {
  color: { frame: '#191874', bar: '#d8ab41' },
  light: { frame: '#ffffff', bar: '#d8ab41' },
  dark: { frame: '#0c1552', bar: '#0c1552' },
};

// `size` is the height of the mark in px; the width follows the artwork's proportions.
export function LogoMark({ tone = 'color', size = 32, title, className }) {
  const { frame, bar } = TONES[tone] ?? TONES.color;

  return (
    <svg
      className={className}
      viewBox={MARK_VIEWBOX}
      width={size * MARK_ASPECT}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d={MARK_TOP} fill={frame} />
      <path d={MARK_BOTTOM} fill={frame} />
      <path d={MARK_BAR} fill={bar} />
    </svg>
  );
}

function Logo({ variant = 'mark', tone = 'color', size = 32, tagline = false, className = '' }) {
  if (variant === 'mark') {
    return <LogoMark tone={tone} size={size} title="Sultan Magnate Consulting" className={className} />;
  }

  const toneClass = styles[tone] ?? styles.color;

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
      {tagline ? <span className={styles.tagline}>Building Systems. Sustaining Legacies</span> : null}
    </span>
  );
}

export default Logo;