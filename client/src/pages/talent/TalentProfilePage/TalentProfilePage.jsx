import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import TalentOnboardingWizard from '../TalentOnboardingWizard/TalentOnboardingWizard.jsx';
import { getMyProfile } from '../../../api/endpoints/talent.js';
import { queryKeys } from '../../../api/queryKeys.js';

function TalentProfilePage() {
  const profileQuery = useQuery({ queryKey: queryKeys.talent.profile, queryFn: getMyProfile });

  return (
    <>
      <PageHeader
        title="My profile"
        description="This information is what our team reviews, and what recruiters see anonymously once you are approved."
      />

      <QueryBoundary query={profileQuery} loadingLabel="Loading your profile">
        {(candidate) => <TalentOnboardingWizard candidate={candidate} />}
      </QueryBoundary>
    </>
  );
}

export default TalentProfilePage;
