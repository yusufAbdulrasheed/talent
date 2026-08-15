import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getMyCompany, getRequestSummary } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { useAuth } from '../../../auth/useAuth.js';
import {
  PLACEMENT_REQUEST_STATUS_DETAILS,
  getPlacementRequestStatusDetails,
} from '../../../constants/placementRequest.js';
import styles from './RecruiterOverviewPage.module.scss';

const TRACKED_STATUSES = Object.keys(PLACEMENT_REQUEST_STATUS_DETAILS);

function RecruiterOverviewPage() {
  const { user } = useAuth();
  const summaryQuery = useQuery({
    queryKey: queryKeys.recruiter.summary,
    queryFn: getRequestSummary,
  });
  const companyQuery = useQuery({ queryKey: queryKeys.recruiter.company, queryFn: getMyCompany });

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.firstName}`}
        description="Search approved talent and track the placement requests you have submitted."
        actions={<Button to="/recruiter/talent-pool">Find talent</Button>}
      />

      {companyQuery.data && !companyQuery.data.isProfileComplete ? (
        <Alert variant="info" title="Complete your company profile">
          Adding your full company details helps our team process placement requests faster.{' '}
          <a href="/recruiter/company">Update it now</a>.
        </Alert>
      ) : null}

      <QueryBoundary query={summaryQuery} loadingLabel="Loading your request summary">
        {(summary) => (
          <>
            <Card title="Placement requests" description="A breakdown of every request you have submitted.">
              <ul className={styles.stats}>
                <li className={styles.stat}>
                  <span className={styles.statValue}>{summary.total}</span>
                  <span className={styles.statLabel}>Total requests</span>
                </li>
                {TRACKED_STATUSES.map((status) => (
                  <li key={status} className={styles.stat}>
                    <span className={styles.statValue}>{summary.byStatus[status] ?? 0}</span>
                    <span className={styles.statLabel}>
                      {getPlacementRequestStatusDetails(status).label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className={styles.actions}>
                <Button to="/recruiter/requests" variant="secondary" size="sm">
                  View all requests
                </Button>
              </div>
            </Card>

            {summary.total === 0 ? (
              <Card
                title="Get started"
                description="Search the talent pool and submit your first placement request."
              >
                <ol className={styles.steps}>
                  <li>Complete your company profile so we know who we are working with.</li>
                  <li>Search approved candidates by skill, location, and availability.</li>
                  <li>Open a candidate and submit a placement request.</li>
                  <li>Our team reviews it and arranges the placement.</li>
                </ol>
                <div className={styles.actions}>
                  <Button to="/recruiter/talent-pool" size="sm">
                    Browse the talent pool
                  </Button>
                </div>
              </Card>
            ) : null}
          </>
        )}
      </QueryBoundary>
    </>
  );
}

export default RecruiterOverviewPage;
