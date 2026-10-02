import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  ClipboardList,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  PiggyBank,
  Phone,
  Tag,
  User,
  Wallet,
} from 'lucide-react';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import TagList from '../../../components/ui/TagList/TagList.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import {
  configureCandidateSavings,
  decideSavingsWithdrawal,
  getCandidate,
  getCandidateSavings,
  updateCandidateAttributes,
  updateCandidateStatus,
} from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import {
  AVAILABILITY_OPTIONS,
  CANDIDATE_STATUSES,
  EXPERIENCE_LEVEL_OPTIONS,
  getCandidateStatusDetails,
  getPaymentStatusDetails,
} from '../../../constants/candidateStatus.js';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format.js';
import styles from './AdminCandidateDetailPage.module.scss';

const REVIEWABLE = [
  CANDIDATE_STATUSES.SUBMITTED,
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
  CANDIDATE_STATUSES.REJECTED,
];

function SectionTitle({ icon, children }) {
  const Icon = icon;

  return (
    <span className={styles.cardTitle}>
      <Icon size={18} aria-hidden="true" />
      {children}
    </span>
  );
}

function AdminCandidateDetailPage() {
  const { id } = useParams();
  const candidateQuery = useQuery({
    queryKey: queryKeys.admin.candidate(id),
    queryFn: () => getCandidate(id),
  });

  return (
    <QueryBoundary query={candidateQuery} loadingLabel="Loading this candidate">
      {({ candidate, payments }) => (
        <CandidateDetail candidate={candidate} payments={payments} id={id} />
      )}
    </QueryBoundary>
  );
}

