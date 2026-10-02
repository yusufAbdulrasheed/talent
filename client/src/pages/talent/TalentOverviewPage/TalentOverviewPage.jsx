import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FileCheck2,
  GraduationCap,
  Headset,
  Mail,
  PiggyBank,
  Rocket,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import Card from '../../../components/ui/Card/Card.jsx';
import DashboardHero from '../../../components/dashboard/DashboardHero/DashboardHero.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getMyProfile } from '../../../api/endpoints/talent.js';
import { getMySavings } from '../../../api/endpoints/savings.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { useAuth } from '../../../auth/useAuth.js';
import {
  CANDIDATE_STATUSES,
  getCandidateStatusDetails,
} from '../../../constants/candidateStatus.js';
import { PHOTOS, photoUrl } from '../../../constants/photos.js';
import { formatCurrency } from '../../../utils/format.js';
import styles from './TalentOverviewPage.module.scss';

const ACTION_CARDS = [
  {
    to: '/talent/profile',
    title: 'Your profile',
    body: 'Tell us about your education, experience and skills.',
    icon: UserRound,
    image: photoUrl(PHOTOS.womanOfficeGlasses, 420),
  },
  {
    to: '/talent/savings',
    title: 'Grow your savings',
    body: 'A share of your salary, set aside safely every month.',
    icon: PiggyBank,
    image: photoUrl(PHOTOS.manBlueSuit, 420),
  },
  {
    to: '/contact',
    title: 'Get support',
    body: 'Questions about your application? Our team is here to help.',
    icon: Headset,
    image: photoUrl(PHOTOS.womanSmilingWhite, 420),
  },
];

const BENEFITS = [
  { icon: GraduationCap, title: 'Get trained', body: 'Build in-demand skills' },
  { icon: ShieldCheck, title: 'Get verified', body: 'Gain credibility' },
  { icon: Users, title: 'Join the talent pool', body: 'Be discovered by top employers' },
  { icon: Rocket, title: 'Build your future', body: 'More opportunities. A brighter you.' },
];

/**
 * The journey from sign-up to the talent pool, derived entirely from real
 * account state. `action` is offered only on the first outstanding step.
 */
function buildSteps(candidate, isEmailVerified) {
  const isApproved = candidate.status === CANDIDATE_STATUSES.APPROVED;
  const isSubmitted = candidate.status !== CANDIDATE_STATUSES.DRAFT;

  return [
    {
      key: 'account',
      label: 'Account created',
      isDone: true,
      icon: UserRoundCheck,
    },
    {
      key: 'email',
      label: 'Email verification',
      isDone: isEmailVerified,
      icon: Mail,
      next: {
        title: 'Verify your email',
        body: 'Confirm the address on your account so we can reach you about opportunities.',
        action: { to: '/verify-email', label: 'Verify email' },
      },
    },
    {
      key: 'profile',
      label: 'Complete profile',
      isDone: candidate.isProfileComplete && candidate.hasRequiredDocuments,
      icon: FileCheck2,
      next: {
        title: 'Complete your profile',
        body: 'Add your personal details, professional background and required documents.',
        action: { to: '/talent/profile', label: 'Complete profile' },
      },
    },
    {
      key: 'review',
      label: 'Verification review',
      isDone: isApproved,
      icon: ShieldCheck,
      next: {
        title: isSubmitted ? 'Your application is under review' : 'Submit for review',
        body: isSubmitted
          ? 'Our team is reviewing your profile and documents. We will email you once a decision is made.'
          : 'Once your profile and documents are complete, our team will review your application.',
        action: null,
      },
    },
    {
      key: 'pool',
      label: 'Talent pool',
      isDone: isApproved,
      icon: Users,
    },
  ];
}

