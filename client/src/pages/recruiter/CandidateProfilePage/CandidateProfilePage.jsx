import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TagList from '../../../components/ui/TagList/TagList.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getPoolCandidate } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
} from '../../../constants/candidateStatus.js';
import styles from './CandidateProfilePage.module.scss';

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label ?? '—';
}

function CandidateProfilePage() {
  const { reference } = useParams();
  const candidateQuery = useQuery({
    queryKey: queryKeys.recruiter.candidate(reference),
    queryFn: () => getPoolCandidate(reference),
  });

  return (
    <>
      <PageHeader
        title={reference}
        description="An anonymous profile. Personal details are shared only after a placement is agreed."
        actions={
          <>
            <Button to={`/recruiter/talent-pool/${reference}/request`}>Request placement</Button>
            <Button to="/recruiter/talent-pool" variant="secondary">
              Back to search
            </Button>
          </>
        }
      />

      <QueryBoundary query={candidateQuery} loadingLabel="Loading this profile">
        {(candidate) => (
          <>
            <Card title="Profile">
              <dl className={styles.summary}>
                <div>
                  <dt>Location</dt>
                  <dd>{candidate.location ?? '—'}</dd>
                </div>
                <div>
                  <dt>Experience level</dt>
                  <dd>{labelFor(EXPERIENCE_LEVEL_OPTIONS, candidate.experienceLevel)}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{labelFor(AVAILABILITY_OPTIONS, candidate.availability)}</dd>
                </div>
              </dl>
            </Card>

            <Card title="Skills">
              <TagList items={candidate.skills} label="Skills" emptyLabel="No skills listed." />
            </Card>

            <Card title="Certifications">
              <TagList
                items={candidate.certifications}
                label="Certifications"
                emptyLabel="No certifications listed."
              />
            </Card>

            <Card title="Education">
              <p className={candidate.education ? '' : styles.muted}>
                {candidate.education ?? 'Not provided.'}
              </p>
            </Card>

            <Alert variant="info" title="Why is this profile anonymous?">
              Candidate names, contact details, photographs, and documents stay private until a
              placement request has been reviewed and agreed. Submit a request and our team will
              handle the introduction. <Link to="/recruiter/requests">See your requests</Link>.
            </Alert>
          </>
        )}
      </QueryBoundary>
    </>
  );
}

export default CandidateProfilePage;
