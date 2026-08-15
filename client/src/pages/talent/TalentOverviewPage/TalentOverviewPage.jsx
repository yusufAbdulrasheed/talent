import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getMyProfile } from '../../../api/endpoints/talent.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { useAuth } from '../../../auth/useAuth.js';
import {
  CANDIDATE_STATUSES,
  getCandidateStatusDetails,
} from '../../../constants/candidateStatus.js';
import styles from './TalentOverviewPage.module.scss';

const PAID_STATUSES = [
  CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
];

function buildSteps(candidate, isEmailVerified) {
  const hasPaid = PAID_STATUSES.includes(candidate.status);

  return [
    {
      title: 'Verify your email address',
      description: 'Confirm the address on your account so we can contact you.',
      isDone: isEmailVerified,
      action: { to: '/verify-email', label: 'Verify email' },
    },
    {
      title: 'Complete your profile',
      description: 'Add your personal and professional details.',
      isDone: candidate.isProfileComplete,
      action: { to: '/talent/profile', label: 'Complete profile' },
    },
    {
      title: 'Upload your documents',
      description: 'Passport photograph, resume, certificates, and national ID.',
      isDone: candidate.documents.length > 0,
      action: { to: '/talent/documents', label: 'Upload documents' },
    },
    {
      title: 'Pay your training fee',
      description: 'Secure your place on the training programme.',
      isDone: hasPaid,
      action: { to: '/talent/payments', label: 'Make payment' },
    },
    {
      title: 'Approval and talent pool',
      description: 'Our team reviews your application and publishes approved talents.',
      isDone: candidate.status === CANDIDATE_STATUSES.APPROVED,
      action: null,
    },
  ];
}

function TalentOverviewPage() {
  const { user } = useAuth();
  const profileQuery = useQuery({
    queryKey: queryKeys.talent.profile,
    queryFn: getMyProfile,
  });

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.firstName}`}
        description="Track your application from registration through to the talent pool."
      />

      <QueryBoundary query={profileQuery} loadingLabel="Loading your application">
        {(candidate) => {
          const status = getCandidateStatusDetails(candidate.status);
          const steps = buildSteps(candidate, user.isEmailVerified);
          const nextStep = steps.find((step) => !step.isDone);

          return (
            <>
              <Card
                title="Application status"
                description={status.description}
                actions={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
              >
                <dl className={styles.summary}>
                  <div>
                    <dt>Candidate reference</dt>
                    <dd className={styles.reference}>{candidate.referenceNumber}</dd>
                  </div>
                  <div>
                    <dt>Profile</dt>
                    <dd>{candidate.isProfileComplete ? 'Complete' : 'Incomplete'}</dd>
                  </div>
                  <div>
                    <dt>Documents uploaded</dt>
                    <dd>{candidate.documents.length}</dd>
                  </div>
                </dl>

                {candidate.status === CANDIDATE_STATUSES.REJECTED && candidate.adminReview?.note ? (
                  <Alert variant="error" title="Reviewer note">
                    {candidate.adminReview.note}
                  </Alert>
                ) : null}
              </Card>

              <Card
                title="Your next steps"
                description={
                  nextStep
                    ? `Next: ${nextStep.title.toLowerCase()}.`
                    : 'Every step is complete. Nothing is outstanding.'
                }
              >
                <ol className={styles.steps}>
                  {steps.map((step) => (
                    <li
                      key={step.title}
                      className={`${styles.step} ${step.isDone ? styles.stepDone : ''}`}
                    >
                      <span className={styles.marker} aria-hidden="true">
                        {step.isDone ? '✓' : ''}
                      </span>
                      <div className={styles.stepBody}>
                        <p className={styles.stepTitle}>
                          {step.title}
                          <span className={styles.stepState}>
                            {step.isDone ? 'Done' : 'Outstanding'}
                          </span>
                        </p>
                        <p className={styles.stepDescription}>{step.description}</p>
                      </div>
                      {!step.isDone && step.action ? (
                        <Button to={step.action.to} size="sm" variant="secondary">
                          {step.action.label}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </Card>

              <p className={styles.footnote}>
                Questions about your application? <Link to="/contact">Contact our team</Link>.
              </p>
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}

export default TalentOverviewPage;
