import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { listPlacementRequests } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  PLACEMENT_STATUS_FILTER_OPTIONS,
  getEmploymentTypeLabel,
  getPlacementRequestStatusDetails,
} from '../../../constants/placementRequest.js';
import { formatDate } from '../../../utils/format.js';
import styles from './PlacementRequestsPage.module.scss';

function PlacementRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const params = { page, ...(status ? { status } : {}) };
  const requestsQuery = useQuery({
    queryKey: queryKeys.recruiter.requests(params),
    queryFn: () => listPlacementRequests(params),
    placeholderData: keepPreviousData,
  });

  const updateSearch = (nextStatus, nextPage) => {
    const next = {};

    if (nextStatus) {
      next.status = nextStatus;
    }

    if (nextPage > 1) {
      next.page = String(nextPage);
    }

    setSearchParams(next);
  };

  return (
    <>
      <PageHeader
        title="Placement requests"
        description="Every request you have submitted, and where each one stands."
        actions={<Button to="/recruiter/talent-pool">Find talent</Button>}
      />

      <Card title="Filter">
        <SelectField
          label="Status"
          name="status"
          placeholder="All statuses"
          options={PLACEMENT_STATUS_FILTER_OPTIONS}
          value={status}
          onChange={(event) => updateSearch(event.target.value, 1)}
          className={styles.statusFilter}
        />
      </Card>

      <QueryBoundary query={requestsQuery} loadingLabel="Loading your requests">
        {({ placementRequests, pagination }) =>
          placementRequests.length === 0 ? (
            <EmptyState
              title={status ? 'No requests with this status' : 'No placement requests yet'}
              description={
                status
                  ? 'Try clearing the status filter.'
                  : 'Find a candidate in the talent pool and submit your first request.'
              }
              action={
                status ? (
                  <Button variant="secondary" size="sm" onClick={() => updateSearch('', 1)}>
                    Clear filter
                  </Button>
                ) : (
                  <Button to="/recruiter/talent-pool" size="sm">
                    Browse the talent pool
                  </Button>
                )
              }
            />
          ) : (
            <>
              <ul className={styles.list}>
                {placementRequests.map((request) => {
                  const statusDetails = getPlacementRequestStatusDetails(request.status);

                  return (
                    <li key={request.id}>
                      <article className={styles.item}>
                        <div className={styles.itemMain}>
                          <h2 className={styles.itemTitle}>
                            <Link to={`/recruiter/requests/${request.id}`}>{request.jobTitle}</Link>
                          </h2>
                          <p className={styles.itemMeta}>
                            <span className={styles.reference}>{request.candidateReference}</span>
                            {' · '}
                            {getEmploymentTypeLabel(request.employmentType)}
                            {' · '}
                            {request.location}
                          </p>
                          <p className={styles.itemDate}>
                            Submitted {formatDate(request.createdAt)}
                          </p>
                        </div>
                        <StatusBadge tone={statusDetails.tone}>{statusDetails.label}</StatusBadge>
                      </article>
                    </li>
                  );
                })}
              </ul>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={(nextPage) => updateSearch(status, nextPage)}
              />
            </>
          )
        }
      </QueryBoundary>
    </>
  );
}

export default PlacementRequestsPage;
