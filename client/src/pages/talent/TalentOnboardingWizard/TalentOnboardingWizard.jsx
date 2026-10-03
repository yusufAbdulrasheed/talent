import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, FileText, ScrollText, UserRound, Briefcase } from 'lucide-react';
import { queryKeys } from '../../../api/queryKeys.js';
import PersonalInfoStep from './steps/PersonalInfoStep.jsx';
import ProfessionalInfoStep from './steps/ProfessionalInfoStep.jsx';
import DocumentsStep from './steps/DocumentsStep.jsx';
import ReviewStep from './steps/ReviewStep.jsx';
import styles from './TalentOnboardingWizard.module.scss';

const STEPS = [
  { key: 'personal', label: 'Personal info', icon: UserRound, Component: PersonalInfoStep },
  { key: 'professional', label: 'Professional info', icon: Briefcase, Component: ProfessionalInfoStep },
  { key: 'documents', label: 'Documents', icon: FileText, Component: DocumentsStep },
  { key: 'review', label: 'Review', icon: ScrollText, Component: ReviewStep },
];

function isPersonalComplete(candidate) {
  return Boolean(candidate.phoneNumber && candidate.gender && candidate.dateOfBirth && candidate.location);
}

function isProfessionalComplete(candidate) {
  return Boolean(candidate.education && candidate.skills.length > 0 && candidate.workExperience);
}

function computeFurthestStep(candidate) {
  if (!isPersonalComplete(candidate)) {
    return 0;
  }
  if (!isProfessionalComplete(candidate)) {
    return 1;
  }
  if (!candidate.hasRequiredDocuments) {
    return 2;
  }
  return 3;
}

function StepIndicator({ steps, stepIndex, maxReached, onSelect }) {
  return (
    <ol className={styles.steps}>
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isDone = index < maxReached;
        const isCurrent = index === stepIndex;
        const isReachable = index <= maxReached;

        return (
          <li key={step.key} className={styles.stepItem}>
            <button
              type="button"
              className={[
                styles.stepButton,
                isCurrent ? styles.stepButtonCurrent : '',
                isDone ? styles.stepButtonDone : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => isReachable && onSelect(index)}
              disabled={!isReachable}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className={styles.stepMarker} aria-hidden="true">
                {isDone ? <Check size={14} /> : <StepIcon size={14} />}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
            {index < steps.length - 1 ? (
              <span className={`${styles.stepConnector} ${isDone ? styles.stepConnectorDone : ''}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function TalentOnboardingWizard({ candidate }) {
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(() => computeFurthestStep(candidate));
  const [maxReached, setMaxReached] = useState(() => computeFurthestStep(candidate));

  const handleSaved = (updatedCandidate) => {
    queryClient.setQueryData(queryKeys.talent.profile, updatedCandidate);
  };

  const goToStep = (index) => {
    const clamped = Math.max(0, Math.min(index, STEPS.length - 1));
    setStepIndex(clamped);
    setMaxReached((current) => Math.max(current, clamped));
  };

  const goNext = () => goToStep(stepIndex + 1);
  const goBack = () => goToStep(stepIndex - 1);

  const { Component } = STEPS[stepIndex];

  return (
    <div className={styles.wizard}>
      <StepIndicator steps={STEPS} stepIndex={stepIndex} maxReached={maxReached} onSelect={goToStep} />

      <Component
        candidate={candidate}
        onSaved={handleSaved}
        onNext={goNext}
        onBack={stepIndex > 0 ? goBack : undefined}
        onGoToStep={goToStep}
      />
    </div>
  );
}

export default TalentOnboardingWizard;
