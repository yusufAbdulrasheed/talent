import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Briefcase, MapPin, ClipboardList, Inbox, Eye, Loader2, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { listAdminPlacementRequests } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  PLACEMENT_REQUEST_STATUSES,
  PLACEMENT_STATUS_FILTER_OPTIONS,
  getEmploymentTypeLabel,
  getPlacementRequestStatusDetails,
} from '../../../constants/placementRequest.js';
import { formatDate } from '../../../utils/format.js';
import styles from './AdminPlacementRequestsPage.module.scss';

const STAT_CONFIG = [
  { status: PLACEMENT_REQUEST_STATUSES.SUBMITTED, icon: Inbox },
  { status: PLACEMENT_REQUEST_STATUSES.UNDER_REVIEW, icon: Eye },
  { status: PLACEMENT_REQUEST_STATUSES.IN_PROGRESS, icon: Loader2 },
  { status: PLACEMENT_REQUEST_STATUSES.FULFILLED, icon: CheckCircle2 },
];

const TONE_CLASS = {
  accent: 'toneAccent',
  info: 'toneInfo',
  success: 'toneSuccess',
  warning: 'toneWarning',
  neutral: 'toneNeutral',
  danger: 'toneDanger',
};

const STATUS_PILLS = [{ value: '', label: 'All requests' }, ...PLACEMENT_STATUS_FILTER_OPTIONS];

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
      render: (row) => (
        <Link to={`/admin/placement-requests/${row.id}`} className={styles.roleLink}>
          <Briefcase size={14} aria-hidden="true" />
          {row.jobTitle}
        </Link>
      ),
    },
    { key: 'company', header: 'Company', render: (row) => row.company?.companyName ?? '—' },
    {
      key: 'candidate',
      header: 'Candidate',
      render: (row) => (
        <span className={styles.reference}>{row.candidate?.referenceNumber ?? '—'}</span>
      ),
    },
    {
      key: 'employmentType',
      header: 'Type',
      render: (row) => getEmploymentTypeLabel(row.employmentType),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <span className={styles.locationCell}>
          <MapPin size={14} aria-hidden="true" />
          {row.location}
        </span>
      ),
    },
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
          View
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

      <QueryBoundary query={requestsQuery} loadingLabel="Loading placement requests">
        {({ placementRequests, pagination }) => {
          const statusCounts = placementRequests.reduce((acc, request) => {
            acc[request.status] = (acc[request.status] ?? 0) + 1;
            return acc;
          }, {});

          return (
            <>
              <div className={styles.stats}>
                <StatTile label="Total requests" value={pagination.total} icon={ClipboardList} />
                {STAT_CONFIG.map(({ status: statConfigStatus, icon }) => (
                  <StatTile
                    key={statConfigStatus}
                    label={getPlacementRequestStatusDetails(statConfigStatus).label}
                    value={statusCounts[statConfigStatus] ?? 0}
                    icon={icon}
                  />
                ))}
              </div>

              <div className={styles.filterBar} role="group" aria-label="Filter by status">
                {STATUS_PILLS.map((option) => {
                  const isActive = status === option.value;
                  const tone = option.value ? getPlacementRequestStatusDetails(option.value).tone : 'accent';
                  const toneClass = styles[TONE_CLASS[tone] ?? 'toneNeutral'];

                  return (
                    <button
                      key={option.value || 'all'}
                      type="button"
                      className={`${styles.pill} ${toneClass} ${isActive ? styles.pillActive : ''}`}
                      aria-pressed={isActive}
                      onClick={() => updateSearch({ status: option.value })}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {placementRequests.length === 0 ? (
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
              )}
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}

export default AdminPlacementRequestsPage;
