import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  XCircle,
  Briefcase,
  BadgeCheck,
  GraduationCap,
  Layers,
  Wallet,
  ArrowRight,
  UserSearch,
  Newspaper,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import DashboardHero from '../../../components/dashboard/DashboardHero/DashboardHero.jsx';
import StatCard from '../../../components/dashboard/StatCard/StatCard.jsx';
import PhotoPromoCard from '../../../components/dashboard/PhotoPromoCard/PhotoPromoCard.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { useAuth } from '../../../auth/useAuth.js';
import { getDashboard, listAdminPlacementRequests } from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { formatCurrency, formatDate } from '../../../utils/format.js';
import { getPlacementRequestStatusDetails } from '../../../constants/placementRequest.js';
import { PHOTOS } from '../../../constants/photos.js';
import styles from './AdminOverviewPage.module.scss';

const QUICK_LINKS = [
  { to: '/admin/candidates', label: 'Review candidates', icon: UserSearch },
  { to: '/admin/recruiters', label: 'Approve recruiters', icon: Briefcase },
  { to: '/admin/trainers', label: 'Manage trainers', icon: GraduationCap },
  { to: '/admin/content-studio', label: 'Content Studio', icon: Newspaper },
];

function Section({ title, viewAllTo, viewAllLabel, wide = false, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {viewAllTo ? (
          <Link className={styles.sectionLink} to={viewAllTo}>
            {viewAllLabel}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className={`${styles.stats} ${wide ? styles.statsWide : ''}`}>{children}</div>
    </section>
  );
}

function RecentPlacementRequests() {
  const query = useQuery({
    queryKey: queryKeys.admin.placementRequests({ page: 1, limit: 5 }),
    queryFn: () => listAdminPlacementRequests({ page: 1, limit: 5 }),
  });

  const columns = [
    {
      key: 'jobTitle',
      header: 'Role',
      render: (row) => (
        <Link className={styles.tableLink} to={`/admin/placement-requests/${row.id}`}>
          {row.jobTitle}
        </Link>
      ),
    },
    { key: 'company', header: 'Company', render: (row) => row.company?.companyName ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const details = getPlacementRequestStatusDetails(row.status);
        return <StatusBadge tone={details.tone}>{details.label}</StatusBadge>;
      },
    },
    { key: 'createdAt', header: 'Submitted', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <Card
      title="Recent placement requests"
      actions={
        <Link className={styles.sectionLink} to="/admin/placement-requests">
          View all
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      }
    >
      <QueryBoundary query={query} loadingLabel="Loading recent requests">
        {({ placementRequests }) =>
          placementRequests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No placement requests yet"
              description="Requests submitted by recruiters will show up here."
            />
          ) : (
            <DataTable
              caption="Most recent placement requests"
              columns={columns}
              rows={placementRequests}
              getRowKey={(row) => row.id}
            />
          )
        }
      </QueryBoundary>
    </Card>
  );
}

function QuickLinks() {
  return (
    <Card title="Quick links">
      <ul className={styles.quickLinks}>
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.to}>
              <Link to={link.to} className={styles.quickLink}>
                <span className={styles.quickLinkIcon} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span>{link.label}</span>
                <ArrowRight size={16} className={styles.quickLinkArrow} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AdminOverviewPage() {
  const { user } = useAuth();
  const dashboardQuery = useQuery({ queryKey: queryKeys.admin.dashboard, queryFn: getDashboard });

  return (
    <>
      <DashboardHero
        eyebrow="Admin console"
        greeting="Welcome back,"
        name={user.firstName}
        subtitle="Here's what's happening across candidates, recruiters, payments, and placements today."
        photo="/illustrations/hero-admin.png"
        script="Building systems. Sustaining legacies."
        chips={
          dashboardQuery.data
            ? [
                { icon: Clock, label: 'Awaiting review', value: dashboardQuery.data.candidates.awaitingReview },
                { icon: FolderOpen, label: 'Open requests', value: dashboardQuery.data.placementRequests.open },
              ]
            : []
        }
      >
        <Button to="/admin/candidates">
          Review candidates
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
        <Button to="/admin/placement-requests" variant="secondary">
          Placement requests
        </Button>
      </DashboardHero>

      <QueryBoundary query={dashboardQuery} loadingLabel="Loading the dashboard">
        {(data) => (
          <div className={styles.dashboard}>
            <Section title="Candidates" viewAllTo="/admin/candidates" viewAllLabel="Review candidates">
              <StatCard
                label="Awaiting review"
                value={data.candidates.awaitingReview}
                icon={Clock}
                tone="urgent"
                to="/admin/candidates"
              />
              <StatCard label="Registered" value={data.candidates.total} icon={Users} />
              <StatCard label="Submitted" value={data.candidates.submitted} icon={CircleDollarSign} />
              <StatCard label="Approved" value={data.candidates.approved} icon={CheckCircle2} />
            </Section>

            <Section
              title="Placement requests"
              viewAllTo="/admin/placement-requests"
              viewAllLabel="Review requests"
            >
              <StatCard label="Total" value={data.placementRequests.total} icon={ClipboardList} />
              <StatCard
                label="Open"
                value={data.placementRequests.open}
                icon={FolderOpen}
                to="/admin/placement-requests"
              />
              <StatCard
                label="Fulfilled"
                value={data.placementRequests.byStatus.fulfilled ?? 0}
                icon={CheckCircle2}
              />
              <StatCard
                label="Closed"
                value={data.placementRequests.byStatus.closed ?? 0}
                icon={XCircle}
              />
            </Section>

            <Section title="Recruiters, trainers & programmes">
              <StatCard label="Recruiters" value={data.recruiters.total} icon={Briefcase} />
              <StatCard label="Approved recruiters" value={data.recruiters.approved} icon={BadgeCheck} />
              <StatCard label="Active trainers" value={data.trainers.active} icon={GraduationCap} />
              <StatCard label="Active programmes" value={data.programs.active} icon={Layers} />
            </Section>

            <Section title="Payments" viewAllTo="/admin/payments" viewAllLabel="View payments" wide>
              <StatCard
                label="Successful payments"
                value={data.payments.successfulCount}
                icon={CircleDollarSign}
              />
              <StatCard
                label="Total received"
                value={formatCurrency(data.payments.totalAmount)}
                icon={Wallet}
                tone="featured"
                to="/admin/payments"
              />
            </Section>

            <div className={styles.activityGrid}>
              <div className={styles.sideColumn}>
                <RecentPlacementRequests />
                <PhotoPromoCard
                  wide
                  photo={PHOTOS.techPairServerRoom}
                  icon={Newspaper}
                  eyebrow="Content Studio"
                  title="Share news with talent and employers."
                  action={
                    <Button to="/admin/content-studio" variant="secondary">
                      Open Content Studio
                    </Button>
                  }
                >
                  <p>Publish blog posts, events, gallery photos and testimonials to the public site.</p>
                </PhotoPromoCard>
              </div>
              <QuickLinks />
            </div>
          </div>
        )}
      </QueryBoundary>
    </>
  );
}

export default AdminOverviewPage;
