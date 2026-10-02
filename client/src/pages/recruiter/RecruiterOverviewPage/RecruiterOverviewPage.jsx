import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Hash,
  Search,
  Send,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import Card from '../../../components/ui/Card/Card.jsx';
import DashboardHero from '../../../components/dashboard/DashboardHero/DashboardHero.jsx';
import StatCard from '../../../components/dashboard/StatCard/StatCard.jsx';
import PhotoPromoCard from '../../../components/dashboard/PhotoPromoCard/PhotoPromoCard.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { useAuth } from '../../../auth/useAuth.js';
import {
  getMyCompany,
  getRequestSummary,
  listPlacementRequests,
} from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  PLACEMENT_REQUEST_STATUS_DETAILS,
  PLACEMENT_REQUEST_STATUSES,
  getPlacementRequestStatusDetails,
} from '../../../constants/placementRequest.js';
import { PHOTOS } from '../../../constants/photos.js';
import { formatDate } from '../../../utils/format.js';
import styles from './RecruiterOverviewPage.module.scss';

const TRACKED_STATUSES = Object.keys(PLACEMENT_REQUEST_STATUS_DETAILS);

const STATUS_ICONS = {
  [PLACEMENT_REQUEST_STATUSES.SUBMITTED]: Send,
  [PLACEMENT_REQUEST_STATUSES.UNDER_REVIEW]: Search,
  [PLACEMENT_REQUEST_STATUSES.IN_PROGRESS]: Clock,
  [PLACEMENT_REQUEST_STATUSES.FULFILLED]: CheckCircle2,
  [PLACEMENT_REQUEST_STATUSES.CLOSED]: Archive,
};

const PERKS = ['Role-specific matching', 'Pre-screened professionals', 'Faster hiring process', 'Dedicated support'];

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function RecentRequests() {
  const query = useQuery({
    queryKey: queryKeys.recruiter.requests({ page: 1, limit: 4 }),
    queryFn: () => listPlacementRequests({ page: 1, limit: 4 }),
  });

  return (
    <QueryBoundary query={query} loadingLabel="Loading your recent requests">
      {({ placementRequests }) =>
        placementRequests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests yet"
            description="Find a candidate in the talent pool and submit your first placement request."
            action={
              <Button to="/recruiter/talent-pool" size="sm">
                Find talent
              </Button>
            }
          />
        ) : (
          <ul className={styles.requestList}>
            {placementRequests.map((request) => {
              const details = getPlacementRequestStatusDetails(request.status);

              return (
                <li key={request.id}>
                  <Link className={styles.requestItem} to={`/recruiter/requests/${request.id}`}>
                    <span className={styles.requestAvatar} aria-hidden="true">
                      <UserRound size={20} />
                    </span>
                    <span className={styles.requestBody}>
                      <span className={styles.requestTitle}>{request.jobTitle}</span>
                      <span className={styles.requestMeta}>
                        <span className={styles.reference}>
                          <Hash size={12} aria-hidden="true" />
                          {request.candidateReference}
                        </span>
                        <span aria-hidden="true">·</span>
                        Submitted {formatDate(request.createdAt)}
                      </span>
                    </span>
                    <StatusBadge tone={details.tone}>{details.label}</StatusBadge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      }
    </QueryBoundary>
  );
}

function RecruiterOverviewPage() {
  const { user } = useAuth();
  const summaryQuery = useQuery({ queryKey: queryKeys.recruiter.summary, queryFn: getRequestSummary });
  const companyQuery = useQuery({ queryKey: queryKeys.recruiter.company, queryFn: getMyCompany });

  return (
    <>
      <DashboardHero
        eyebrow="Recruiter console"
        greeting={`${greeting()},`}
        name={user.firstName}
        subtitle="Find verified professionals who are ready for your next opportunity."
        photo="/illustrations/hero-recruiter.png"
        script="Better talent. Greater possibilities."
        chips={
          summaryQuery.data
            ? [
                { icon: ClipboardList, label: 'Placement requests', value: summaryQuery.data.total },
                {
                  icon: CheckCircle2,
                  label: 'Fulfilled',
                  value: summaryQuery.data.byStatus[PLACEMENT_REQUEST_STATUSES.FULFILLED] ?? 0,
                },
              ]
            : []
        }
      >
        <Button to="/recruiter/talent-pool">
          <Sparkles size={16} aria-hidden="true" />
          Find talent
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
        <Button to="/recruiter/requests" variant="secondary">
          My requests
        </Button>
      </DashboardHero>

      {companyQuery.data && !companyQuery.data.isProfileComplete ? (
        <Alert variant="info" title="Complete your company profile">
          Adding your full company details helps our team process placement requests faster.{' '}
          <Link to="/recruiter/company">Update it now</Link>.
        </Alert>
      ) : null}

      <QueryBoundary query={summaryQuery} loadingLabel="Loading your request summary">
        {(summary) => (
          <>
            <div className={styles.stats}>
              <StatCard
                label="Total requests"
                value={summary.total}
                icon={ClipboardList}
                to="/recruiter/requests"
                tone="featured"
              />
              {TRACKED_STATUSES.map((status) => (
                <StatCard
                  key={status}
                  label={getPlacementRequestStatusDetails(status).label}
                  value={summary.byStatus[status] ?? 0}
                  icon={STATUS_ICONS[status] ?? ClipboardList}
                  to={`/recruiter/requests?status=${status}`}
                />
              ))}
            </div>

            <div className={styles.bento}>
              <Card
                title={
                  <span className={styles.cardTitle}>
                    <ClipboardList size={22} aria-hidden="true" />
                    Recent placement requests
                  </span>
                }
                description="The latest roles you have asked our team to fill."
                actions={
                  <Link className={styles.viewAll} to="/recruiter/requests">
                    View all
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                }
                className={styles.bentoMain}
              >
                <RecentRequests />

                {summary.total === 0 ? (
                  <ol className={styles.steps}>
                    <li>Complete your company profile so we know who we are working with.</li>
                    <li>Search approved candidates by skill, location, and certification.</li>
                    <li>Open a candidate and submit a placement request.</li>
                    <li>Our team reviews it and arranges the placement.</li>
                  </ol>
                ) : null}
              </Card>

              <PhotoPromoCard
                photo={PHOTOS.meetingTwoWomen}
                icon={Target}
                eyebrow="Placements"
                title="Need someone specific?"
                action={
                  <Button to="/recruiter/talent-pool" fullWidth>
                    <Send size={16} aria-hidden="true" />
                    Request a placement
                  </Button>
                }
              >
                <p>
                  Search the verified pool by skill and location, then request a placement — our
                  recruitment team takes it from there.
                </p>
                <ul>
                  {PERKS.map((perk) => (
                    <li key={perk}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </PhotoPromoCard>
            </div>

            <section className={styles.strip}>
              <span className={styles.stripIcon} aria-hidden="true">
                <UserRound size={22} />
              </span>
              <div className={styles.stripCopy}>
                <h2 className={styles.stripTitle}>Build stronger teams with verified talent.</h2>
                <p className={styles.stripBody}>
                  Access qualified professionals, reduce hiring time, and make better hiring decisions.
                </p>
              </div>
              <Button to="/recruiter/subscription" variant="secondary">
                View plans
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </section>
          </>
        )}
      </QueryBoundary>
    </>
  );
}

export default RecruiterOverviewPage;
