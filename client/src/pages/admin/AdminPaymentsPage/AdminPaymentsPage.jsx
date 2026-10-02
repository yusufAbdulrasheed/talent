import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, Receipt } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { listPayments } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { PAYMENT_STATUS_DETAILS, getPaymentStatusDetails } from '../../../constants/candidateStatus.js';
import { formatCurrency, formatDateTime } from '../../../utils/format.js';
import styles from './AdminPaymentsPage.module.scss';

const STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_DETAILS).map(([value, { label }]) => ({
  value,
  label,
}));

function AdminPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const reference = searchParams.get('reference') ?? '';
  const page = Number(searchParams.get('page') ?? 1);
  const [referenceInput, setReferenceInput] = useState(reference);

  const params = { page, ...(status ? { status } : {}), ...(reference ? { reference } : {}) };
  const paymentsQuery = useQuery({
    queryKey: queryKeys.admin.payments(params),
    queryFn: () => listPayments(params),
    placeholderData: keepPreviousData,
  });

  const updateSearch = (next) => {
    const merged = { status, reference, page: 1, ...next };
    const clean = {};

    if (merged.status) clean.status = merged.status;
    if (merged.reference) clean.reference = merged.reference;
    if (merged.page > 1) clean.page = String(merged.page);

    setSearchParams(clean);
  };

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => <span className={styles.reference}>{row.reference}</span>,
    },
    {
      key: 'purpose',
      header: 'Purpose',
      render: (row) =>
        row.purpose === 'recruiter_subscription' ? (
          <StatusBadge tone="info">Subscription{row.subscriptionTier ? ` · ${row.subscriptionTier}` : ''}</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">Candidate training</StatusBadge>
        ),
    },
    {
      key: 'candidateReference',
      header: 'Candidate / company',
      render: (row) => (
        <span className={styles.reference}>{row.candidateReference ?? row.recruiterCompanyName ?? '—'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className={styles.amount}>
          <Receipt size={14} aria-hidden="true" />
          {formatCurrency(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const details = getPaymentStatusDetails(row.status);
        return <StatusBadge tone={details.tone}>{details.label}</StatusBadge>;
      },
    },
    { key: 'paidAt', header: 'Paid at', render: (row) => formatDateTime(row.paidAt) },
    { key: 'createdAt', header: 'Created', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="The full transaction log — recruiter subscriptions and legacy candidate payments. Confirmed by the Paystack webhook, never by hand."
      />

      <Card
        title={
          <span className={styles.cardTitle}>
            <Search size={18} aria-hidden="true" />
            Search transactions
          </span>
        }
      >
        <div className={styles.filters}>
          <form
            className={styles.searchForm}
            onSubmit={(event) => {
              event.preventDefault();
              updateSearch({ reference: referenceInput.trim() });
            }}
          >
            <TextField
              label="Payment reference"
              name="reference"
              value={referenceInput}
              onChange={(event) => setReferenceInput(event.target.value)}
            />
            <Button type="submit" isLoading={paymentsQuery.isFetching}>
              Search
            </Button>
          </form>

          <SelectField
            label="Status"
            name="status"
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) => updateSearch({ status: event.target.value })}
          />
        </div>
      </Card>

      <QueryBoundary query={paymentsQuery} loadingLabel="Loading payments">
        {({ payments, pagination }) =>
          payments.length === 0 ? (
            <EmptyState title="No payments found" description="No transactions match these filters." />
          ) : (
            <Card>
              <DataTable
                caption="Training fee payments"
                columns={columns}
                rows={payments}
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

export default AdminPaymentsPage;
