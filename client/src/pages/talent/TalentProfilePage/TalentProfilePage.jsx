import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getMyProfile, updateMyProfile } from '../../../api/endpoints/talent.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import {
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  GENDER_OPTIONS,
  getCandidateStatusDetails,
} from '../../../constants/candidateStatus.js';
import { formatList, parseList, toDateInputValue } from '../../../utils/format.js';
import styles from './TalentProfilePage.module.scss';

function toFormState(candidate) {
  return {
    phoneNumber: candidate.phoneNumber ?? '',
    gender: candidate.gender ?? '',
    dateOfBirth: toDateInputValue(candidate.dateOfBirth),
    location: candidate.location ?? '',
    education: candidate.education ?? '',
    skills: formatList(candidate.skills),
    certifications: formatList(candidate.certifications),
    workExperience: candidate.workExperience ?? '',
    availability: candidate.availability ?? '',
    experienceLevel: candidate.experienceLevel ?? '',
  };
}

/**
 * Builds the PATCH body. Empty values are omitted rather than sent as empty
 * strings, which the API would reject against its minimum-length rules.
 */
function toPayload(form) {
  const payload = {};
  const textFields = [
    'phoneNumber',
    'gender',
    'dateOfBirth',
    'location',
    'education',
    'workExperience',
    'availability',
    'experienceLevel',
  ];

  for (const field of textFields) {
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

function TalentProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: queryKeys.talent.profile, queryFn: getMyProfile });

  return (
    <>
      <PageHeader
        title="My profile"
        description="This information is what our team reviews, and what recruiters see anonymously once you are approved."
      />

      <QueryBoundary query={profileQuery} loadingLabel="Loading your profile">
        {(candidate) => <ProfileForm candidate={candidate} queryClient={queryClient} />}
      </QueryBoundary>
    </>
  );
}

function ProfileForm({ candidate, queryClient }) {
  const [form, setForm] = useState(() => toFormState(candidate));
  const status = getCandidateStatusDetails(candidate.status);

  // Re-sync when a save returns a changed record (status transitions, trimming).
  useEffect(() => {
    setForm(toFormState(candidate));
  }, [candidate]);

  const saveMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.talent.profile, updated);
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
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      {saveMutation.isSuccess ? (
        <Alert variant="success">Your profile has been saved.</Alert>
      ) : null}

      {saveMutation.isError ? (
        <Alert variant="error">{getErrorMessage(saveMutation.error, 'Unable to save your profile.')}</Alert>
      ) : null}

      {candidate.isProfileComplete ? null : (
        <Alert variant="info">
          Every field below is required before you can pay your training fee.
        </Alert>
      )}

      <Card
        title="Personal information"
        actions={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      >
        <div className={styles.grid}>
          <TextField
            label="Phone number"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            value={form.phoneNumber}
            onChange={handleChange}
            error={fieldError('phoneNumber')}
          />
          <SelectField
            label="Gender"
            name="gender"
            placeholder="Select an option"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={handleChange}
            error={fieldError('gender')}
          />
          <TextField
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange}
            error={fieldError('dateOfBirth')}
          />
          <TextField
            label="Location"
            name="location"
            autoComplete="address-level2"
            hint="City and state, e.g. Ikeja, Lagos."
            value={form.location}
            onChange={handleChange}
            error={fieldError('location')}
          />
        </div>
      </Card>

      <Card title="Professional information">
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

        <div className={styles.grid}>
          <SelectField
            label="Availability"
            name="availability"
            placeholder="Select an option"
            options={AVAILABILITY_OPTIONS}
            value={form.availability}
            onChange={handleChange}
            error={fieldError('availability')}
          />
          <SelectField
            label="Experience level"
            name="experienceLevel"
            placeholder="Select an option"
            options={EXPERIENCE_LEVEL_OPTIONS}
            value={form.experienceLevel}
            onChange={handleChange}
            error={fieldError('experienceLevel')}
          />
        </div>
      </Card>

      <div className={styles.actions}>
        <Button type="submit" isLoading={saveMutation.isPending}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

export default TalentProfilePage;
