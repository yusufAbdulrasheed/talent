import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Lock, MapPin, Save, UserRound } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getMyCompany, updateMyCompany } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import styles from './RecruiterCompanyPage.module.scss';

const FIELDS = [
  'companyName',
  'cacNumber',
  'businessAddress',
  'companyEmail',
  'website',
  'industry',
  'phoneNumber',
  'contactPerson',
];

function toFormState(company) {
  return Object.fromEntries(FIELDS.map((field) => [field, company[field] ?? '']));
}

const LOCKED_FIELDS = new Set(['companyName', 'cacNumber']);

function toPayload(form, company) {
  const payload = {};

  if (!company.cacNumber && form.cacNumber.trim()) {
    payload.cacNumber = form.cacNumber.trim();
  }

  for (const field of FIELDS) {
    if (LOCKED_FIELDS.has(field)) {
      continue;
    }

    const value = form[field].trim();

    if (value) {
      payload[field] = value;
    }
  }

  return payload;
}

function SectionTitle({ icon, children }) {
  const Icon = icon;

  return (
    <span className={styles.sectionTitle}>
      <span className={styles.iconBadge} aria-hidden="true">
        <Icon size={18} strokeWidth={2} />
      </span>
      {children}
    </span>
  );
}

function LockedLabel({ children }) {
  return (
    <span className={styles.lockedLabel}>
      {children}
      <Lock size={13} aria-label="(locked)" />
    </span>
  );
}

function RecruiterCompanyPage() {
  const queryClient = useQueryClient();
  const companyQuery = useQuery({ queryKey: queryKeys.recruiter.company, queryFn: getMyCompany });

  return (
    <>
      <PageHeader
        title="Company profile"
        description="These details identify your organisation on every placement request you submit."
      />

      <QueryBoundary query={companyQuery} loadingLabel="Loading your company profile">
        {(company) => <CompanyForm company={company} queryClient={queryClient} />}
      </QueryBoundary>
    </>
  );
}

function CompanyForm({ company, queryClient }) {
  const [form, setForm] = useState(() => toFormState(company));

  useEffect(() => {
    setForm(toFormState(company));
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: updateMyCompany,
    onSuccess: (updated) => queryClient.setQueryData(queryKeys.recruiter.company, updated),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const fieldError = (field) =>
    saveMutation.error?.response?.data?.details?.find((detail) => detail.field === field)?.message;

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        saveMutation.mutate(toPayload(form, company));
      }}
    >
      {saveMutation.isSuccess ? <Alert variant="success">Your company profile has been saved.</Alert> : null}
      {saveMutation.isError ? (
        <Alert variant="error">{getErrorMessage(saveMutation.error, 'Unable to save your company profile.')}</Alert>
      ) : null}

      {company.isProfileComplete ? null : (
        <Alert variant="info">
          Complete your company details so our team can process your placement requests quickly.
        </Alert>
      )}

      <div className={styles.layout}>
        <div className={styles.main}>
          <Card
            title={<SectionTitle icon={Building2}>Core identity</SectionTitle>}
            actions={
              <StatusBadge tone={company.isApproved ? 'success' : 'warning'}>
                {company.isApproved ? 'Approved' : 'Pending approval'}
              </StatusBadge>
            }
          >
            <div className={styles.grid}>
              <TextField
                label={<LockedLabel>Company name</LockedLabel>}
                name="companyName"
                autoComplete="organization"
                value={form.companyName}
                disabled
                hint="Set when you registered. Contact support to change it."
              />
              {company.cacNumber ? (
                <TextField
                  label={<LockedLabel>CAC number</LockedLabel>}
                  name="cacNumber"
                  value={form.cacNumber}
                  disabled
                  hint="Recorded. Contact support if it needs correcting."
                />
              ) : (
                <TextField
                  label="CAC number"
                  name="cacNumber"
                  hint="Your Corporate Affairs Commission number. It can't be changed once saved."
                  value={form.cacNumber}
                  onChange={handleChange}
                  error={fieldError('cacNumber')}
                />
              )}
              <TextField
                label="Industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                error={fieldError('industry')}
              />
              <TextField
                label="Website"
                name="website"
                type="url"
                placeholder="https://example.com"
                hint="Include https://"
                value={form.website}
                onChange={handleChange}
                error={fieldError('website')}
              />
            </div>
          </Card>

          <Card title={<SectionTitle icon={MapPin}>Headquarters</SectionTitle>}>
            <TextareaField
              label="Business address"
              name="businessAddress"
              rows={3}
              value={form.businessAddress}
              onChange={handleChange}
              error={fieldError('businessAddress')}
            />
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card title={<SectionTitle icon={UserRound}>Primary contact</SectionTitle>}>
            <div className={styles.contactFields}>
              <TextField
                label="Contact person"
                name="contactPerson"
                autoComplete="name"
                value={form.contactPerson}
                onChange={handleChange}
                error={fieldError('contactPerson')}
              />
              <TextField
                label="Company email"
                name="companyEmail"
                type="email"
                autoComplete="email"
                value={form.companyEmail}
                onChange={handleChange}
                error={fieldError('companyEmail')}
              />
              <TextField
                label="Phone number"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={form.phoneNumber}
                onChange={handleChange}
                error={fieldError('phoneNumber')}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="submit" isLoading={saveMutation.isPending}>
          <Save size={16} aria-hidden="true" />
          Save company profile
        </Button>
      </div>
    </form>
  );
}

export default RecruiterCompanyPage;
