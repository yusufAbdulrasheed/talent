import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Send, StickyNote } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import { createPlacementRequest } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { EMPLOYMENT_TYPE_OPTIONS } from '../../../constants/placementRequest.js';
import styles from './PlacementRequestFormPage.module.scss';

const INITIAL_FORM = {
  jobTitle: '',
  jobDescription: '',
  employmentType: 'full_time',
  salaryRange: '',
  location: '',
  startDate: '',
  additionalNotes: '',
};

function PlacementRequestFormPage() {
  const { reference } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL_FORM);

  const createMutation = useMutation({
    mutationFn: createPlacementRequest,
    onSuccess: (placementRequest) => {
      // The list and the dashboard counts are both stale now.
      queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.all });
      navigate(`/recruiter/requests/${placementRequest.id}`, {
        replace: true,
        state: { justSubmitted: true },
      });
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = { candidateReference: reference };

    for (const [key, value] of Object.entries(form)) {
      const trimmed = String(value).trim();

      if (trimmed) {
        payload[key] = trimmed;
      }
    }

    createMutation.mutate(payload);
  };

  const fieldError = (field) =>
    createMutation.error?.response?.data?.details?.find((detail) => detail.field === field)?.message;

  return (
    <>
      <PageHeader
        title="Request placement"
        description={`Tell us about the role you want to fill with candidate ${reference}.`}
        actions={
          <Button to={`/recruiter/talent-pool/${reference}`} variant="secondary">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to profile
          </Button>
        }
      />

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {createMutation.isError ? (
          <Alert variant="error">
            {getErrorMessage(createMutation.error, 'Unable to submit your placement request.')}
          </Alert>
        ) : null}

        <Card
          title={
            <span className={styles.titleWithIcon}>
              <ClipboardList size={18} aria-hidden="true" />
              Role details
            </span>
          }
        >
          <div className={styles.grid}>
            <TextField
              label="Job title"
              name="jobTitle"
              required
              value={form.jobTitle}
              onChange={handleChange}
              error={fieldError('jobTitle')}
            />
            <SelectField
              label="Employment type"
              name="employmentType"
              options={EMPLOYMENT_TYPE_OPTIONS}
              value={form.employmentType}
              onChange={handleChange}
              error={fieldError('employmentType')}
            />
            <TextField
              label="Location"
              name="location"
              required
              hint="Where the role is based."
              value={form.location}
              onChange={handleChange}
              error={fieldError('location')}
            />
            <TextField
              label="Salary range"
              name="salaryRange"
              hint="Optional, e.g. ₦400,000 – ₦600,000 monthly."
              value={form.salaryRange}
              onChange={handleChange}
              error={fieldError('salaryRange')}
            />
            <TextField
              label="Preferred start date"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              error={fieldError('startDate')}
            />
          </div>

          <TextareaField
            label="Job description"
            name="jobDescription"
            rows={6}
            required
            hint="Responsibilities, requirements, and anything else the candidate should know."
            value={form.jobDescription}
            onChange={handleChange}
            error={fieldError('jobDescription')}
          />
        </Card>

        <Card
          title={
            <span className={styles.titleWithIcon}>
              <StickyNote size={18} aria-hidden="true" />
              Additional notes
            </span>
          }
          description="Optional. Anything our team should know when arranging this placement."
        >
          <TextareaField
            label="Additional notes"
            name="additionalNotes"
            rows={3}
            value={form.additionalNotes}
            onChange={handleChange}
            error={fieldError('additionalNotes')}
          />
        </Card>

        <div className={styles.actions}>
          <Button type="submit" isLoading={createMutation.isPending}>
            <Send size={16} aria-hidden="true" />
            Submit request
          </Button>
        </div>
      </form>
    </>
  );
}

export default PlacementRequestFormPage;
