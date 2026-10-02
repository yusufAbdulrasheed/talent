import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  SlidersHorizontal,
  FileText,
  MessageSquare,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Users,
  Wallet,
  User,
  Mail,
} from 'lucide-react';
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

function DetailRow({ icon, label, value }) {
  const Icon = icon;

  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon} aria-hidden="true">
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className={styles.detailBody}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={styles.detailValue}>{value}</span>
      </div>
    </div>
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
      <div className={styles.header}>
        <Link to="/admin/placement-requests" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          All requests
        </Link>

        <div className={styles.headerRow}>
          <div className={styles.headings}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{request.jobTitle}</h1>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <Briefcase size={14} aria-hidden="true" />
                {request.company?.companyName ?? 'Unknown company'}
              </span>
              <span className={styles.metaItem}>
                <Users size={14} aria-hidden="true" />
                <span className={styles.reference}>{request.candidate?.referenceNumber ?? '—'}</span>
              </span>
              <span className={styles.metaItem}>
                <Clock size={14} aria-hidden="true" />
                Submitted {formatDateTime(request.createdAt)}
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button to="/admin/placement-requests" variant="secondary">
              All requests
            </Button>
          </div>
        </div>
      </div>

      {updateMutation.isSuccess ? (
        <Alert variant="success">Status updated. The recruiter has been notified by email.</Alert>
      ) : null}
      {updateMutation.isError ? (
        <Alert variant="error">{getErrorMessage(updateMutation.error, 'Unable to update this request.')}</Alert>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <Card
            title={
              <span className={styles.cardTitle}>
                <Briefcase size={18} aria-hidden="true" />
                Request details
              </span>
            }
          >
            <div className={styles.detailGrid}>
              <DetailRow icon={Briefcase} label="Employment type" value={getEmploymentTypeLabel(request.employmentType)} />
              <DetailRow icon={MapPin} label="Location" value={request.location} />
              <DetailRow icon={Wallet} label="Salary range" value={request.salaryRange || '—'} />
              <DetailRow
                icon={Calendar}
                label="Preferred start"
                value={request.startDate ? formatDate(request.startDate) : '—'}
              />
              <DetailRow
                icon={Users}
                label="Request type"
                value={request.groupId ? 'Part of a multi-talent request' : 'Single talent'}
              />
              <DetailRow icon={User} label="Contact person" value={request.company?.contactPerson ?? '—'} />
              <DetailRow icon={Mail} label="Company email" value={request.company?.companyEmail ?? '—'} />
            </div>
          </Card>

          <Card
            title={
              <span className={styles.cardTitle}>
                <FileText size={18} aria-hidden="true" />
                Job description
              </span>
            }
          >
            <p className={styles.body}>{request.jobDescription}</p>
          </Card>

          {request.additionalNotes ? (
            <Card
              title={
                <span className={styles.cardTitle}>
                  <MessageSquare size={18} aria-hidden="true" />
                  Additional notes
                </span>
              }
            >
              <p className={styles.body}>{request.additionalNotes}</p>
            </Card>
          ) : null}
        </div>

        <div className={styles.sideColumn}>
          <Card
            className={styles.actionsCard}
            title={
              <span className={styles.cardTitle}>
                <SlidersHorizontal size={18} aria-hidden="true" />
                Admin actions
              </span>
            }
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
                <Button type="submit" isLoading={updateMutation.isPending} fullWidth>
                  Save status
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

export default AdminPlacementRequestDetailPage;