function Journey({ candidate, isEmailVerified }) {
  const status = getCandidateStatusDetails(candidate.status);
  const steps = buildSteps(candidate, isEmailVerified);
  const doneCount = steps.filter((step) => step.isDone).length;
  const progress = Math.round((doneCount / steps.length) * 100);
  const nextStep = steps.find((step) => !step.isDone);

  return (
    <section className={styles.journeyCard} aria-labelledby="journey-title">
      <div className={styles.journeyMain}>
        <header className={styles.journeyHeader}>
          <span className={styles.journeyHeaderIcon} aria-hidden="true">
            <Users size={22} />
          </span>
          <div className={styles.journeyHeading}>
            <h2 id="journey-title" className={styles.journeyTitle}>
              Your journey to the Talent Pool
            </h2>
            <p className={styles.journeyMeta}>
              Reference <span className={styles.reference}>{candidate.referenceNumber}</span>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </p>
          </div>
        </header>

        <div className={styles.progressRow}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Journey progress"
          >
            <span className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressValue}>{progress}%</span>
        </div>

        <ol className={styles.steps}>
          {steps.map((step) => {
            const StepIcon = step.icon;
            const state = step.isDone ? 'done' : step === nextStep ? 'current' : 'locked';

            return (
              <li key={step.key} className={`${styles.step} ${styles[`step_${state}`]}`}>
                <span className={styles.stepMarker} aria-hidden="true">
                  {step.isDone ? <Check size={18} strokeWidth={3} /> : <StepIcon size={18} />}
                </span>
                <span className={styles.stepLabel}>
                  {step.label}
                  <span className={styles.srOnly}>
                    {state === 'done' ? ' (done)' : state === 'current' ? ' (current step)' : ' (upcoming)'}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <aside className={styles.nextPanel}>
        {nextStep?.next ? (
          <>
            <span className={styles.nextIcon} aria-hidden="true">
              <nextStep.icon size={18} />
            </span>
            <p className={styles.nextEyebrow}>Next action</p>
            <h3 className={styles.nextTitle}>{nextStep.next.title}</h3>
            <p className={styles.nextBody}>{nextStep.next.body}</p>
            {nextStep.next.action ? (
              <Button to={nextStep.next.action.to} className={styles.nextButton}>
                {nextStep.next.action.label}
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <span className={`${styles.nextIcon} ${styles.nextIconSuccess}`} aria-hidden="true">
              <BadgeCheck size={18} />
            </span>
            <p className={styles.nextEyebrow}>All steps complete</p>
            <h3 className={styles.nextTitle}>You&rsquo;re in the talent pool</h3>
            <p className={styles.nextBody}>
              Recruiters can now discover your anonymous profile. Keep your details up to date.
            </p>
            <Button to="/talent/profile" variant="secondary" className={styles.nextButton}>
              Review profile
            </Button>
          </>
        )}
      </aside>
    </section>
  );
}

function ActionCards() {
  return (
    <ul className={styles.actionGrid}>
      {ACTION_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <li key={card.to}>
            <Link to={card.to} className={styles.actionCard}>
              <div className={styles.actionCopy}>
                <span className={styles.actionIcon} aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3 className={styles.actionTitle}>{card.title}</h3>
                <p className={styles.actionBody}>{card.body}</p>
                <span className={styles.actionArrow} aria-hidden="true">
                  <ArrowRight size={16} />
                </span>
              </div>
              <img className={styles.actionImage} src={card.image} alt="" loading="lazy" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function VisibilityBanner({ isApproved }) {
  return (
    <section className={styles.banner}>
      <span className={styles.bannerIcon} aria-hidden="true">
        <ShieldCheck size={28} />
      </span>
      <div className={styles.bannerCopy}>
        <h2 className={styles.bannerTitle}>
          {isApproved ? 'Your profile is live in the talent pool.' : 'Your profile isn’t visible to employers yet.'}
        </h2>
        <p className={styles.bannerBody}>
          {isApproved
            ? 'Recruiters can find you by skill and location. Your name and contact details stay private until a placement is agreed.'
            : 'Complete the required steps and our team will review your profile before you join the verified talent pool.'}
        </p>
      </div>
      <p className={styles.bannerScript} aria-hidden="true">
        You&rsquo;re on the right path!
      </p>
    </section>
  );
}

function SavingsSummaryCard() {
  const savingsQuery = useQuery({ queryKey: queryKeys.talent.savings, queryFn: getMySavings });

  if (savingsQuery.isLoading || savingsQuery.isError || !savingsQuery.data) {
    return null;
  }

  const savings = savingsQuery.data;

  if (savings.status === 'not_started') {
    return null;
  }

  return (
    <Card
      title="Savings"
      description="A share of your salary, set aside every month."
      actions={
        <StatusBadge tone={savings.status === 'active' ? 'success' : 'warning'}>
          {savings.status === 'active' ? 'Active' : 'Discontinued'}
        </StatusBadge>
      }
    >
      <div className={styles.savingsRow}>
        <p className={styles.savingsBalance}>{formatCurrency(savings.balance)}</p>
        <Link className={styles.savingsLink} to="/talent/savings">
          View savings
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}

function TalentOverviewPage() {
  const { user } = useAuth();
  const profileQuery = useQuery({
    queryKey: queryKeys.talent.profile,
    queryFn: getMyProfile,
  });
  const candidateData = profileQuery.data;
  const heroStatus = candidateData ? getCandidateStatusDetails(candidateData.status) : null;

  return (
    <>
      <DashboardHero
        eyebrow="Talent console"
        greeting="Welcome back,"
        name={user.firstName}
        subtitle={
          heroStatus
            ? heroStatus.description
            : 'Track your application from registration through to the talent pool.'
        }
        photo="/illustrations/hero-talent.png"
        script="Great things start with your next step."
      >
        <Button to="/talent/profile">
          Update my profile
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
        <Button to="/talent/savings" variant="secondary">
          <PiggyBank size={16} aria-hidden="true" />
          My savings
        </Button>
      </DashboardHero>

      <QueryBoundary query={profileQuery} loadingLabel="Loading your application">
        {(candidate) => {
          const isApproved = candidate.status === CANDIDATE_STATUSES.APPROVED;

          return (
            <>
              <Journey candidate={candidate} isEmailVerified={user.isEmailVerified} />

              {candidate.status === CANDIDATE_STATUSES.REJECTED && candidate.adminReview?.note ? (
                <Alert variant="error" title="Reviewer note">
                  {candidate.adminReview.note}
                </Alert>
              ) : null}

              <ActionCards />

              {isApproved ? <SavingsSummaryCard /> : null}

              <VisibilityBanner isApproved={isApproved} />

              <ul className={styles.benefits}>
                {BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li key={benefit.title} className={styles.benefit}>
                      <Icon size={24} className={styles.benefitIcon} aria-hidden="true" />
                      <div>
                        <p className={styles.benefitTitle}>{benefit.title}</p>
                        <p className={styles.benefitBody}>{benefit.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}

export default TalentOverviewPage;
