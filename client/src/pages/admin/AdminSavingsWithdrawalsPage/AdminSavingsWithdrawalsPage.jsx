import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PiggyBank } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { decideSavingsWithdrawal, listSavingsWithdrawals } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { formatCurrency, formatDate } from '../../../utils/format.js';
import styles from './AdminSavingsWithdrawalsPage.module.scss';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' };

function AdminSavingsWithdrawalsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'pending';
  const page = Number(searchParams.get('page') ?? 1);
  const [rejectingId, setRejectingId] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');

  const params = { status, page };
  const withdrawalsQuery = useQuery({
    queryKey: queryKeys.admin.savingsWithdrawals(params),
    queryFn: () => listSavingsWithdrawals(params),
    placeholderData: keepPreviousData,
  });

  const decideMutation = useMutation({
    mutationFn: decideSavingsWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'savings-withdrawals'] });
      setRejectingId(null);
      setDecisionNote('');
    },
  });

  const updateSearch = (next) => {
    const merged = { status, page: 1, ...next };
    const clean = {};
    if (merged.status) clean.status = merged.status;
    if (merged.page > 1) clean.page = String(merged.page);
    setSearchParams(clean);
  };

  const decide = (row, decisionStatus) => {
    if (decisionStatus === 'rejected' && rejectingId !== row.id) {
      setRejectingId(row.id);
      return;
    }

    decideMutation.mutate({
      candidateId: row.candidateId,
      requestId: row.id,
      status: decisionStatus,
      decisionNote: decisionNote.trim() || undefined,
    });
  };

  const columns = [
    {
      key: 'referenceNumber',
      header: 'Candidate',
      render: (row) => (
        <Link className={styles.reference} to={`/admin/candidates/${row.candidateId}`}>
          {row.referenceNumber}
        </Link>
      ),
    },
    { key: 'fullName', header: 'Name' },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'requestedAt', header: 'Requested', render: (row) => formatDate(row.requestedAt) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge tone={STATUS_TONE[row.status]}>{row.status}</StatusBadge>,
    },
    {
      key: 'actions',
      header: 'Decision',
      render: (row) =>
        row.status !== 'pending' ? (
          <span className={styles.decided}>{formatDate(row.decidedAt)}</span>
        ) : (
          <div className={styles.actionsCell}>
            {rejectingId === row.id ? (
              <TextareaField
                label="Rejection note"
                rows={2}
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
              />
            ) : null}
            <div className={styles.actionButtons}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => decide(row, 'rejected')}
                isLoading={decideMutation.isPending && rejectingId === row.id}
              >
                {rejectingId === row.id ? 'Confirm reject' : 'Reject'}
              </Button>
              <Button
                size="sm"
                onClick={() => decide(row, 'approved')}
                isLoading={decideMutation.isPending && rejectingId !== row.id}
              >
                Approve
              </Button>
            </div>
          </div>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Savings withdrawals"
        description="Review and decide on talent requests to withdraw from their savings."
      />

      <Card
        title={
          <span className={styles.cardTitle}>
            <PiggyBank size={18} aria-hidden="true" />
            Filter
          </span>
        }
      >
        <SelectField
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(event) => updateSearch({ status: event.target.value })}
        />
      </Card>

      {decideMutation.isError ? (
        <Alert variant="error">{getErrorMessage(decideMutation.error, 'Unable to update this request.')}</Alert>
      ) : null}

      <QueryBoundary query={withdrawalsQuery} loadingLabel="Loading withdrawal requests">
        {({ withdrawalRequests, pagination }) =>
          withdrawalRequests.length === 0 ? (
            <EmptyState title="No withdrawal requests found" description="No requests match this filter." />
          ) : (
            <Card>
              <DataTable
                caption="Savings withdrawal requests"
                columns={columns}
                rows={withdrawalRequests}
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

export default AdminSavingsWithdrawalsPage;
