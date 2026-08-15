import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { listRecruiters, setRecruiterApproval } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { formatDate } from '../../../utils/format.js';

const APPROVAL_OPTIONS = [
  { value: 'true', label: 'Approved' },
  { value: 'false', label: 'Pending approval' },
];

function AdminRecruitersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isApproved = searchParams.get('isApproved') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const params = { page, ...(isApproved ? { isApproved } : {}) };
  const recruitersQuery = useQuery({
    queryKey: queryKeys.admin.recruiters(params),
    queryFn: () => listRecruiters(params),
    placeholderData: keepPreviousData,
  });

  const approvalMutation = useMutation({
    mutationFn: setRecruiterApproval,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  });

  const updateSearch = (next) => {
    const merged = { isApproved, page: 1, ...next };
    const clean = {};

    if (merged.isApproved) clean.isApproved = merged.isApproved;
    if (merged.page > 1) clean.page = String(merged.page);

    setSearchParams(clean);
  };

  const columns = [
    { key: 'companyName', header: 'Company' },
    { key: 'industry', header: 'Industry' },
    { key: 'companyEmail', header: 'Email' },
    { key: 'contactPerson', header: 'Contact' },
    {
      key: 'isApproved',
      header: 'Status',
      render: (row) => (
        <StatusBadge tone={row.isApproved ? 'success' : 'warning'}>
          {row.isApproved ? 'Approved' : 'Pending'}
        </StatusBadge>
      ),
    },
    { key: 'createdAt', header: 'Registered', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant={row.isApproved ? 'secondary' : 'primary'}
          disabled={approvalMutation.isPending}
          onClick={() => approvalMutation.mutate({ id: row.id, isApproved: !row.isApproved })}
        >
          {row.isApproved ? 'Withdraw' : 'Approve'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Recruiters"
        description="Registered recruiting companies. Approval is a record-keeping flag; it does not gate talent-pool access in this MVP."
      />

      {approvalMutation.isError ? (
        <Alert variant="error">{getErrorMessage(approvalMutation.error)}</Alert>
      ) : null}

      <Card title="Filter">
        <SelectField
          label="Approval status"
          name="isApproved"
          placeholder="All recruiters"
          options={APPROVAL_OPTIONS}
          value={isApproved}
          onChange={(event) => updateSearch({ isApproved: event.target.value })}
        />
      </Card>

      <QueryBoundary query={recruitersQuery} loadingLabel="Loading recruiters">
        {({ recruiters, pagination }) =>
          recruiters.length === 0 ? (
            <EmptyState title="No recruiters found" description="No companies match this filter." />
          ) : (
            <Card>
              <DataTable
                caption="Registered recruiting companies"
                columns={columns}
                rows={recruiters}
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

export default AdminRecruitersPage;
