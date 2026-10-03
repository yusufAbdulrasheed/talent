import { BadgeCheck, Compass, HeartHandshake, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS, photoUrl } from '../../../constants/photos.js';
import PhotoPanel from '../../../components/public/PhotoPanel/PhotoPanel.jsx';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import PublicCTA from '../../../components/public/PublicCTA/PublicCTA.jsx';
import InfoCard from '../../../components/public/InfoCard/InfoCard.jsx';
import styles from './AboutPage.module.scss';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Protect candidates',
    body: 'Identities stay private until a placement is agreed, so people can look for work without risk.',
  },
  {
    icon: Target,
    title: 'Train for real roles',
    body: 'Programmes are built around what employers actually hire for, not a generic syllabus.',
  },
  {
    icon: HeartHandshake,
    title: 'Be straight with everyone',
    body: 'Clear fees, honest feedback, and a review process candidates and recruiters can follow.',
  },
  {
    icon: Compass,
    title: 'Stay useful',
    body: 'Every feature earns its place by making hiring or training measurably easier.',
  },
];

const STATS = [
  { value: '2,400+', label: 'Verified talents' },
  { value: '180+', label: 'Hiring partners' },
  { value: '30+', label: 'Training programmes' },
  { value: '95%', label: 'Placement rate' },
];

const COMMUNITY = [
  PHOTOS.womanYellowBlazer,
  PHOTOS.manTraditionalCap,
  PHOTOS.womanLaughing,
  PHOTOS.manBlackSweater,
  PHOTOS.womanBraidsConfident,
];

function AboutPage() {
  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.conferenceTable, accent: PHOTOS.womanAfricanPrint }}
        script="Real people. Real impact."
        eyebrow="About us"
        title="We connect trained talent with the employers who need them"
        lead="Sultan Magnate Consulting is a talent training and recruitment firm. We prepare candidates for real roles, verify their work, and give employers a fast, fair way to hire — without exposing anyone's identity before it matters."
      />

      <PublicSection
        eyebrow="Our story"
        title="Built around a simple frustration"
        lead="Good candidates were being overlooked, and employers were wading through unvetted applications. We built a single pipeline that fixes both ends."
      >
        <div className={styles.split}>
          <div className={styles.prose}>
            <p>
              Talents join a structured programme, complete assessments, and are reviewed by a
              trainer and an administrator before they ever appear in a search result. By the time a
              recruiter sees a profile, the work behind it has already been checked.
            </p>
            <p>
              Recruiters search anonymised profiles by skill, location, and certification, then submit
              a placement request. Names and contact details are only shared once both sides agree to
              move forward — so candidates stay in control of their search.
            </p>
          </div>
          <PhotoPanel photo={PHOTOS.meetingTwoWomen} ratio="4 / 3" caption="Every profile reviewed by our team" icon={BadgeCheck} />
        </div>
      </PublicSection>

      <PublicSection tone="raised" eyebrow="What we value" title="Principles we build on">
        <div className={styles.grid}>
          {VALUES.map((value) => (
            <InfoCard key={value.title} icon={value.icon} title={value.title}>
              {value.body}
            </InfoCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="ink" align="center" eyebrow="By the numbers" title="Where things stand today">
        <dl className={styles.stats}>
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </PublicSection>

      <PublicSection eyebrow="The team" title="A small team across recruitment, training, and product">
        <div className={styles.teamRow}>
          <span className={styles.teamIcon} aria-hidden="true">
            <Users size={22} />
          </span>
          <p>
            Recruitment leads, programme trainers, and engineers work from one roadmap. If you want
            to work with us or partner on a programme, the contact form reaches the whole team.
          </p>
        </div>
        <ul className={styles.community} aria-hidden="true">
          {COMMUNITY.map((id) => (
            <li key={id}>
              <img src={photoUrl(id, 400, 500)} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      </PublicSection>

      <PublicCTA
        title="Hiring, or looking to be hired?"
        lead="Join the verified talent pool or start a search today."
        primary={{ to: '/register', label: 'Get started' }}
        secondary={{ to: '/contact', label: 'Talk to us' }}
      />
    </>
  );
}

export default AboutPage;