function CandidateDetail({ candidate, payments, id }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [availability, setAvailability] = useState(candidate.availability ?? '');
  const [experienceLevel, setExperienceLevel] = useState(candidate.experienceLevel ?? '');
  const status = getCandidateStatusDetails(candidate.status);
  const canReview = REVIEWABLE.includes(candidate.status);

  const statusMutation = useMutation({
    mutationFn: updateCandidateStatus,
    onSuccess: () => {
      // Detail, list, and dashboard counts are all affected.
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      setNote('');
    },
  });

  const attributesMutation = useMutation({
    mutationFn: updateCandidateAttributes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });

  const decide = (nextStatus) => statusMutation.mutate({ id, status: nextStatus, note: note.trim() || undefined });

  const saveAttributes = () => {
    attributesMutation.mutate({
      id,
      ...(availability ? { availability } : {}),
      ...(experienceLevel ? { experienceLevel } : {}),
    });
  };

  const noteError = statusMutation.error?.response?.data?.details?.find(
    (detail) => detail.field === 'note',
  )?.message;

  return (
    <>
      <div className={styles.headerRow}>
        <div className={styles.headerMain}>
          <Link className={styles.backLink} to="/admin/candidates">
            <ArrowLeft size={15} aria-hidden="true" />
            Candidates
          </Link>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{candidate.fullName ?? candidate.referenceNumber}</h1>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          {candidate.jobTitle ? <p className={styles.jobTitleLine}>{candidate.jobTitle}</p> : null}
          <p className={styles.metaLine}>
            <span>{candidate.referenceNumber}</span>
            <span className={styles.dot} aria-hidden="true">
              &bull;
            </span>
            <span>Registered {formatDate(candidate.createdAt)}</span>
          </p>
        </div>

        {canReview ? (
          <div className={styles.headerActions}>
            <Button
              variant="danger"
              onClick={() => decide(CANDIDATE_STATUSES.REJECTED)}
              disabled={statusMutation.isPending || candidate.status === CANDIDATE_STATUSES.REJECTED}
            >
              Reject
            </Button>
            <Button
              variant="secondary"
              onClick={() => decide(CANDIDATE_STATUSES.UNDER_REVIEW)}
              disabled={statusMutation.isPending || candidate.status === CANDIDATE_STATUSES.UNDER_REVIEW}
            >
              Mark under review
            </Button>
            <Button
              onClick={() => decide(CANDIDATE_STATUSES.APPROVED)}
              isLoading={statusMutation.isPending}
              disabled={candidate.status === CANDIDATE_STATUSES.APPROVED}
            >
              Approve
            </Button>
          </div>
        ) : null}
      </div>

      {statusMutation.isSuccess ? <Alert variant="success">Candidate status updated.</Alert> : null}
      {statusMutation.isError ? (
        <Alert variant="error">{getErrorMessage(statusMutation.error, 'Unable to update this candidate.')}</Alert>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.main}>
          <Card title={<SectionTitle icon={User}>Candidate profile</SectionTitle>}>
            <dl className={styles.details}>
              <div>
                <dt>Job title</dt>
                <dd>{candidate.jobTitle ?? '—'}</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{candidate.gender?.replaceAll('_', ' ') ?? '—'}</dd>
              </div>
              <div>
                <dt>Date of birth</dt>
                <dd>{formatDate(candidate.dateOfBirth)}</dd>
              </div>
            </dl>

            <div className={styles.attributesForm}>
              <p className={styles.attributesHint}>
                Availability and experience level are set by an administrator, not the candidate.
              </p>
              {attributesMutation.isError ? (
                <Alert variant="error">
                  {getErrorMessage(attributesMutation.error, 'Unable to update these attributes.')}
                </Alert>
              ) : null}
              <div className={styles.grid}>
                <SelectField
                  label="Availability"
                  placeholder="Not set"
                  options={AVAILABILITY_OPTIONS}
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                />
                <SelectField
                  label="Experience level"
                  placeholder="Not set"
                  options={EXPERIENCE_LEVEL_OPTIONS}
                  value={experienceLevel}
                  onChange={(event) => setExperienceLevel(event.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={saveAttributes}
                isLoading={attributesMutation.isPending}
                disabled={!availability && !experienceLevel}
              >
                Save attributes
              </Button>
            </div>
          </Card>

          <Card
            title={<SectionTitle icon={Briefcase}>Professional bio</SectionTitle>}
            description="Shown to recruiters on the anonymous profile — check it names no one."
          >
            <p className={styles.body}>{candidate.bio || 'Not provided.'}</p>
          </Card>

          <Card title={<SectionTitle icon={Briefcase}>Professional experience</SectionTitle>}>
            <p className={styles.body}>{candidate.workExperience || 'Not provided.'}</p>
          </Card>

          <Card title={<SectionTitle icon={Tag}>Skills &amp; certifications</SectionTitle>}>
            <div className={styles.section}>
              <h3 className={styles.subheading}>Skills</h3>
              <TagList items={candidate.skills} label="Skills" emptyLabel="No skills listed." />
            </div>
            <div className={styles.section}>
              <h3 className={styles.subheading}>Certifications</h3>
              <TagList
                items={candidate.certifications}
                label="Certifications"
                emptyLabel="No certifications listed."
              />
            </div>
          </Card>

          <Card title={<SectionTitle icon={GraduationCap}>Education</SectionTitle>}>
            <p className={styles.body}>{candidate.education || 'Not provided.'}</p>
          </Card>

          <Card
            title={<SectionTitle icon={FileText}>Documents</SectionTitle>}
            description="Uploaded by the candidate during onboarding."
          >
            {candidate.documents.length === 0 ? (
              <EmptyState
                title="No documents uploaded"
                description="Document upload is not yet available in this build."
              />
            ) : (
              <DataTable
                caption="Uploaded documents"
                columns={[
                  { key: 'type', header: 'Type' },
                  { key: 'originalName', header: 'File name' },
                  { key: 'mimeType', header: 'Format' },
                  {
                    key: 'uploadedAt',
                    header: 'Uploaded',
                    render: (row) => formatDateTime(row.uploadedAt),
                  },
                ]}
                rows={candidate.documents}
                getRowKey={(row) => row.publicId ?? row.url}
              />
            )}
          </Card>

          <Card title={<SectionTitle icon={Wallet}>Payments</SectionTitle>}>
            {payments.length === 0 ? (
              <EmptyState title="No payments recorded" />
            ) : (
              <DataTable
                caption="Payments for this candidate"
                columns={[
                  { key: 'reference', header: 'Reference' },
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
                ]}
                rows={payments}
                getRowKey={(row) => row.reference}
              />
            )}
          </Card>

          {candidate.status === CANDIDATE_STATUSES.APPROVED ? (
            <CandidateSavingsCard candidateId={id} />
          ) : null}
        </div>

        <div className={styles.sidebar}>
          <Card title={<SectionTitle icon={Mail}>Contact information</SectionTitle>}>
            <ul className={styles.contactList}>
              <li className={styles.contactRow}>
                <span className={styles.contactIcon} aria-hidden="true">
                  <Mail size={15} />
                </span>
                <span className={styles.contactValue}>{candidate.email ?? '—'}</span>
                {candidate.isEmailVerified ? (
                  <StatusBadge tone="success">Verified</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">Unverified</StatusBadge>
                )}
              </li>
              <li className={styles.contactRow}>
                <span className={styles.contactIcon} aria-hidden="true">
                  <Phone size={15} />
                </span>
                <span className={styles.contactValue}>{candidate.phoneNumber ?? '—'}</span>
              </li>
              <li className={styles.contactRow}>
                <span className={styles.contactIcon} aria-hidden="true">
                  <MapPin size={15} />
                </span>
                <span className={styles.contactValue}>{candidate.location ?? '—'}</span>
              </li>
            </ul>
          </Card>

          <Card
            className={styles.reviewCard}
            title={<SectionTitle icon={ClipboardList}>Review decision</SectionTitle>}
            description={
              canReview
                ? 'Approving publishes this candidate to the recruiter talent pool. Rejecting requires a note.'
                : 'This candidate cannot be reviewed until their profile and required documents are complete.'
            }
          >
            {canReview ? (
              <TextareaField
                label="Reviewer note"
                name="note"
                rows={3}
                hint="Shown to the candidate. Required when rejecting."
                value={note}
                onChange={(event) => setNote(event.target.value)}
                error={noteError}
              />
            ) : (
              <Alert variant="warning">
                Current status is &ldquo;{status.label}&rdquo;. Review becomes available once the profile and
                required documents are complete.
              </Alert>
            )}

            {candidate.adminReview?.reviewedAt ? (
              <p className={styles.reviewMeta}>
                Last reviewed {formatDateTime(candidate.adminReview.reviewedAt)}
                {candidate.adminReview.note ? ` — “${candidate.adminReview.note}”` : ''}
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}

const SAVINGS_STATUS_TONE = { active: 'success', discontinued: 'warning', not_started: 'neutral' };
const WITHDRAWAL_STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' };

function CandidateSavingsCard({ candidateId }) {
  const queryClient = useQueryClient();
  const savingsQuery = useQuery({
    queryKey: queryKeys.admin.candidateSavings(candidateId),
    queryFn: () => getCandidateSavings(candidateId),
  });
  const [monthlySalary, setMonthlySalary] = useState('');
  const [savingsRate, setSavingsRate] = useState('10');
  const [rejectingId, setRejectingId] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');

  const configureMutation = useMutation({
    mutationFn: configureCandidateSavings,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.admin.candidateSavings(candidateId), updated);
    },
  });

  const decideMutation = useMutation({
    mutationFn: decideSavingsWithdrawal,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.admin.candidateSavings(candidateId), updated);
      setRejectingId(null);
      setDecisionNote('');
    },
  });

  const handleConfigure = (event) => {
    event.preventDefault();
    configureMutation.mutate({
      id: candidateId,
      monthlySalary: Number(monthlySalary),
      savingsRate: Number(savingsRate),
    });
  };

  const decide = (requestId, decisionStatus) => {
    if (decisionStatus === 'rejected' && rejectingId !== requestId) {
      setRejectingId(requestId);
      return;
    }

    decideMutation.mutate({
      candidateId,
      requestId,
      status: decisionStatus,
      decisionNote: decisionNote.trim() || undefined,
    });
  };

  return (
    <Card title={<SectionTitle icon={PiggyBank}>Savings</SectionTitle>}>
      <QueryBoundary query={savingsQuery} loadingLabel="Loading savings">
        {(savings) => (
          <>
            {configureMutation.isError ? (
              <Alert variant="error">
                {getErrorMessage(configureMutation.error, 'Unable to configure savings.')}
              </Alert>
            ) : null}
            {decideMutation.isError ? (
              <Alert variant="error">
                {getErrorMessage(decideMutation.error, 'Unable to update this withdrawal request.')}
              </Alert>
            ) : null}

            <p className={styles.statusRow}>
              <StatusBadge tone={SAVINGS_STATUS_TONE[savings.status]}>
                {savings.status.replaceAll('_', ' ')}
              </StatusBadge>
              {savings.status !== 'not_started' ? (
                <span className={styles.body}>{formatCurrency(savings.balance)} saved</span>
              ) : null}
            </p>

            <form onSubmit={handleConfigure} className={styles.grid}>
              <TextField
                label="Monthly salary"
                type="number"
                min="1"
                step="0.01"
                placeholder={savings.monthlySalary ?? ''}
                value={monthlySalary}
                onChange={(event) => setMonthlySalary(event.target.value)}
                required
              />
              <SelectField
                label="Savings rate"
                options={Array.from({ length: 6 }, (_, index) => ({
                  value: String(index + 5),
                  label: `${index + 5}%`,
                }))}
                value={savingsRate}
                onChange={(event) => setSavingsRate(event.target.value)}
              />
              <Button type="submit" size="sm" isLoading={configureMutation.isPending}>
                {savings.status === 'not_started' ? 'Activate savings' : 'Update salary & rate'}
              </Button>
            </form>

            {savings.status !== 'not_started' ? (
              <>
                <div className={styles.section}>
                  <h3 className={styles.subheading}>Accrual history</h3>
                  {savings.ledger.filter((entry) => entry.type === 'accrual').length === 0 ? (
                    <EmptyState title="No accruals yet" />
                  ) : (
                    <DataTable
                      caption="Monthly accruals"
                      columns={[
                        { key: 'period', header: 'Month' },
                        { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
                        {
                          key: 'balanceAfter',
                          header: 'Balance after',
                          render: (row) => formatCurrency(row.balanceAfter),
                        },
                      ]}
                      rows={savings.ledger.filter((entry) => entry.type === 'accrual')}
                      getRowKey={(row) => `${row.period}-${row.type}`}
                    />
                  )}
                </div>

                <div className={styles.section}>
                  <h3 className={styles.subheading}>Withdrawal requests</h3>
                  {savings.withdrawalRequests.length === 0 ? (
                    <EmptyState title="No withdrawal requests" />
                  ) : (
                    <ul className={styles.withdrawalList}>
                      {savings.withdrawalRequests.map((withdrawal) => (
                        <li key={withdrawal.id} className={styles.withdrawalRow}>
                          <span className={styles.body}>
                            {formatCurrency(withdrawal.amount)} &bull; requested {formatDate(withdrawal.requestedAt)}
                          </span>
                          <StatusBadge tone={WITHDRAWAL_STATUS_TONE[withdrawal.status]}>
                            {withdrawal.status}
                          </StatusBadge>
                          {withdrawal.status === 'pending' ? (
                            <div className={styles.withdrawalActions}>
                              {rejectingId === withdrawal.id ? (
                                <TextareaField
                                  label="Rejection note"
                                  rows={2}
                                  value={decisionNote}
                                  onChange={(event) => setDecisionNote(event.target.value)}
                                />
                              ) : null}
                              <div className={styles.withdrawalButtons}>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => decide(withdrawal.id, 'rejected')}
                                  isLoading={decideMutation.isPending && rejectingId === withdrawal.id}
                                >
                                  {rejectingId === withdrawal.id ? 'Confirm reject' : 'Reject'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => decide(withdrawal.id, 'approved')}
                                  isLoading={decideMutation.isPending && rejectingId !== withdrawal.id}
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : null}
          </>
        )}
      </QueryBoundary>
    </Card>
  );
}

export default AdminCandidateDetailPage;
