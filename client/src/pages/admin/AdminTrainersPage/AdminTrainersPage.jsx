import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { createTrainer, listTrainers, setTrainerStatus } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { formatDate, formatDateTime } from '../../../utils/format.js';
import styles from './AdminTrainersPage.module.scss';

const EMPTY_TRAINER = { firstName: '', lastName: '', email: '' };

function AdminTrainersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_TRAINER);

  const params = { page };
  const trainersQuery = useQuery({
    queryKey: queryKeys.admin.trainers(params),
    queryFn: () => listTrainers(params),
  });

  const createMutation = useMutation({
    mutationFn: createTrainer,
    onSuccess: () => {
      setForm(EMPTY_TRAINER);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });

  const statusMutation = useMutation({
    mutationFn: setTrainerStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const fieldError = (field) =>
    createMutation.error?.response?.data?.details?.find((detail) => detail.field === field)?.message;

  const columns = [
    { key: 'fullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'assignmentCount', header: 'Assignments' },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge tone={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? 'Active' : 'Deactivated'}
        </StatusBadge>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last sign-in',
      render: (row) => (row.lastLoginAt ? formatDateTime(row.lastLoginAt) : 'Never'),
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant={row.isActive ? 'secondary' : 'primary'}
          disabled={statusMutation.isPending}
          onClick={() => statusMutation.mutate({ id: row.id, isActive: !row.isActive })}
        >
          {row.isActive ? 'Deactivate' : 'Reactivate'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Trainers"
        description="Trainers cannot register themselves. Create an account and they will be emailed a link to set their password."
      />

      <Card title="Add a trainer">
        {createMutation.isSuccess ? (
          <Alert variant="success">
            Trainer created. An invitation to set their password has been sent.
          </Alert>
        ) : null}
        {createMutation.isError ? (
          <Alert variant="error">{getErrorMessage(createMutation.error, 'Unable to create this trainer.')}</Alert>
        ) : null}

        <form
          className={styles.createForm}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate(form);
          }}
        >
          <TextField
            label="First name"
            name="firstName"
            required
            value={form.firstName}
            onChange={handleChange}
            error={fieldError('firstName')}
          />
          <TextField
            label="Last name"
            name="lastName"
            required
            value={form.lastName}
            onChange={handleChange}
            error={fieldError('lastName')}
          />
          <TextField
            label="Email address"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            error={fieldError('email')}
          />
          <div className={styles.createAction}>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create trainer
            </Button>
          </div>
        </form>
      </Card>

      {statusMutation.isError ? (
        <Alert variant="error">{getErrorMessage(statusMutation.error)}</Alert>
      ) : null}

      <QueryBoundary query={trainersQuery} loadingLabel="Loading trainers">
        {({ trainers, pagination }) =>
          trainers.length === 0 ? (
            <EmptyState
              title="No trainers yet"
              description="Create your first trainer using the form above."
            />
          ) : (
            <Card>
              <DataTable
                caption="Trainer accounts"
                columns={columns}
                rows={trainers}
                getRowKey={(row) => row.id}
              />
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={setPage}
              />
            </Card>
          )
        }
      </QueryBoundary>
    </>
  );
}

export default AdminTrainersPage;
