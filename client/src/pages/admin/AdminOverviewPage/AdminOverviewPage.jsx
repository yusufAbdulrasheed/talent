import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getDashboard } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { formatCurrency } from '../../../utils/format.js';
import styles from './AdminOverviewPage.module.scss';

function StatGrid({ items }) {
  return (
    <ul className={styles.stats}>
      {items.map((item) => (
        <li key={item.label} className={styles.stat}>
          <span className={styles.statValue}>{item.value}</span>
          <span className={styles.statLabel}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function AdminOverviewPage() {
  const dashboardQuery = useQuery({ queryKey: queryKeys.admin.dashboard, queryFn: getDashboard });

  return (
    <>
      <PageHeader
        title="Overview"
        description="Operational counts across candidates, recruiters, payments, and placements."
      />

      <QueryBoundary query={dashboardQuery} loadingLabel="Loading the dashboard">
        {(data) => (
          <>
            <Card
              title="Candidates"
              description="Approving a candidate is what publishes them to the recruiter talent pool."
              actions={
                <Button to="/admin/candidates" size="sm" variant="secondary">
                  Review candidates
                </Button>
              }
            >
              <StatGrid
                items={[
                  { label: 'Registered', value: data.candidates.total },
                  { label: 'Paid', value: data.candidates.paid },
                  { label: 'Awaiting review', value: data.candidates.awaitingReview },
                  { label: 'Approved', value: data.candidates.approved },
                ]}
              />
            </Card>

            <Card
              title="Placement requests"
              actions={
                <Button to="/admin/placement-requests" size="sm" variant="secondary">
                  Review requests
                </Button>
              }
            >
              <StatGrid
                items={[
                  { label: 'Total', value: data.placementRequests.total },
                  { label: 'Open', value: data.placementRequests.open },
                  { label: 'Fulfilled', value: data.placementRequests.byStatus.fulfilled ?? 0 },
                  { label: 'Closed', value: data.placementRequests.byStatus.closed ?? 0 },
                ]}
              />
            </Card>

            <Card title="Recruiters, trainers, and programmes">
              <StatGrid
                items={[
                  { label: 'Recruiters', value: data.recruiters.total },
                  { label: 'Approved recruiters', value: data.recruiters.approved },
                  { label: 'Active trainers', value: data.trainers.active },
                  { label: 'Active programmes', value: data.programs.active },
                ]}
              />
            </Card>

            <Card
              title="Payments"
              actions={
                <Button to="/admin/payments" size="sm" variant="secondary">
                  View payments
                </Button>
              }
            >
              <StatGrid
                items={[
                  { label: 'Successful payments', value: data.payments.successfulCount },
                  { label: 'Total received', value: formatCurrency(data.payments.totalAmount) },
                ]}
              />
            </Card>
          </>
        )}
      </QueryBoundary>
    </>
  );
}

export default AdminOverviewPage;
