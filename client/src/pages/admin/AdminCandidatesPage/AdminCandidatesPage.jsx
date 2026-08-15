import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { listCandidates } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  CANDIDATE_STATUS_DETAILS,
  getCandidateStatusDetails,
} from '../../../constants/candidateStatus.js';
import { formatDate } from '../../../utils/format.js';
import styles from './AdminCandidatesPage.module.scss';

const STATUS_OPTIONS = Object.entries(CANDIDATE_STATUS_DETAILS).map(([value, { label }]) => ({
  value,
  label,
}));

function AdminCandidatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') ?? 1);
  const [searchInput, setSearchInput] = useState(search);

  const params = { page, ...(status ? { status } : {}), ...(search ? { search } : {}) };
  const candidatesQuery = useQuery({
    queryKey: queryKeys.admin.candidates(params),
    queryFn: () => listCandidates(params),
    placeholderData: keepPreviousData,
  });

  const updateSearch = (next) => {
    const merged = { status, search, page: 1, ...next };
    const clean = {};

    if (merged.status) clean.status = merged.status;
    if (merged.search) clean.search = merged.search;
    if (merged.page > 1) clean.page = String(merged.page);

    setSearchParams(clean);
  };

  const columns = [
    {
      key: 'referenceNumber',
      header: 'Reference',
      render: (row) => (
        <Link className={styles.reference} to={`/admin/candidates/${row.id}`}>
          {row.referenceNumber}
        </Link>
      ),
    },
    { key: 'fullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'location', header: 'Location' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const details = getCandidateStatusDetails(row.status);
        return <StatusBadge tone={details.tone}>{details.label}</StatusBadge>;
      },
    },
    { key: 'createdAt', header: 'Registered', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button to={`/admin/candidates/${row.id}`} size="sm" variant="secondary">
          Review
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Review applications, then approve to publish a candidate to the talent pool."
      />

      <Card title="Filter">
        <div className={styles.filters}>
          <form
            className={styles.searchForm}
            onSubmit={(event) => {
              event.preventDefault();
              updateSearch({ search: searchInput.trim() });
            }}
          >
            <TextField
              label="Search"
              name="search"
              hint="Matches reference, location, and skills."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Button type="submit" isLoading={candidatesQuery.isFetching}>
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

      <QueryBoundary query={candidatesQuery} loadingLabel="Loading candidates">
        {({ candidates, pagination }) =>
          candidates.length === 0 ? (
            <EmptyState
              title="No candidates match these filters"
              description="Try clearing the status filter or your search term."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSearchInput('');
                    setSearchParams({});
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <Card>
              <DataTable
                caption="Registered candidates"
                columns={columns}
                rows={candidates}
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

export default AdminCandidatesPage;
