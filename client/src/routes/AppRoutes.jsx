import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout/PublicLayout.jsx';
import PortalLayout from '../layouts/PortalLayout/PortalLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import GuestRoute from './GuestRoute.jsx';
import HomePage from '../pages/public/HomePage/HomePage.jsx';
import LoginPage from '../pages/auth/LoginPage/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage/RegisterPage.jsx';
import NotFoundPage from '../pages/NotFoundPage/NotFoundPage.jsx';
import PlaceholderPage from '../pages/PlaceholderPage/PlaceholderPage.jsx';
import { USER_ROLES } from '../auth/roles.js';

// Routes still rendering <PlaceholderPage> are in scope but unbuilt. Swap each
// one for its real page as the milestone lands.
const stub = (title, description, milestone) => (
  <PlaceholderPage title={title} description={description} milestone={milestone} />
);

const M2 = 'Milestone 2 — public website';
const M3 = 'Milestone 3 — talent onboarding';
const M4 = 'Milestone 4 — recruiter portal';
const M5 = 'Milestone 5 — admin and trainer portals';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={stub('About us', 'Company background and mission.', M2)} />
        <Route path="services" element={stub('Services', 'What we offer talents and employers.', M2)} />
        <Route path="training-programs" element={stub('Training programs', 'The programmes candidates can enrol in.', M2)} />
        <Route path="gallery" element={stub('Gallery', 'Photos from our training sessions and events.', M2)} />
        <Route path="events" element={stub('Events', 'Upcoming and past events.', M2)} />
        <Route path="testimonials" element={stub('Testimonials', 'What our talents and employers say.', M2)} />
        <Route path="faq" element={stub('Frequently asked questions', 'Answers to common questions.', M2)} />
        <Route path="contact" element={stub('Contact us', 'How to reach the team.', M2)} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={stub('Reset your password', 'Request a password reset link.', M2)} />
          <Route path="reset-password" element={stub('Choose a new password', 'Set a new password using your reset link.', M2)} />
        </Route>

        <Route path="verify-email" element={stub('Verify your email address', 'Confirm the address on your account.', M2)} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.TALENT]} />}>
        <Route path="talent" element={<PortalLayout />}>
          <Route index element={stub('Talent overview', 'Your application status and next steps.', M3)} />
          <Route path="profile" element={stub('My profile', 'Your personal and professional information.', M3)} />
          <Route path="documents" element={stub('Documents', 'Upload your resume, ID, and certificates.', M3)} />
          <Route path="payments" element={stub('Payments', 'Your training fee payments and receipts.', M3)} />
          <Route path="payment/callback" element={stub('Confirming your payment', 'We are verifying your payment with Paystack.', M3)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.RECRUITER]} />}>
        <Route path="recruiter" element={<PortalLayout />}>
          <Route index element={stub('Recruiter overview', 'A summary of your placement requests.', M4)} />
          <Route path="company" element={stub('Company profile', 'Your company registration details.', M4)} />
          <Route path="talent-pool" element={stub('Find talent', 'Search approved, anonymous candidate profiles.', M4)} />
          <Route path="requests" element={stub('Placement requests', 'Submit and track placement requests.', M4)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.TRAINER]} />}>
        <Route path="trainer" element={<PortalLayout />}>
          <Route index element={stub('Trainer overview', 'Your account status and announcements.', M5)} />
          <Route path="assignments" element={stub('My assignments', 'Programmes and batches assigned to you.', M5)} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
        <Route path="admin" element={<PortalLayout />}>
          <Route index element={stub('Admin overview', 'Operational counts across the platform.', M5)} />
          <Route path="candidates" element={stub('Candidates', 'Review, approve, and publish candidates.', M5)} />
          <Route path="recruiters" element={stub('Recruiters', 'Manage registered recruiting companies.', M5)} />
          <Route path="trainers" element={stub('Trainers', 'Manage trainer accounts.', M5)} />
          <Route path="programs" element={stub('Programs and batches', 'Manage programmes and trainer assignments.', M5)} />
          <Route path="payments" element={stub('Payments', 'Look up and review payment records.', M5)} />
          <Route path="placement-requests" element={stub('Placement requests', 'Review and progress recruiter requests.', M5)} />
          <Route path="content" element={stub('Website content', 'Manage public site content.', M5)} />
        </Route>
      </Route>

      {/* Legacy/entry-point convenience redirects. */}
      <Route path="dashboard" element={<Navigate to="/" replace />} />

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
