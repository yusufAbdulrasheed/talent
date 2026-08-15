import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import {
  getAdminPlacementRequest,
  updatePlacementRequestStatus,
} from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import {
  PLACEMENT_STATUS_FILTER_OPTIONS,
  getEmploymentTypeLabel,
  getPlacementRequestStatusDetails,
} from '../../../constants/placementRequest.js';
import { formatDate, formatDateTime } from '../../../utils/format.js';
import styles from './AdminPlacementRequestDetailPage.module.scss';

function AdminPlacementRequestDetailPage() {
  const { id } = useParams();
  const requestQuery = useQuery({
    queryKey: queryKeys.admin.placementRequest(id),
    queryFn: () => getAdminPlacementRequest(id),
  });

  return (
    <QueryBoundary query={requestQuery} loadingLabel="Loading this request">
      {(request) => <RequestDetail request={request} id={id} />}
    </QueryBoundary>
  );
}

function RequestDetail({ request, id }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ status: request.status, adminNote: request.adminNote ?? '' });
  const status = getPlacementRequestStatusDetails(request.status);

  useEffect(() => {
    setForm({ status: request.status, adminNote: request.adminNote ?? '' });
  }, [request]);

  const updateMutation = useMutation({
    mutationFn: updatePlacementRequestStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  });

  return (
    <>
      <PageHeader
        title={request.jobTitle}
        description={`Requested by ${request.company?.companyName ?? 'an unknown company'}.`}
        meta={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
        actions={
          <Button to="/admin/placement-requests" variant="secondary">
            All requests
          </Button>
        }
      />

      {updateMutation.isSuccess ? (
        <Alert variant="success">Status updated. The recruiter has been notified by email.</Alert>
      ) : null}
      {updateMutation.isError ? (
        <Alert variant="error">{getErrorMessage(updateMutation.error, 'Unable to update this request.')}</Alert>
      ) : null}

      <Card
        title="Update status"
        description="The recruiter is emailed whenever the status changes, including any note you add."
      >
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate({
              id,
              status: form.status,
              adminNote: form.adminNote.trim() || undefined,
            });
          }}
        >
          <SelectField
            label="Status"
            name="status"
            options={PLACEMENT_STATUS_FILTER_OPTIONS}
            value={form.status}
            onChange={(event) => setForm((f) => ({ ...f, status: event.target.value }))}
          />
          <TextareaField
            label="Note to the recruiter"
            name="adminNote"
            rows={3}
            hint="Optional. Included in the email and shown on their request page."
            value={form.adminNote}
            onChange={(event) => setForm((f) => ({ ...f, adminNote: event.target.value }))}
          />
          <div className={styles.action}>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save status
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Request details">
        <dl className={styles.details}>
          <div>
            <dt>Company</dt>
            <dd>{request.company?.companyName ?? '—'}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{request.company?.contactPerson ?? '—'}</dd>
          </div>
          <div>
            <dt>Company email</dt>
            <dd>{request.company?.companyEmail ?? '—'}</dd>
          </div>
          <div>
            <dt>Candidate</dt>
            <dd className={styles.reference}>{request.candidate?.referenceNumber ?? '—'}</dd>
          </div>
          <div>
            <dt>Employment type</dt>
            <dd>{getEmploymentTypeLabel(request.employmentType)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{request.location}</dd>
          </div>
          <div>
            <dt>Number required</dt>
            <dd>{request.numberRequired}</dd>
          </div>
          <div>
            <dt>Salary range</dt>
            <dd>{request.salaryRange || '—'}</dd>
          </div>
          <div>
            <dt>Preferred start</dt>
            <dd>{request.startDate ? formatDate(request.startDate) : '—'}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{formatDateTime(request.createdAt)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Job description">
        <p className={styles.body}>{request.jobDescription}</p>
      </Card>

      {request.additionalNotes ? (
        <Card title="Recruiter notes">
          <p className={styles.body}>{request.additionalNotes}</p>
        </Card>
      ) : null}
    </>
  );
}

export default AdminPlacementRequestDetailPage;
