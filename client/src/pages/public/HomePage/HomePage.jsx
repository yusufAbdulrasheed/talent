import Button from '../../../components/ui/Button/Button.jsx';
import styles from './HomePage.module.scss';

// Copy is placeholder until the client signs off on messaging and branding.
const AUDIENCES = [
  {
    title: 'For talents',
    body: 'Register, complete your profile, pay for training, and get added to a verified talent pool that employers search.',
    action: { to: '/register', label: 'Register as talent' },
  },
  {
    title: 'For recruiters',
    body: 'Search approved, anonymous candidate profiles by skill, location, and availability, then submit a placement request.',
    action: { to: '/register', label: 'Register as recruiter' },
  },
  {
    title: 'For trainers',
    body: 'See the programmes and batches assigned to you, your candidate counts, and announcements from the administrator.',
    action: { to: '/login', label: 'Trainer sign in' },
  },
];

function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1>Connecting trained talent with employers</h1>
          <p className={styles.lead}>
            A verified talent database that protects candidate identity until an employer requests placement.
          </p>
          <div className={styles.heroActions}>
            <Button to="/register" size="lg">
              Get started
            </Button>
            <Button to="/training-programs" variant="secondary" size="lg">
              Browse training programs
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.audiences} aria-labelledby="audiences-heading">
        <div className={styles.audiencesInner}>
          <h2 id="audiences-heading">How it works</h2>
          <ul className={styles.cards}>
            {AUDIENCES.map((audience) => (
              <li key={audience.title} className={styles.card}>
                <h3>{audience.title}</h3>
                <p>{audience.body}</p>
                <Button to={audience.action.to} variant="ghost" size="sm">
                  {audience.action.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export default HomePage;
