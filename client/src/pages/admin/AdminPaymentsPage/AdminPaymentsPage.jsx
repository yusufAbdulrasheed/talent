import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
    { key: 'reference', header: 'Reference' },
    { key: 'candidateReference', header: 'Candidate' },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => formatCurrency(row.amount, row.currency),
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
        description="Every training-fee transaction. Payments are confirmed by the Paystack webhook, never by hand."
      />

      <Card title="Filter">
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
