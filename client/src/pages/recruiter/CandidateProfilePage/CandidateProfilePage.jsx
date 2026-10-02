import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  Briefcase,
  Crown,
  GraduationCap,
  IdCard,
  MapPin,
  Quote,
  Send,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TagList from '../../../components/ui/TagList/TagList.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getPoolCandidate } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import styles from './CandidateProfilePage.module.scss';

function TitleWithIcon({ icon, children }) {
  const Icon = icon;

  return (
    <span className={styles.titleWithIcon}>
      <Icon size={18} aria-hidden="true" />
      {children}
    </span>
  );
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
            {candidateQuery.data && !candidateQuery.data.locked ? (
              <Button to={`/recruiter/talent-pool/${reference}/request`}>
                <Send size={16} aria-hidden="true" />
                Request placement
              </Button>
            ) : null}
            <Button to="/recruiter/talent-pool" variant="secondary">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to search
            </Button>
          </>
        }
      />

      <QueryBoundary query={candidateQuery} loadingLabel="Loading this profile">
        {(candidate) =>
          candidate.locked ? (
            <Card
              className={styles.lockedCard}
              title={<TitleWithIcon icon={Crown}>Premium talent</TitleWithIcon>}
            >
              <p className={styles.summaryValue}>
                This candidate is outside your current subscription tier. Subscribe to a higher tier to
                view their full profile and request a placement.
              </p>
              <p className={styles.muted}>
                Location: {candidate.location ?? '—'} &bull; {candidate.skillsCount} skill
                {candidate.skillsCount === 1 ? '' : 's'} listed.
              </p>
              <Button to="/recruiter/subscription">Subscribe to unlock</Button>
            </Card>
          ) : (
            <>
              <div className={styles.layout}>
                <div className={styles.aside}>
                  <Card title={<TitleWithIcon icon={IdCard}>Summary</TitleWithIcon>}>
                    <ul className={styles.summaryList}>
                      <li>
                        <Briefcase size={16} aria-hidden="true" />
                        <div>
                          <p className={styles.summaryLabel}>Job title</p>
                          <p className={styles.summaryValue}>{candidate.jobTitle ?? '—'}</p>
                        </div>
                      </li>
                      <li>
                        <MapPin size={16} aria-hidden="true" />
                        <div>
                          <p className={styles.summaryLabel}>Location</p>
                          <p className={styles.summaryValue}>{candidate.location ?? '—'}</p>
                        </div>
                      </li>
                    </ul>
                  </Card>

                  <Card title={<TitleWithIcon icon={Sparkles}>Top skills</TitleWithIcon>}>
                    <TagList items={candidate.skills} label="Skills" emptyLabel="No skills listed." />
                  </Card>
                </div>

                <div className={styles.main}>
                  <Card title={<TitleWithIcon icon={Quote}>About this talent</TitleWithIcon>}>
                    <p className={candidate.bio ? styles.bio : styles.muted}>
                      {candidate.bio ?? 'This talent has not written a bio yet.'}
                    </p>
                  </Card>

                  <Card title={<TitleWithIcon icon={Award}>Certifications</TitleWithIcon>}>
                    <TagList
                      items={candidate.certifications}
                      label="Certifications"
                      emptyLabel="No certifications listed."
                    />
                  </Card>

                  <Card title={<TitleWithIcon icon={GraduationCap}>Education</TitleWithIcon>}>
                    <p className={candidate.education ? '' : styles.muted}>
                      {candidate.education ?? 'Not provided.'}
                    </p>
                  </Card>
                </div>
              </div>

              <Alert variant="info" title="Why is this profile anonymous?">
                Candidate names, contact details, photographs, and documents stay private until a
                placement request has been reviewed and agreed. Submit a request and our team will
                handle the introduction. <Link to="/recruiter/requests">See your requests</Link>.
              </Alert>
            </>
          )
        }
      </QueryBoundary>
    </>
  );
}

export default CandidateProfilePage;
