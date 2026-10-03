import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import Card from '../../../../components/ui/Card/Card.jsx';
import Button from '../../../../components/ui/Button/Button.jsx';
import DocumentUploadField from '../../../../components/ui/DocumentUploadField/DocumentUploadField.jsx';
import Alert from '../../../../components/feedback/Alert/Alert.jsx';
import { putMyDocuments } from '../../../../api/endpoints/talent.js';
import { getErrorMessage } from '../../../../api/http.js';
import styles from '../TalentOnboardingWizard.module.scss';

const SINGLE_SLOTS = [
  { type: 'passport_photo', label: 'Passport photograph', hint: 'A clear, recent passport-style photo.' },
  { type: 'resume', label: 'Resume / CV', hint: 'PNG, JPG or PDF.' },
  { type: 'national_id', label: 'National ID', hint: 'A valid government-issued ID.' },
];

function toPayloadDocument({ type, url, publicId, originalName, mimeType, size }) {
  return { type, url, publicId, originalName, mimeType, size };
}

function DocumentsStep({ candidate, onSaved, onNext, onBack }) {
  const [singleDocs, setSingleDocs] = useState(() => {
    const map = {};
    for (const slot of SINGLE_SLOTS) {
      map[slot.type] = candidate.documents.find((document) => document.type === slot.type) ?? null;
    }
    return map;
  });
  const [certificates, setCertificates] = useState(() =>
    candidate.documents.filter((document) => document.type === 'certificate'),
  );

  const singleDocsRef = useRef(singleDocs);
  const certificatesRef = useRef(certificates);
  const saveChainRef = useRef(Promise.resolve());

  const saveMutation = useMutation({
    mutationFn: putMyDocuments,
    onSuccess: (updated) => onSaved(updated),
  });

  const persist = (nextSingleDocs, nextCertificates) => {
    singleDocsRef.current = nextSingleDocs;
    certificatesRef.current = nextCertificates;
    setSingleDocs(nextSingleDocs);
    setCertificates(nextCertificates);

    saveChainRef.current = saveChainRef.current.catch(() => {}).then(() => {
      const documents = [
        ...Object.values(singleDocsRef.current).filter(Boolean),
        ...certificatesRef.current,
      ].map(toPayloadDocument);
      return saveMutation.mutateAsync(documents);
    });
  };

  const handleSingleChange = (type, document) => {
    const next = { ...singleDocsRef.current, [type]: document };
    persist(next, certificatesRef.current);
  };

  const handleCertificateChange = (index, document) => {
    const next = [...certificatesRef.current];
    if (document) {
      next[index] = document;
    } else {
      next.splice(index, 1);
    }
    persist(singleDocsRef.current, next);
  };

  return (
    <div className={styles.stepBody}>
      {saveMutation.isError ? (
        <Alert variant="error">{getErrorMessage(saveMutation.error, 'Unable to save this document.')}</Alert>
      ) : null}

      <Card
        title={
          <span className={styles.cardTitle}>
            <FileText size={18} aria-hidden="true" />
            Documents
          </span>
        }
        description="Each file uploads and saves immediately. Passport photograph, resume, and national ID are required."
      >
        <div className={styles.grid}>
          {SINGLE_SLOTS.map((slot) => (
            <DocumentUploadField
              key={slot.type}
              label={slot.label}
              hint={slot.hint}
              documentType={slot.type}
              value={singleDocs[slot.type]}
              onChange={(document) => handleSingleChange(slot.type, document)}
            />
          ))}
        </div>
      </Card>

      <Card title="Certifications" description="Optional. Add as many as you like.">
        <div className={styles.grid}>
          {certificates.map((document, index) => (
            <DocumentUploadField
              key={document.publicId ?? document.url}
              label={`Certificate ${index + 1}`}
              documentType="certificate"
              value={document}
              onChange={(next) => handleCertificateChange(index, next)}
            />
          ))}
          <DocumentUploadField
            label={certificates.length === 0 ? 'Certificate' : 'Add another certificate'}
            documentType="certificate"
            value={null}
            onChange={(next) => handleCertificateChange(certificates.length, next)}
          />
        </div>
      </Card>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={!candidate.hasRequiredDocuments}>
          {candidate.hasRequiredDocuments
            ? 'Continue to review'
            : 'Upload the required documents to continue'}
        </Button>
      </div>
    </div>
  );
}

export default DocumentsStep;
