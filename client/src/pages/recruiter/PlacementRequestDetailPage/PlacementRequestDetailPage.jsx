import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getPlacementRequest } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  getEmploymentTypeLabel,
  getPlacementRequestStatusDetails,
} from '../../../constants/placementRequest.js';
import { formatDate, formatDateTime } from '../../../utils/format.js';
import styles from './PlacementRequestDetailPage.module.scss';

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

        return (
          <>
            <PageHeader
              title={request.jobTitle}
              description={status.description}
              meta={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
              actions={
                <Button to="/recruiter/requests" variant="secondary">
                  All requests
                </Button>
              }
            />

            {location.state?.justSubmitted ? (
              <Alert variant="success" title="Request submitted">
                Our team has been notified and will review your request shortly.
              </Alert>
            ) : null}

            <Card title="Request details">
              <dl className={styles.details}>
                <div>
                  <dt>Candidate reference</dt>
                  <dd className={styles.reference}>{request.candidateReference}</dd>
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
                  <dt>Preferred start date</dt>
                  <dd>{request.startDate ? formatDate(request.startDate) : '—'}</dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDateTime(request.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDateTime(request.updatedAt)}</dd>
                </div>
              </dl>
            </Card>

            <Card title="Job description">
              <p className={styles.body}>{request.jobDescription}</p>
            </Card>

            {request.additionalNotes ? (
              <Card title="Additional notes">
                <p className={styles.body}>{request.additionalNotes}</p>
              </Card>
            ) : null}

            {request.adminNote ? (
              <Alert variant="info" title="Note from our team">
                {request.adminNote}
              </Alert>
            ) : null}
          </>
        );
      }}
    </QueryBoundary>
  );
}

export default PlacementRequestDetailPage;
