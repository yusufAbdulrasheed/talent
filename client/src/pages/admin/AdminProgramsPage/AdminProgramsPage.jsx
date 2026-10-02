import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Megaphone, Plus, Users } from 'lucide-react';
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

/** Bento tile for a single training programme. */
function ProgramCard({ program, batchCount, candidateCount, isToggling, onToggle }) {
  const isActive = program.isActive;

  return (
    <article className={styles.programCard}>
      <div className={styles.programCardTop}>
        <span className={styles.programIcon} aria-hidden="true">
          <Layers size={20} strokeWidth={2} />
        </span>
        <StatusBadge tone={isActive ? 'success' : 'neutral'}>
          {isActive ? 'Active' : 'Inactive'}
        </StatusBadge>
      </div>

      <h3 className={styles.programTitle}>{program.title}</h3>
      <p className={styles.programDescription}>{program.description || 'No description yet.'}</p>

      <div className={styles.programFooter}>
        <span className={styles.programStat}>
          <Users size={14} aria-hidden="true" />
          {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
        </span>
        {candidateCount > 0 ? (
          <span className={styles.programStat}>{candidateCount} candidates</span>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          className={styles.programToggle}
          disabled={isToggling}
          onClick={onToggle}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </article>
  );
}

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
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });

  const createProgramMutation = useMutation({
    mutationFn: createProgram,
    onSuccess: () => {
      setProgramForm(EMPTY_PROGRAM);
      setShowProgramForm(false);
      invalidate();
    },
  });

  const toggleProgramMutation = useMutation({ mutationFn: updateProgram, onSuccess: invalidate });

  const createAssignmentMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      setAssignmentForm(EMPTY_ASSIGNMENT);
      setShowAssignmentForm(false);
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

  // Real, already-fetched assignment data — used to derive per-programme
  // batch/candidate counts and the announcements list. Nothing here is
  // invented: it's the same rows the "Trainer assignments" table renders.
  const assignments = useMemo(() => assignmentsQuery.data?.assignments ?? [], [assignmentsQuery.data]);

  const assignmentsByProgram = useMemo(() => {
    const map = new Map();
    assignments.forEach((assignment) => {
      const programId = assignment.program?.id;
      if (!programId) return;
      if (!map.has(programId)) map.set(programId, []);
      map.get(programId).push(assignment);
    });
    return map;
  }, [assignments]);

  const announcements = useMemo(
    () => assignments.filter((assignment) => assignment.announcement),
    [assignments],
  );

  return (
    <>
      <PageHeader
        title="Programs and batches"
        description="Define training programmes, then assign trainers to batches of candidates."
      />

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Active programmes</h2>
              <Button
                size="sm"
                variant={showProgramForm ? 'secondary' : 'primary'}
                onClick={() => setShowProgramForm((value) => !value)}
              >
                <Plus size={16} aria-hidden="true" />
                New programme
              </Button>
            </div>

            {showProgramForm ? (
              <Card>
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
            ) : null}

            <QueryBoundary query={programsQuery} loadingLabel="Loading programmes">
              {({ programs }) =>
                programs.length === 0 ? (
                  <EmptyState title="No programmes yet" description="Add your first programme above." />
                ) : (
                  <div className={styles.programGrid}>
                    {programs.map((program) => {
                      const programId = program._id ?? program.id;
                      const programAssignments = assignmentsByProgram.get(programId) ?? [];
                      const candidateCount = programAssignments.reduce(
                        (total, assignment) => total + (assignment.candidateCount ?? 0),
                        0,
                      );

                      return (
                        <ProgramCard
                          key={programId}
                          program={program}
                          batchCount={programAssignments.length}
                          candidateCount={candidateCount}
                          isToggling={toggleProgramMutation.isPending}
                          onToggle={() =>
                            toggleProgramMutation.mutate({ id: programId, isActive: !program.isActive })
                          }
                        />
                      );
                    })}
                  </div>
                )
              }
            </QueryBoundary>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Trainer assignments</h2>
              <Button
                size="sm"
                variant={showAssignmentForm ? 'secondary' : 'primary'}
                onClick={() => setShowAssignmentForm((value) => !value)}
              >
                <Plus size={16} aria-hidden="true" />
                New assignment
              </Button>
            </div>

            {showAssignmentForm ? (
              <Card>
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
            ) : null}

            <QueryBoundary query={assignmentsQuery} loadingLabel="Loading assignments">
              {({ assignments: rows }) => (
                <Card>
                  {rows.length === 0 ? (
                    <EmptyState title="No assignments yet" />
                  ) : (
                    <DataTable
                      caption="Trainer assignments"
                      columns={[
                        {
                          key: 'trainer',
                          header: 'Trainer',
                          render: (row) => row.trainer?.fullName ?? '—',
                        },
                        {
                          key: 'program',
                          header: 'Programme',
                          render: (row) => row.program?.title ?? '—',
                        },
                        { key: 'batchName', header: 'Batch' },
                        {
                          key: 'candidateCount',
                          header: 'Candidates',
                          render: (row) => (
                            <span className={styles.countCell}>
                              <Users size={14} aria-hidden="true" />
                              {row.candidateCount}
                            </span>
                          ),
                        },
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
                      rows={rows}
                      getRowKey={(row) => row.id}
                    />
                  )}
                </Card>
              )}
            </QueryBoundary>
          </section>
        </div>

        <div className={styles.sideColumn}>
          <Card
            title={
              <span className={styles.cardTitle}>
                <Megaphone size={18} aria-hidden="true" />
                Announcements
              </span>
            }
          >
            {announcements.length === 0 ? (
              <EmptyState
                title="No announcements yet"
                description="Announcements added to a batch assignment appear here."
              />
            ) : (
              <ul className={styles.announcementList}>
                {announcements.map((assignment) => (
                  <li key={assignment.id} className={styles.announcementItem}>
                    <p className={styles.announcementMeta}>
                      {assignment.program?.title ?? 'Programme'} · {assignment.batchName}
                    </p>
                    <p className={styles.announcementText}>{assignment.announcement}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export default AdminProgramsPage;
