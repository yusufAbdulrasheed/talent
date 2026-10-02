import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Hash,
  ListChecks,
  Search,
  Send,
  StickyNote,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getPlacementRequest } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  PLACEMENT_REQUEST_STATUSES,
  getEmploymentTypeLabel,
  getPlacementRequestStatusDetails,
} from '../../../constants/placementRequest.js';
import { formatDate, formatDateTime } from '../../../utils/format.js';
import styles from './PlacementRequestDetailPage.module.scss';

const STATUS_ICONS = {
  [PLACEMENT_REQUEST_STATUSES.SUBMITTED]: Send,
  [PLACEMENT_REQUEST_STATUSES.UNDER_REVIEW]: Search,
  [PLACEMENT_REQUEST_STATUSES.IN_PROGRESS]: Clock,
  [PLACEMENT_REQUEST_STATUSES.FULFILLED]: CheckCircle2,
  [PLACEMENT_REQUEST_STATUSES.CLOSED]: Archive,
};

function TitleWithIcon({ icon, children }) {
  const Icon = icon;

  return (
    <span className={styles.titleWithIcon}>
      <Icon size={18} aria-hidden="true" />
      {children}
    </span>
  );
}

function PlacementRequestDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const requestQuery = useQuery({
    queryKey: queryKeys.recruiter.request(id),
    queryFn: () => getPlacementRequest(id),
  });

  return (
    <QueryBoundary query={requestQuery} loadingLabel="Loading this request">
      {(request) => {
        const status = getPlacementRequestStatusDetails(request.status);
        const StatusIcon = STATUS_ICONS[request.status] ?? Clock;

        return (
          <>
            <PageHeader
              title={
                <span className={styles.titleWithIcon}>
                  <span className={styles.statusIcon}>
                    <StatusIcon size={20} aria-hidden="true" />
                  </span>
                  {request.jobTitle}
                </span>
              }
              description={status.description}
              meta={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
              actions={
                <Button to="/recruiter/requests" variant="secondary">
                  <ArrowLeft size={16} aria-hidden="true" />
                  All requests
                </Button>
              }
            />

            {location.state?.justSubmitted ? (
              <Alert variant="success" title="Request submitted">
                Our team has been notified and will review your request shortly.
              </Alert>
            ) : null}

            <div className={styles.layout}>
              <div className={styles.main}>
                <Card title={<TitleWithIcon icon={FileText}>Job description</TitleWithIcon>}>
                  <p className={styles.body}>{request.jobDescription}</p>
                </Card>

                {request.additionalNotes ? (
                  <Card title={<TitleWithIcon icon={StickyNote}>Additional notes</TitleWithIcon>}>
                    <p className={styles.body}>{request.additionalNotes}</p>
                  </Card>
                ) : null}
              </div>

              <div className={styles.sidebar}>
                <Card title="Status">
                  <div className={styles.statusPanel}>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    <dl className={styles.statusMeta}>
                      <div>
                        <dt>Submitted</dt>
                        <dd>{formatDateTime(request.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>Last updated</dt>
                        <dd>{formatDateTime(request.updatedAt)}</dd>
                      </div>
                    </dl>
                  </div>

                  {request.adminNote ? (
                    <Alert variant="info" title="Note from our team">
                      {request.adminNote}
                    </Alert>
                  ) : null}
                </Card>

                <Card title={<TitleWithIcon icon={ListChecks}>Request summary</TitleWithIcon>}>
                  <dl className={styles.details}>
                    <div>
                      <dt>Candidate reference</dt>
                      <dd className={styles.reference}>
                        <Hash size={12} aria-hidden="true" />
                        {request.candidateReference}
                      </dd>
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
                      <dt>Request type</dt>
                      <dd>{request.groupId ? 'Part of a multi-talent request' : 'Single talent'}</dd>
                    </div>
                    <div>
                      <dt>Salary range</dt>
                      <dd>{request.salaryRange || '—'}</dd>
                    </div>
                    <div>
                      <dt>Preferred start date</dt>
                      <dd>{request.startDate ? formatDate(request.startDate) : '—'}</dd>
                    </div>
                  </dl>
                </Card>
              </div>
            </div>
          </>
        );
      }}
    </QueryBoundary>
  );
}

export default PlacementRequestDetailPage;
