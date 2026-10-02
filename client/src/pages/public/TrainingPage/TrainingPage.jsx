import {
  Award,
  CalendarClock,
  CheckCircle2,
  Code2,
  Layers,
  LifeBuoy,
  Presentation,
  UsersRound,
} from 'lucide-react';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS, photoUrl } from '../../../constants/photos.js';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import PublicCTA from '../../../components/public/PublicCTA/PublicCTA.jsx';
import InfoCard from '../../../components/public/InfoCard/InfoCard.jsx';
import PhotoPanel from '../../../components/public/PhotoPanel/PhotoPanel.jsx';
import styles from './TrainingPage.module.scss';

// Copy is placeholder until programme details are confirmed with the client.
const PROGRAMMES = [
  {
    icon: Code2,
    title: 'Software Engineering',
    body: 'Frontend and backend fundamentals, version control, testing, and a capstone project.',
    meta: '12 weeks · Cohort',
    photo: PHOTOS.techPairServerRoom,
  },
  {
    icon: Layers,
    title: 'Data & Analytics',
    body: 'SQL, spreadsheets to dashboards, and turning messy data into decisions.',
    meta: '10 weeks · Cohort',
    photo: PHOTOS.studyGroupLaptops,
  },
  {
    icon: Presentation,
    title: 'Product & Delivery',
    body: 'Discovery, roadmaps, and running delivery for a small team.',
    meta: '8 weeks · Part-time',
    photo: PHOTOS.teamMeeting,
  },
];

const INCLUDED = [
  { icon: UsersRound, title: 'Assigned trainer', body: 'A trainer runs your batch, tracks progress, and posts announcements.' },
  { icon: Code2, title: 'Real projects', body: 'You build and ship work that goes into your anonymised profile.' },
  { icon: CalendarClock, title: 'Structured schedule', body: 'Weekly milestones and assessments keep the cohort moving together.' },
  { icon: LifeBuoy, title: 'Review & feedback', body: 'A trainer and an administrator review your work before you enter the pool.' },
];

const OUTCOMES = [
  'A verified, anonymised profile visible to hiring partners',
  'A portfolio project reviewed by a trainer',
  'A place in the talent pool that recruiters actively search',
  'Notifications the moment a recruiter requests your placement',
];

function TrainingPage() {
  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.womanCoding, accent: PHOTOS.manPlaidShirt }}
        script="Your next step starts here."
        eyebrow="Training programs"
        title="Get job-ready, then get found"
        lead="Cohort-based programmes with assigned trainers, real projects, and assessments. Finish, get verified, and join a talent pool that employers search every day."
      />

      <PublicSection eyebrow="Programmes" title="Choose a track">
        <div className={styles.grid}>
          {PROGRAMMES.map((programme) => (
            <article key={programme.title} className={styles.programme}>
              <img className={styles.programmePhoto} src={photoUrl(programme.photo, 640, 400)} alt="" loading="lazy" />
              <span className={styles.programmeIcon} aria-hidden="true">
                <programme.icon size={22} />
              </span>
              <h3>{programme.title}</h3>
              <p className={styles.programmeBody}>{programme.body}</p>
              <p className={styles.programmeMeta}>{programme.meta}</p>
            </article>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="raised" eyebrow="What's included" title="Every programme comes with">
        <div className={styles.grid}>
          {INCLUDED.map((item) => (
            <InfoCard key={item.title} icon={item.icon} title={item.title}>
              {item.body}
            </InfoCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection eyebrow="Outcomes" title="What you walk away with">
        <div className={styles.split}>
          <ul className={styles.outcomes}>
            {OUTCOMES.map((outcome) => (
              <li key={outcome}>
                <CheckCircle2 size={18} aria-hidden="true" />
                {outcome}
              </li>
            ))}
          </ul>
          <PhotoPanel photo={PHOTOS.womanOfficeGlasses} ratio="1 / 1" caption="Certificate on completion" icon={Award} />
        </div>
      </PublicSection>

      <PublicSection tone="ink" align="center" eyebrow="Enrolment" title="How to join">
        <div className={styles.enrol}>
          <p>
            Create an account, complete your profile and documents, and your place is confirmed
            once our team reviews and approves your application. Your trainer takes it from there.
          </p>
          <span className={styles.enrolBadge}>
            <Award size={16} aria-hidden="true" />
            Certificate on completion
          </span>
        </div>
      </PublicSection>

      <PublicCTA
        title="Ready to start training?"
        lead="Create your account and enrol in a cohort."
        primary={{ to: '/register', label: 'Register as talent' }}
        secondary={{ to: '/faq', label: 'Read the FAQ' }}
      />
    </>
  );
}

export default TrainingPage;
