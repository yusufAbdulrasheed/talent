import { ScrollText } from 'lucide-react';
import Card from '../../../../components/ui/Card/Card.jsx';
import Button from '../../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../../components/ui/StatusBadge/StatusBadge.jsx';
import TagList from '../../../../components/ui/TagList/TagList.jsx';
import Alert from '../../../../components/feedback/Alert/Alert.jsx';
import { getCandidateStatusDetails } from '../../../../constants/candidateStatus.js';
import { formatDate } from '../../../../utils/format.js';
import styles from '../TalentOnboardingWizard.module.scss';

const DOCUMENT_LABELS = {
  passport_photo: 'Passport photograph',
  resume: 'Resume / CV',
  national_id: 'National ID',
  certificate: 'Certificate',
};

function ReviewStep({ candidate, onBack, onGoToStep }) {
  const status = getCandidateStatusDetails(candidate.status);
  const isComplete = candidate.isProfileComplete && candidate.hasRequiredDocuments;

  return (
    <div className={styles.stepBody}>
      {isComplete ? (
        <Alert variant="success" title="Your application is complete">
          Your profile and documents have been submitted. Our team will review your application shortly —
          you can track progress from your dashboard.
        </Alert>
      ) : (
        <Alert variant="warning" title="Almost there">
          A few required details are still missing. Go back to the earlier steps to finish them.
        </Alert>
      )}

      <Card
        title={
          <span className={styles.cardTitle}>
            <ScrollText size={18} aria-hidden="true" />
            Personal information
          </span>
        }
        actions={
          <button type="button" className={styles.linkAction} onClick={() => onGoToStep(0)}>
            Edit
          </button>
        }
      >
        <dl className={styles.summaryList}>
          <div>
            <dt>Phone number</dt>
            <dd>{candidate.phoneNumber || '—'}</dd>
          </div>
          <div>
            <dt>Gender</dt>
            <dd>{candidate.gender?.replaceAll('_', ' ') || '—'}</dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{formatDate(candidate.dateOfBirth)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{candidate.location || '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card
        title="Professional information"
        actions={
          <button type="button" className={styles.linkAction} onClick={() => onGoToStep(1)}>
            Edit
          </button>
        }
      >
        <dl className={styles.summaryList}>
          <div>
            <dt>Job title</dt>
            <dd>{candidate.jobTitle || '—'}</dd>
          </div>
          <div>
            <dt>Professional bio</dt>
            <dd>{candidate.bio || '—'}</dd>
          </div>
          <div>
            <dt>Education</dt>
            <dd>{candidate.education || '—'}</dd>
          </div>
          <div>
            <dt>Work experience</dt>
            <dd>{candidate.workExperience || '—'}</dd>
          </div>
        </dl>
        <div className={styles.summarySection}>
          <h3 className={styles.summarySubheading}>Skills</h3>
          <TagList items={candidate.skills} label="Skills" emptyLabel="No skills listed." />
        </div>
        <div className={styles.summarySection}>
          <h3 className={styles.summarySubheading}>Certifications</h3>
          <TagList
            items={candidate.certifications}
            label="Certifications"
            emptyLabel="No certifications listed."
          />
        </div>
      </Card>

      <Card
        title="Documents"
        actions={
          <button type="button" className={styles.linkAction} onClick={() => onGoToStep(2)}>
            Edit
          </button>
        }
      >
        {candidate.documents.length === 0 ? (
          <p className={styles.body}>No documents uploaded yet.</p>
        ) : (
          <ul className={styles.documentList}>
            {candidate.documents.map((document) => (
              <li key={document.publicId ?? document.url} className={styles.documentItem}>
                <span>{DOCUMENT_LABELS[document.type] ?? document.type}</span>
                <span className={styles.documentName}>{document.originalName}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Application status">
        <div className={styles.summaryList}>
          <div>
            <dt>Reference number</dt>
            <dd>{candidate.referenceNumber}</dd>
          </div>
        </div>
        <p className={styles.statusRow}>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          <span className={styles.body}>{status.description}</span>
        </p>
      </Card>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button to="/talent">Return to dashboard</Button>
      </div>
    </div>
  );
}

export default ReviewStep;
