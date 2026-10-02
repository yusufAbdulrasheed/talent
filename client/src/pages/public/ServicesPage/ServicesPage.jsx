import {
  BriefcaseBusiness,
  ClipboardCheck,
  EyeOff,
  GraduationCap,
  LineChart,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS } from '../../../constants/photos.js';
import PhotoPanel from '../../../components/public/PhotoPanel/PhotoPanel.jsx';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import PublicCTA from '../../../components/public/PublicCTA/PublicCTA.jsx';
import InfoCard from '../../../components/public/InfoCard/InfoCard.jsx';
import styles from './ServicesPage.module.scss';

// Copy is placeholder until the client signs off on messaging.
const SERVICES = [
  {
    icon: GraduationCap,
    title: 'Structured training',
    body: 'Cohort-based programmes with assigned trainers, real projects, and assessments that gate the talent pool.',
  },
  {
    icon: UserCheck,
    title: 'Candidate verification',
    body: 'Every profile is reviewed by a trainer and an administrator before it is published to recruiters.',
  },
  {
    icon: Search,
    title: 'Anonymised talent search',
    body: 'Recruiters filter by skill, location, and certification without seeing identities up front.',
  },
  {
    icon: ClipboardCheck,
    title: 'Placement management',
    body: 'Submit a request, track its status, and get notified at every step until the role is filled.',
  },
  {
    icon: EyeOff,
    title: 'Identity protection',
    body: 'Names and contact details are only exchanged once both sides agree to proceed.',
  },
  {
    icon: LineChart,
    title: 'Hiring insight',
    body: 'See candidate availability and demand trends so you can plan cohorts and searches ahead of time.',
  },
];

const STEPS = [
  { title: 'Register', body: 'Talents and recruiters create an account and complete their profile.' },
  { title: 'Train or search', body: 'Talents complete a programme; recruiters browse the anonymised pool.' },
  { title: 'Request', body: 'Recruiters submit a placement request for a shortlisted candidate.' },
  { title: 'Place', body: 'Details are shared, the role is filled, and both sides confirm the outcome.' },
];

const AUDIENCES = [
  {
    icon: Users,
    title: 'For employers',
    body: 'Hire from a pool of trained, verified candidates and cut screening time to a fraction.',
    to: '/register',
    linkLabel: 'Register as a recruiter',
  },
  {
    icon: BriefcaseBusiness,
    title: 'For candidates',
    body: 'Get job-ready through a structured programme, then be found by employers who are hiring now.',
    to: '/register',
    linkLabel: 'Register as talent',
  },
];

function ServicesPage() {
  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.handshake, accent: PHOTOS.womanYellowBlazer }}
        script="Train. Verify. Hire."
        eyebrow="Services"
        title="Everything needed to train talent and fill roles"
        lead="One platform covering the full path from training through to a confirmed placement — for candidates, recruiters, and the trainers who prepare them."
      />

      <PublicSection eyebrow="What we offer" title="Services at a glance">
        <div className={styles.grid}>
          {SERVICES.map((service) => (
            <InfoCard key={service.title} icon={service.icon} title={service.title}>
              {service.body}
            </InfoCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="raised" eyebrow="How it works" title="Four steps from sign-up to placement">
        <div className={styles.split}>
          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <PhotoPanel photo={PHOTOS.laptopMeeting} caption="From sign-up to a confirmed placement" icon={UserCheck} />
        </div>
      </PublicSection>

      <PublicSection eyebrow="Who it's for" title="Built for both sides of the hire">
        <div className={styles.audienceGrid}>
          {AUDIENCES.map((audience) => (
            <InfoCard
              key={audience.title}
              icon={audience.icon}
              title={audience.title}
              to={audience.to}
              linkLabel={audience.linkLabel}
            >
              {audience.body}
            </InfoCard>
          ))}
        </div>
      </PublicSection>

      <PublicCTA
        title="See how it fits your hiring"
        lead="Tell us what you're hiring for and we'll walk you through the pool."
        primary={{ to: '/contact', label: 'Book a walkthrough' }}
        secondary={{ to: '/training-programs', label: 'Browse training' }}
      />
    </>
  );
}

export default ServicesPage;
