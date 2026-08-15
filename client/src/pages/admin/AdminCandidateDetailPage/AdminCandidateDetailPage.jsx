import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import TagList from '../../../components/ui/TagList/TagList.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getCandidate, updateCandidateStatus } from '../../../api/endpoints/admin.js';
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
  CANDIDATE_STATUSES.PAYMENT_CONFIRMED,
  CANDIDATE_STATUSES.UNDER_REVIEW,
  CANDIDATE_STATUSES.APPROVED,
  CANDIDATE_STATUSES.REJECTED,
];

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? '—';
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

  const decide = (nextStatus) => statusMutation.mutate({ id, status: nextStatus, note: note.trim() || undefined });

  const noteError = statusMutation.error?.response?.data?.details?.find(
    (detail) => detail.field === 'note',
  )?.message;

  return (
    <>
      <PageHeader
        title={candidate.referenceNumber}
        description={status.description}
        meta={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
        actions={
          <Button to="/admin/candidates" variant="secondary">
            All candidates
          </Button>
        }
      />

      {statusMutation.isSuccess ? <Alert variant="success">Candidate status updated.</Alert> : null}
      {statusMutation.isError ? (
        <Alert variant="error">{getErrorMessage(statusMutation.error, 'Unable to update this candidate.')}</Alert>
      ) : null}

      <Card
        title="Review decision"
        description={
          canReview
            ? 'Approving publishes this candidate to the recruiter talent pool. Rejecting requires a note.'
            : 'This candidate cannot be reviewed until their training payment is confirmed.'
        }
      >
        {canReview ? (
          <>
            <TextareaField
              label="Reviewer note"
              name="note"
              rows={3}
              hint="Shown to the candidate. Required when rejecting."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              error={noteError}
            />
            <div className={styles.decisionActions}>
              <Button
                onClick={() => decide(CANDIDATE_STATUSES.APPROVED)}
                isLoading={statusMutation.isPending}
                disabled={candidate.status === CANDIDATE_STATUSES.APPROVED}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => decide(CANDIDATE_STATUSES.UNDER_REVIEW)}
                disabled={statusMutation.isPending || candidate.status === CANDIDATE_STATUSES.UNDER_REVIEW}
              >
                Mark under review
              </Button>
              <Button
                variant="danger"
                onClick={() => decide(CANDIDATE_STATUSES.REJECTED)}
                disabled={statusMutation.isPending || candidate.status === CANDIDATE_STATUSES.REJECTED}
              >
                Reject
              </Button>
            </div>
          </>
        ) : (
          <Alert variant="warning">
            Current status is “{status.label}”. Review becomes available once payment is confirmed.
          </Alert>
        )}

        {candidate.adminReview?.reviewedAt ? (
          <p className={styles.reviewMeta}>
            Last reviewed {formatDateTime(candidate.adminReview.reviewedAt)}
            {candidate.adminReview.note ? ` — “${candidate.adminReview.note}”` : ''}
          </p>
        ) : null}
      </Card>

      <Card title="Personal information">
        <dl className={styles.details}>
          <div>
            <dt>Full name</dt>
            <dd>{candidate.fullName ?? '—'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              {candidate.email ?? '—'}{' '}
              {candidate.isEmailVerified ? (
                <StatusBadge tone="success">Verified</StatusBadge>
              ) : (
                <StatusBadge tone="warning">Unverified</StatusBadge>
              )}
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{candidate.phoneNumber ?? '—'}</dd>
          </div>
          <div>
            <dt>Gender</dt>
            <dd>{candidate.gender?.replaceAll('_', ' ') ?? '—'}</dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{formatDate(candidate.dateOfBirth)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{candidate.location ?? '—'}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{labelFor(AVAILABILITY_OPTIONS, candidate.availability)}</dd>
          </div>
          <div>
            <dt>Experience level</dt>
            <dd>{labelFor(EXPERIENCE_LEVEL_OPTIONS, candidate.experienceLevel)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Professional information">
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
        <div className={styles.section}>
          <h3 className={styles.subheading}>Education</h3>
          <p className={styles.body}>{candidate.education || 'Not provided.'}</p>
        </div>
        <div className={styles.section}>
          <h3 className={styles.subheading}>Work experience</h3>
          <p className={styles.body}>{candidate.workExperience || 'Not provided.'}</p>
        </div>
      </Card>

      <Card title="Documents" description="Uploaded by the candidate during onboarding.">
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
            getRowKey={(row) => row.storageKey}
          />
        )}
      </Card>

      <Card title="Payments">
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
    </>
  );
}

export default AdminCandidateDetailPage;
