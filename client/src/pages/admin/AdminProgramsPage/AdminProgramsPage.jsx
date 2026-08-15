import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import {
  createAssignment,
  createProgram,
  listAssignments,
  listPrograms,
  listTrainers,
  updateProgram,
} from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import styles from './AdminProgramsPage.module.scss';

const EMPTY_PROGRAM = { title: '', description: '' };
const EMPTY_ASSIGNMENT = { trainer: '', program: '', batchName: '', announcement: '' };

function AdminProgramsPage() {
  const queryClient = useQueryClient();
  const listParams = { page: 1, limit: 100 };

  const programsQuery = useQuery({
    queryKey: queryKeys.admin.programs(listParams),
    queryFn: () => listPrograms(listParams),
  });
  const assignmentsQuery = useQuery({
    queryKey: queryKeys.admin.assignments(listParams),
    queryFn: () => listAssignments(listParams),
  });
  const trainersQuery = useQuery({
    queryKey: queryKeys.admin.trainers(listParams),
    queryFn: () => listTrainers(listParams),
  });

  const [programForm, setProgramForm] = useState(EMPTY_PROGRAM);
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });

  const createProgramMutation = useMutation({
    mutationFn: createProgram,
    onSuccess: () => {
      setProgramForm(EMPTY_PROGRAM);
      invalidate();
    },
  });

  const toggleProgramMutation = useMutation({ mutationFn: updateProgram, onSuccess: invalidate });

  const createAssignmentMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      setAssignmentForm(EMPTY_ASSIGNMENT);
      invalidate();
    },
  });

  const programOptions = (programsQuery.data?.programs ?? []).map((program) => ({
    value: program._id ?? program.id,
    label: program.title,
  }));
  const trainerOptions = (trainersQuery.data?.trainers ?? [])
    .filter((trainer) => trainer.isActive)
    .map((trainer) => ({ value: trainer.id, label: `${trainer.fullName} (${trainer.email})` }));

  return (
    <>
      <PageHeader
        title="Programs and batches"
        description="Define training programmes, then assign trainers to batches of candidates."
      />

      <Card title="Add a programme">
        {createProgramMutation.isError ? (
          <Alert variant="error">{getErrorMessage(createProgramMutation.error)}</Alert>
        ) : null}

        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const payload = { title: programForm.title.trim() };

            if (programForm.description.trim()) {
              payload.description = programForm.description.trim();
            }

            createProgramMutation.mutate(payload);
          }}
        >
          <TextField
            label="Programme title"
            name="title"
            required
            value={programForm.title}
            onChange={(event) => setProgramForm((p) => ({ ...p, title: event.target.value }))}
          />
          <TextareaField
            label="Description"
            name="description"
            rows={2}
            value={programForm.description}
            onChange={(event) => setProgramForm((p) => ({ ...p, description: event.target.value }))}
          />
          <div className={styles.action}>
            <Button type="submit" isLoading={createProgramMutation.isPending}>
              Add programme
            </Button>
          </div>
        </form>
      </Card>

      <QueryBoundary query={programsQuery} loadingLabel="Loading programmes">
        {({ programs }) => (
          <Card title="Programmes">
            {programs.length === 0 ? (
              <EmptyState title="No programmes yet" description="Add your first programme above." />
            ) : (
              <DataTable
                caption="Training programmes"
                columns={[
                  { key: 'title', header: 'Title' },
                  { key: 'description', header: 'Description' },
                  {
                    key: 'isActive',
                    header: 'Status',
                    render: (row) => (
                      <StatusBadge tone={row.isActive ? 'success' : 'neutral'}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    align: 'right',
                    render: (row) => (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={toggleProgramMutation.isPending}
                        onClick={() =>
                          toggleProgramMutation.mutate({
                            id: row._id ?? row.id,
                            isActive: !row.isActive,
                          })
                        }
                      >
                        {row.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    ),
                  },
                ]}
                rows={programs}
                getRowKey={(row) => row._id ?? row.id}
              />
            )}
          </Card>
        )}
      </QueryBoundary>

      <Card title="Assign a trainer to a batch">
        {createAssignmentMutation.isError ? (
          <Alert variant="error">{getErrorMessage(createAssignmentMutation.error)}</Alert>
        ) : null}

        {trainerOptions.length === 0 || programOptions.length === 0 ? (
          <Alert variant="info">
            You need at least one active trainer and one programme before you can create an
            assignment.
          </Alert>
        ) : (
          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const payload = {
                trainer: assignmentForm.trainer,
                program: assignmentForm.program,
                batchName: assignmentForm.batchName.trim(),
              };

              if (assignmentForm.announcement.trim()) {
                payload.announcement = assignmentForm.announcement.trim();
              }

              createAssignmentMutation.mutate(payload);
            }}
          >
            <div className={styles.grid}>
              <SelectField
                label="Trainer"
                name="trainer"
                placeholder="Select a trainer"
                options={trainerOptions}
                required
                value={assignmentForm.trainer}
                onChange={(event) =>
                  setAssignmentForm((a) => ({ ...a, trainer: event.target.value }))
                }
              />
              <SelectField
                label="Programme"
                name="program"
                placeholder="Select a programme"
                options={programOptions}
                required
                value={assignmentForm.program}
                onChange={(event) =>
                  setAssignmentForm((a) => ({ ...a, program: event.target.value }))
                }
              />
              <TextField
                label="Batch name"
                name="batchName"
                required
                hint="For example, “Cohort 3 — March”."
                value={assignmentForm.batchName}
                onChange={(event) =>
                  setAssignmentForm((a) => ({ ...a, batchName: event.target.value }))
                }
              />
            </div>

            <TextareaField
              label="Announcement"
              name="announcement"
              rows={2}
              hint="Optional. Shown on the trainer's read-only dashboard."
              value={assignmentForm.announcement}
              onChange={(event) =>
                setAssignmentForm((a) => ({ ...a, announcement: event.target.value }))
              }
            />

            <div className={styles.action}>
              <Button type="submit" isLoading={createAssignmentMutation.isPending}>
                Create assignment
              </Button>
            </div>
          </form>
        )}
      </Card>

      <QueryBoundary query={assignmentsQuery} loadingLabel="Loading assignments">
        {({ assignments }) => (
          <Card title="Assignments">
            {assignments.length === 0 ? (
              <EmptyState title="No assignments yet" />
            ) : (
              <DataTable
                caption="Trainer assignments"
                columns={[
                  { key: 'trainer', header: 'Trainer', render: (row) => row.trainer?.fullName ?? '—' },
                  { key: 'program', header: 'Programme', render: (row) => row.program?.title ?? '—' },
                  { key: 'batchName', header: 'Batch' },
                  { key: 'candidateCount', header: 'Candidates' },
                  {
                    key: 'isActive',
                    header: 'Status',
                    render: (row) => (
                      <StatusBadge tone={row.isActive ? 'success' : 'neutral'}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    ),
                  },
                ]}
                rows={assignments}
                getRowKey={(row) => row.id}
              />
            )}
          </Card>
        )}
      </QueryBoundary>
    </>
  );
}

export default AdminProgramsPage;
