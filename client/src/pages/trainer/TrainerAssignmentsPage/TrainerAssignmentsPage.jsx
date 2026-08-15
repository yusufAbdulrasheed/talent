import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getTrainerDashboard } from '../../../api/endpoints/trainer.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { formatDate } from '../../../utils/format.js';
import styles from './TrainerAssignmentsPage.module.scss';

function TrainerAssignmentsPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.trainer.dashboard,
    queryFn: getTrainerDashboard,
  });

  return (
    <>
      <PageHeader
        title="My assignments"
        description="The programmes and batches assigned to you, and how many candidates are in each."
      />

      <Alert variant="info">
        This dashboard is read-only. Attendance, assessments, course materials, and certificates are
        not part of this release.
      </Alert>

      <QueryBoundary query={dashboardQuery} loadingLabel="Loading your assignments">
        {({ assignments }) =>
          assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet"
              description="Your administrator has not assigned you to a programme or batch."
            />
          ) : (
            <ul className={styles.list}>
              {assignments.map((assignment) => (
                <li key={assignment.id}>
                  <Card
                    title={assignment.program?.title ?? 'Programme removed'}
                    description={assignment.program?.description}
                    actions={
                      <StatusBadge tone={assignment.isActive ? 'success' : 'neutral'}>
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    }
                  >
                    <dl className={styles.meta}>
                      <div>
                        <dt>Batch</dt>
                        <dd>{assignment.batchName}</dd>
                      </div>
                      <div>
                        <dt>Candidates</dt>
                        <dd>{assignment.candidateCount}</dd>
                      </div>
                      <div>
                        <dt>Assigned</dt>
                        <dd>{formatDate(assignment.createdAt)}</dd>
                      </div>
                    </dl>

                    {assignment.announcement ? (
                      <Alert variant="info" title="Announcement">
                        {assignment.announcement}
                      </Alert>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </>
  );
}

export default TrainerAssignmentsPage;
