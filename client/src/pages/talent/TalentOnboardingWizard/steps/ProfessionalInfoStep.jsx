import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import Card from '../../../../components/ui/Card/Card.jsx';
import Button from '../../../../components/ui/Button/Button.jsx';
import TextField from '../../../../components/ui/TextField/TextField.jsx';
import TextareaField from '../../../../components/ui/TextareaField/TextareaField.jsx';
import Alert from '../../../../components/feedback/Alert/Alert.jsx';
import { updateMyProfile } from '../../../../api/endpoints/talent.js';
import { getErrorMessage } from '../../../../api/http.js';
import { formatList, parseList } from '../../../../utils/format.js';
import styles from '../TalentOnboardingWizard.module.scss';

function toFormState(candidate) {
  return {
    jobTitle: candidate.jobTitle ?? '',
    bio: candidate.bio ?? '',
    education: candidate.education ?? '',
    skills: formatList(candidate.skills),
    certifications: formatList(candidate.certifications),
    workExperience: candidate.workExperience ?? '',
  };
}

function toPayload(form) {
  const payload = {};

  for (const field of ['jobTitle', 'bio', 'education', 'workExperience']) {
    const value = form[field].trim();
    if (value) {
      payload[field] = value;
    }
  }

  for (const field of ['skills', 'certifications']) {
    const list = parseList(form[field]);
    if (list.length > 0) {
      payload[field] = list;
    }
  }

  return payload;
}

function ProfessionalInfoStep({ candidate, onSaved, onNext, onBack }) {
  const [form, setForm] = useState(() => toFormState(candidate));

  const saveMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => {
      onSaved(updated);
      onNext();
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveMutation.mutate(toPayload(form));
  };

  const fieldError = (field) =>
    saveMutation.error?.response?.data?.details?.find((detail) => detail.field === field)?.message;

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.stepBody}>
      {saveMutation.isError ? (
        <Alert variant="error">{getErrorMessage(saveMutation.error, 'Unable to save your details.')}</Alert>
      ) : null}

      <Card
        title={
          <span className={styles.cardTitle}>
            <Briefcase size={18} aria-hidden="true" />
            Professional information
          </span>
        }
        description="What you know, and where you've worked."
      >
        <TextField
          label="Job title"
          name="jobTitle"
          hint="The role you're presenting yourself for, e.g. Frontend Developer, Accounts Assistant, Registered Nurse."
          value={form.jobTitle}
          onChange={handleChange}
          error={fieldError('jobTitle')}
        />

        <TextareaField
          label="Professional bio"
          name="bio"
          rows={3}
          maxLength={600}
          hint="A short summary recruiters see on your anonymous profile. Don't include your name, employer names, or contact details."
          value={form.bio}
          onChange={handleChange}
          error={fieldError('bio')}
        />

        <TextareaField
          label="Education"
          name="education"
          rows={3}
          hint="Your qualifications, institutions, and years."
          value={form.education}
          onChange={handleChange}
          error={fieldError('education')}
        />

        <TextField
          label="Skills"
          name="skills"
          hint="Separate each skill with a comma, e.g. React, Node.js, Customer support."
          value={form.skills}
          onChange={handleChange}
          error={fieldError('skills')}
        />

        <TextField
          label="Certifications"
          name="certifications"
          hint="Separate each certification with a comma. Leave blank if you have none."
          value={form.certifications}
          onChange={handleChange}
          error={fieldError('certifications')}
        />

        <TextareaField
          label="Work experience"
          name="workExperience"
          rows={5}
          hint="Your roles, employers, and responsibilities."
          value={form.workExperience}
          onChange={handleChange}
          error={fieldError('workExperience')}
        />
      </Card>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" isLoading={saveMutation.isPending}>
          Save &amp; continue
        </Button>
      </div>
    </form>
  );
}

export default ProfessionalInfoStep;
