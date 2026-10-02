import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { BadgeCheck, Briefcase, Clock } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
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
import styles from './AdminRecruitersPage.module.scss';

const APPROVAL_FILTERS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Approved' },
  { value: 'false', label: 'Pending approval' },
];

function getInitials(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function StatTile({ label, value, icon }) {
  const Icon = icon;

  return (
    <div className={styles.stat}>
      <span className={styles.iconBadge} aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

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

  // Stat tiles are derived from whatever page of results is already loaded —
  // an honest snapshot of the current filter, not a separate aggregate call.
  const recruiters = recruitersQuery.data?.recruiters ?? [];
  const pagination = recruitersQuery.data?.pagination;
  const approvedCount = recruiters.filter((recruiter) => recruiter.isApproved).length;
  const pendingCount = recruiters.filter((recruiter) => !recruiter.isApproved).length;

  const columns = [
    {
      key: 'companyName',
      header: 'Company',
      render: (row) => (
        <span className={styles.companyCell}>
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(row.companyName)}
          </span>
          {row.companyName ?? '—'}
        </span>
      ),
    },
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
        title="Recruitment partners"
        description="Registered recruiting companies. Approval is a record-keeping flag; it does not gate talent-pool access in this MVP."
      />

      {pagination ? (
        <div className={styles.stats}>
          <StatTile label="Total recruiters" value={pagination.total} icon={Briefcase} />
          <StatTile label="Approved" value={approvedCount} icon={BadgeCheck} />
          <StatTile label="Pending approval" value={pendingCount} icon={Clock} />
        </div>
      ) : null}

      {approvalMutation.isError ? (
        <Alert variant="error">{getErrorMessage(approvalMutation.error)}</Alert>
      ) : null}

      <Card title="Filter">
        <div className={styles.filterPills} role="group" aria-label="Filter by approval status">
          {APPROVAL_FILTERS.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              className={`${styles.pill} ${isApproved === option.value ? styles.pillActive : ''}`}
              aria-pressed={isApproved === option.value}
              onClick={() => updateSearch({ isApproved: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      <QueryBoundary query={recruitersQuery} loadingLabel="Loading recruiters">
        {({ recruiters: rows, pagination: pageInfo }) =>
          rows.length === 0 ? (
            <EmptyState title="No recruiters found" description="No companies match this filter." />
          ) : (
            <Card>
              <DataTable
                caption="Registered recruiting companies"
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.id}
              />
              <Pagination
                page={pageInfo.page}
                totalPages={pageInfo.totalPages}
                total={pageInfo.total}
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
