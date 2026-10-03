import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Send, UserRound, X } from 'lucide-react';
import Modal from '../../../components/ui/Modal/Modal.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import { createGroupPlacementRequest } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { EMPLOYMENT_TYPE_OPTIONS } from '../../../constants/placementRequest.js';
import styles from './GroupRequestModal.module.scss';

export const MAX_GROUP_SIZE = 20;

const INITIAL_ROLE = {
  jobTitle: '',
  jobDescription: '',
  employmentType: 'full_time',
  salaryRange: '',
  location: '',
  startDate: '',
  additionalNotes: '',
};

function GroupRequestModal({ isOpen, onClose, candidates, selected, onToggle, onSelectAll, onClearSelection }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('select');
  const [role, setRole] = useState(INITIAL_ROLE);
  const [jobTitleFilter, setJobTitleFilter] = useState('');

  const mutation = useMutation({
    mutationFn: createGroupPlacementRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruiter.all });
      setStep('done');
    },
  });

  const matchesJobTitleFilter = (candidate) => {
    const needle = jobTitleFilter.trim().toLowerCase();
    return !needle || (candidate.jobTitle ?? '').toLowerCase().includes(needle);
  };

  const onPage = new Set(candidates.map((candidate) => candidate.referenceNumber));
  const allRows = [...[...selected.values()].filter((candidate) => !onPage.has(candidate.referenceNumber)), ...candidates];
  const rows = allRows.filter(matchesJobTitleFilter);
  const visiblePageCandidates = candidates.filter(matchesJobTitleFilter);
  const selectedCount = selected.size;
  const allOnPageSelected =
    visiblePageCandidates.length > 0 && visiblePageCandidates.every((candidate) => selected.has(candidate.referenceNumber));

  const close = () => {
    if (step === 'done') {
      onClearSelection();
      setRole(INITIAL_ROLE);
      mutation.reset();
    }
    setStep('select');
    setJobTitleFilter('');
    onClose();
  };

  const handleRoleChange = (event) => {
    const { name, value } = event.target;
    setRole((previous) => ({ ...previous, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const payload = { candidateReferences: [...selected.keys()] };

    for (const [key, value] of Object.entries(role)) {
      const trimmed = value.trim();
      if (trimmed) payload[key] = trimmed;
    }

    mutation.mutate(payload);
  };

  const fieldError = (field) =>
    mutation.error?.response?.data?.details?.find((detail) => detail.field === field)?.message;

  if (step === 'done') {
    return (
      <Modal isOpen={isOpen} onClose={close} title="Request sent">
        <div className={styles.done}>
          <span className={styles.doneIcon} aria-hidden="true">
            <CheckCircle2 size={32} />
          </span>
          <h3>
            {selectedCount} {selectedCount === 1 ? 'talent' : 'talents'} requested
          </h3>
          <p>
            Our team has your request for <strong>{role.jobTitle}</strong> and will be in touch. You can follow
            each talent&rsquo;s progress under Placement requests.
          </p>
          <div className={styles.doneActions}>
            <Button to="/recruiter/requests" onClick={close}>
              View my requests
            </Button>
            <Button variant="secondary" onClick={close}>
              Keep browsing
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (step === 'details') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={close}
        size="lg"
        title="Describe the role"
        description={`One request for ${selectedCount} selected ${selectedCount === 1 ? 'talent' : 'talents'}. Our team reviews it and arranges the placements.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStep('select')}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </Button>
            <Button type="submit" form="group-request-form" isLoading={mutation.isPending}>
              <Send size={16} aria-hidden="true" />
              Send request to admin
            </Button>
          </>
        }
      >
        <form id="group-request-form" className={styles.form} onSubmit={submit} noValidate>
          {mutation.isError ? (
            <Alert variant="error">{getErrorMessage(mutation.error, 'Unable to send your request.')}</Alert>
          ) : null}

          <div>
            <p className={styles.chipsLabel}>Selected talents</p>
            <ul className={styles.chips}>
              {[...selected.values()].map((candidate) => (
                <li key={candidate.referenceNumber} className={styles.chip}>
                  {candidate.referenceNumber}
                  <button
                    type="button"
                    onClick={() => onToggle(candidate)}
                    aria-label={`Remove ${candidate.referenceNumber}`}
                    disabled={selectedCount === 1}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.grid}>
            <TextField
              label="Job title"
              name="jobTitle"
              required
              value={role.jobTitle}
              onChange={handleRoleChange}
              error={fieldError('jobTitle')}
            />
            <SelectField
              label="Employment type"
              name="employmentType"
              options={EMPLOYMENT_TYPE_OPTIONS}
              value={role.employmentType}
              onChange={handleRoleChange}
              error={fieldError('employmentType')}
            />
            <TextField
              label="Location"
              name="location"
              required
              hint="Where the role is based."
              value={role.location}
              onChange={handleRoleChange}
              error={fieldError('location')}
            />
            <TextField
              label="Salary range"
              name="salaryRange"
              hint="Optional."
              value={role.salaryRange}
              onChange={handleRoleChange}
              error={fieldError('salaryRange')}
            />
            <TextField
              label="Preferred start date"
              name="startDate"
              type="date"
              value={role.startDate}
              onChange={handleRoleChange}
              error={fieldError('startDate')}
            />
          </div>

          <TextareaField
            label="Job description"
            name="jobDescription"
            rows={5}
            required
            hint="Responsibilities, requirements, and anything else the talents should know."
            value={role.jobDescription}
            onChange={handleRoleChange}
            error={fieldError('jobDescription')}
          />
          <TextareaField
            label="Additional notes"
            name="additionalNotes"
            rows={2}
            hint="Optional. Anything our team should know."
            value={role.additionalNotes}
            onChange={handleRoleChange}
            error={fieldError('additionalNotes')}
          />
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      size="lg"
      title="Request multiple talents"
      description={`Select up to ${MAX_GROUP_SIZE} talents from your results, then describe the role once.`}
      footer={
        <>
          <p className={styles.count} aria-live="polite">
            <strong>{selectedCount}</strong> selected
          </p>
          <Button
            onClick={() => setStep('details')}
            disabled={selectedCount === 0 || selectedCount > MAX_GROUP_SIZE}
          >
            Continue
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </>
      }
    >
      <div className={styles.filterRow}>
        <TextField
          label="Filter by job title"
          name="groupRequestJobTitleFilter"
          placeholder="e.g. Frontend Developer"
          hint="Narrows this list only — it never affects your picks or the main search."
          value={jobTitleFilter}
          onChange={(event) => setJobTitleFilter(event.target.value)}
        />
      </div>

      <div className={styles.toolbar}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={() =>
              allOnPageSelected ? visiblePageCandidates.forEach(onToggle) : onSelectAll(visiblePageCandidates)
            }
          />
          {jobTitleFilter.trim() ? 'Select all matching on this page' : 'Select all on this page'}
        </label>
        {selectedCount > 0 ? (
          <button type="button" className={styles.clear} onClick={onClearSelection}>
            Clear selection
          </button>
        ) : null}
      </div>

      {selectedCount > MAX_GROUP_SIZE ? (
        <Alert variant="warning">Select at most {MAX_GROUP_SIZE} talents per request.</Alert>
      ) : null}

      {allRows.length === 0 ? (
        <p className={styles.empty}>No talents in your current results. Adjust your search and try again.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>
          No talents match &ldquo;{jobTitleFilter.trim()}&rdquo;.{' '}
          <button type="button" className={styles.clear} onClick={() => setJobTitleFilter('')}>
            Clear this filter
          </button>
        </p>
      ) : (
        <ul className={styles.list}>
          {rows.map((candidate) => {
            const isSelected = selected.has(candidate.referenceNumber);
            return (
              <li key={candidate.referenceNumber}>
                <label className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => onToggle(candidate)} />
                  <span className={styles.avatar} aria-hidden="true">
                    <UserRound size={18} />
                  </span>
                  <span className={styles.rowBody}>
                    <strong>{candidate.referenceNumber}</strong>
                    <span className={styles.rowMeta}>
                      {candidate.jobTitle || candidate.education || 'Verified professional'}
                      {candidate.location ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          <MapPin size={12} aria-hidden="true" />
                          {candidate.location}
                        </>
                      ) : null}
                    </span>
                  </span>
                  <span className={styles.rowSkills}>{(candidate.skills ?? []).slice(0, 3).join(' · ')}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

export default GroupRequestModal;
