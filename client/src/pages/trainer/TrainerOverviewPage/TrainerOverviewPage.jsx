import { useQuery } from '@tanstack/react-query';
import { ArrowRight, GraduationCap, Layers, Megaphone, UserRound, Users } from 'lucide-react';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import DashboardHero from '../../../components/dashboard/DashboardHero/DashboardHero.jsx';
import StatCard from '../../../components/dashboard/StatCard/StatCard.jsx';
import PhotoPromoCard from '../../../components/dashboard/PhotoPromoCard/PhotoPromoCard.jsx';
import { useAuth } from '../../../auth/useAuth.js';
import { getTrainerDashboard } from '../../../api/endpoints/trainer.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { PHOTOS } from '../../../constants/photos.js';
import { formatDateTime } from '../../../utils/format.js';
import styles from './TrainerOverviewPage.module.scss';

function TrainerOverviewPage() {
  const { user } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: queryKeys.trainer.dashboard,
    queryFn: getTrainerDashboard,
  });
  const summary = dashboardQuery.data?.summary;

  return (
    <>
      <DashboardHero
        eyebrow="Trainer console"
        greeting="Welcome back,"
        name={user.firstName}
        subtitle="Here's what's happening with your assigned programmes and batches today."
        photo="/illustrations/hero-trainer.png"
        script="Great trainers build great talent."
        chips={
          summary
            ? [
                { icon: Layers, label: 'Active batches', value: summary.activeAssignments },
                { icon: Users, label: 'Candidates', value: summary.totalCandidates },
              ]
            : []
        }
      >
        <Button to="/trainer/assignments">
          My assignments
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </DashboardHero>

      <QueryBoundary query={dashboardQuery} loadingLabel="Loading your dashboard">
        {({ profile, summary: totals, assignments }) => {
          const announcements = assignments.filter((assignment) => assignment.announcement);

          return (
            <>
              <div className={styles.stats}>
                <StatCard
                  label="Active batches"
                  value={totals.activeAssignments}
                  icon={Layers}
                  to="/trainer/assignments"
                  tone="featured"
                />
                <StatCard label="Candidates assigned" value={totals.totalCandidates} icon={Users} />
                <StatCard label="Assignments in total" value={totals.totalAssignments} icon={GraduationCap} />
              </div>

              <div className={styles.activityGrid}>
                <div className={styles.mainColumn}>
                  <Card
                    title={
                      <span className={styles.cardTitle}>
                        <span className={styles.cardIcon} aria-hidden="true">
                          <Megaphone size={18} />
                        </span>
                        Announcements
                      </span>
                    }
                    description="Updates from your administrator for each batch."
                  >
                    {announcements.length > 0 ? (
                      <ul className={styles.announcements}>
                        {announcements.map((assignment) => (
                          <li key={assignment.id}>
                            <Alert
                              variant="info"
                              title={`${assignment.program?.title ?? 'Programme'} — ${assignment.batchName}`}
                            >
                              {assignment.announcement}
                            </Alert>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        icon={Megaphone}
                        title="No announcements"
                        description="Your administrator has not posted any announcements for your batches yet."
                      />
                    )}

                    {assignments.length === 0 ? (
                      <EmptyState
                        icon={GraduationCap}
                        title="No assignments yet"
                        description="Your administrator has not assigned you to a programme or batch. They will appear here once they do."
                      />
                    ) : null}
                  </Card>

                  <PhotoPromoCard
                    wide
                    photo={PHOTOS.studyGroupLaptops}
                    icon={GraduationCap}
                    eyebrow="Your cohorts"
                    title="Every session shapes a career."
                    action={
                      <Button to="/trainer/assignments" variant="secondary">
                        View my batches
                      </Button>
                    }
                  >
                    <p>Track candidate progress and keep each batch moving toward the talent pool.</p>
                  </PhotoPromoCard>
                </div>

                <div className={styles.sideColumn}>
                  <Card
                    title={
                      <span className={styles.cardTitle}>
                        <span className={styles.cardIcon} aria-hidden="true">
                          <UserRound size={18} />
                        </span>
                        Your account
                      </span>
                    }
                    actions={
                      <StatusBadge tone={profile.isActive ? 'success' : 'neutral'}>
                        {profile.isActive ? 'Active' : 'Deactivated'}
                      </StatusBadge>
                    }
                  >
                    <dl className={styles.summary}>
                      <div>
                        <dt>Name</dt>
                        <dd>{profile.fullName}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{profile.email}</dd>
                      </div>
                      <div>
                        <dt>Last sign-in</dt>
                        <dd>
                          {profile.lastLoginAt
                            ? formatDateTime(profile.lastLoginAt)
                            : 'This is your first visit'}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                </div>
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}

export default TrainerOverviewPage;
