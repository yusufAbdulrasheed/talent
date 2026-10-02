import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import Card from '../../../../components/ui/Card/Card.jsx';
import Button from '../../../../components/ui/Button/Button.jsx';
import TextField from '../../../../components/ui/TextField/TextField.jsx';
import SelectField from '../../../../components/ui/SelectField/SelectField.jsx';
import Alert from '../../../../components/feedback/Alert/Alert.jsx';
import { updateMyProfile } from '../../../../api/endpoints/talent.js';
import { getErrorMessage } from '../../../../api/http.js';
import { GENDER_OPTIONS } from '../../../../constants/candidateStatus.js';
import { toDateInputValue } from '../../../../utils/format.js';
import styles from '../TalentOnboardingWizard.module.scss';

function toFormState(candidate) {
  return {
    phoneNumber: candidate.phoneNumber ?? '',
    gender: candidate.gender ?? '',
    dateOfBirth: toDateInputValue(candidate.dateOfBirth),
    location: candidate.location ?? '',
  };
}

function toPayload(form) {
  const payload = {};
  for (const field of ['phoneNumber', 'gender', 'dateOfBirth', 'location']) {
    const value = form[field].trim();
    if (value) {
      payload[field] = value;
    }
  }
  return payload;
}

function PersonalInfoStep({ candidate, onSaved, onNext }) {
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
            <UserRound size={18} aria-hidden="true" />
            Personal information
          </span>
        }
        description="Tell us how to reach you."
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

      <div className={styles.actionsEnd}>
        <Button type="submit" isLoading={saveMutation.isPending}>
          Save &amp; continue
        </Button>
      </div>
    </form>
  );
}

export default PersonalInfoStep;
