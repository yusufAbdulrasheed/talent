import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { listAdminPlacementRequests } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  PLACEMENT_STATUS_FILTER_OPTIONS,
  getEmploymentTypeLabel,
  getPlacementRequestStatusDetails,
} from '../../../constants/placementRequest.js';
import { formatDate } from '../../../utils/format.js';

function AdminPlacementRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const params = { page, ...(status ? { status } : {}) };
  const requestsQuery = useQuery({
    queryKey: queryKeys.admin.placementRequests(params),
    queryFn: () => listAdminPlacementRequests(params),
    placeholderData: keepPreviousData,
  });

  const updateSearch = (next) => {
    const merged = { status, page: 1, ...next };
    const clean = {};

    if (merged.status) clean.status = merged.status;
    if (merged.page > 1) clean.page = String(merged.page);

    setSearchParams(clean);
  };

  const columns = [
    {
      key: 'jobTitle',
      header: 'Role',
      render: (row) => <Link to={`/admin/placement-requests/${row.id}`}>{row.jobTitle}</Link>,
    },
    { key: 'company', header: 'Company', render: (row) => row.company?.companyName ?? '—' },
    { key: 'candidate', header: 'Candidate', render: (row) => row.candidate?.referenceNumber ?? '—' },
    {
      key: 'employmentType',
      header: 'Type',
      render: (row) => getEmploymentTypeLabel(row.employmentType),
    },
    { key: 'location', header: 'Location' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const details = getPlacementRequestStatusDetails(row.status);
        return <StatusBadge tone={details.tone}>{details.label}</StatusBadge>;
      },
    },
    { key: 'createdAt', header: 'Submitted', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button to={`/admin/placement-requests/${row.id}`} size="sm" variant="secondary">
          Review
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Placement requests"
        description="Requests submitted by recruiters. Changing a status emails the recruiter automatically."
      />

      <Card title="Filter">
        <SelectField
          label="Status"
          name="status"
          placeholder="All statuses"
          options={PLACEMENT_STATUS_FILTER_OPTIONS}
          value={status}
          onChange={(event) => updateSearch({ status: event.target.value })}
        />
      </Card>

      <QueryBoundary query={requestsQuery} loadingLabel="Loading placement requests">
        {({ placementRequests, pagination }) =>
          placementRequests.length === 0 ? (
            <EmptyState
              title="No placement requests"
              description="Nothing matches this filter yet."
            />
          ) : (
            <Card>
              <DataTable
                caption="Placement requests"
                columns={columns}
                rows={placementRequests}
                getRowKey={(row) => row.id}
              />
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={(nextPage) => updateSearch({ page: nextPage })}
              />
            </Card>
          )
        }
      </QueryBoundary>
    </>
  );
}

export default AdminPlacementRequestsPage;
