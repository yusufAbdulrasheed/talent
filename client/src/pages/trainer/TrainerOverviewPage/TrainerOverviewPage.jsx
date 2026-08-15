import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getTrainerDashboard } from '../../../api/endpoints/trainer.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { formatDateTime } from '../../../utils/format.js';
import styles from './TrainerOverviewPage.module.scss';

function TrainerOverviewPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.trainer.dashboard,
    queryFn: getTrainerDashboard,
  });

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your account, your assigned programmes and batches, and announcements from the administrator."
      />

      <QueryBoundary query={dashboardQuery} loadingLabel="Loading your dashboard">
        {({ profile, summary, assignments }) => {
          const announcements = assignments.filter((assignment) => assignment.announcement);

          return (
            <>
              <Card
                title="Your account"
                actions={
                  <StatusBadge tone={profile.isActive ? 'success' : 'neutral'}>
                    {profile.isActive ? 'Active' : 'Deactivated'}
                  </StatusBadge>
                }
              >
                <dl className={styles.summary}>
                  <div>
                    <dt>Name</dt>
                    <dd>{profile.fullName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{profile.email}</dd>
                  </div>
                  <div>
                    <dt>Last sign-in</dt>
                    <dd>{profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : 'This is your first visit'}</dd>
                  </div>
                </dl>
              </Card>

              <Card title="At a glance">
                <ul className={styles.stats}>
                  <li className={styles.stat}>
                    <span className={styles.statValue}>{summary.activeAssignments}</span>
                    <span className={styles.statLabel}>Active batches</span>
                  </li>
                  <li className={styles.stat}>
                    <span className={styles.statValue}>{summary.totalCandidates}</span>
                    <span className={styles.statLabel}>Candidates assigned</span>
                  </li>
                  <li className={styles.stat}>
                    <span className={styles.statValue}>{summary.totalAssignments}</span>
                    <span className={styles.statLabel}>Assignments in total</span>
                  </li>
                </ul>
              </Card>

              {announcements.length > 0 ? (
                <Card title="Announcements">
                  <ul className={styles.announcements}>
                    {announcements.map((assignment) => (
                      <li key={assignment.id}>
                        <Alert variant="info" title={`${assignment.program?.title ?? 'Programme'} — ${assignment.batchName}`}>
                          {assignment.announcement}
                        </Alert>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {assignments.length === 0 ? (
                <EmptyState
                  title="No assignments yet"
                  description="Your administrator has not assigned you to a programme or batch. They will appear here once they do."
                />
              ) : null}
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}

export default TrainerOverviewPage;
