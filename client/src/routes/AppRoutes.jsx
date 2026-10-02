import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout/PublicLayout.jsx";
import PortalLayout from "../layouts/PortalLayout/PortalLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";
import HomePage from "../pages/public/HomePage/HomePage.jsx";
import AboutPage from "../pages/public/AboutPage/AboutPage.jsx";
import ServicesPage from "../pages/public/ServicesPage/ServicesPage.jsx";
import TrainingPage from "../pages/public/TrainingPage/TrainingPage.jsx";
import GalleryPage from "../pages/public/GalleryPage/GalleryPage.jsx";
import EventsPage from "../pages/public/EventsPage/EventsPage.jsx";
import TestimonialsPage from "../pages/public/TestimonialsPage/TestimonialsPage.jsx";
import FaqPage from "../pages/public/FaqPage/FaqPage.jsx";
import ContactPage from "../pages/public/ContactPage/ContactPage.jsx";
import BlogPage from "../pages/public/BlogPage/BlogPage.jsx";
import BlogPostPage from "../pages/public/BlogPostPage/BlogPostPage.jsx";
import LoginPage from "../pages/auth/LoginPage/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage/ResetPasswordPage.jsx";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage/VerifyEmailPage.jsx";
import TalentOverviewPage from "../pages/talent/TalentOverviewPage/TalentOverviewPage.jsx";
import TalentProfilePage from "../pages/talent/TalentProfilePage/TalentProfilePage.jsx";
import TalentSavingsPage from "../pages/talent/TalentSavingsPage/TalentSavingsPage.jsx";
import RecruiterOverviewPage from "../pages/recruiter/RecruiterOverviewPage/RecruiterOverviewPage.jsx";
import RecruiterCompanyPage from "../pages/recruiter/RecruiterCompanyPage/RecruiterCompanyPage.jsx";
import RecruiterSubscriptionPage from "../pages/recruiter/RecruiterSubscriptionPage/RecruiterSubscriptionPage.jsx";
import RecruiterSubscriptionCallbackPage from "../pages/recruiter/RecruiterSubscriptionCallbackPage/RecruiterSubscriptionCallbackPage.jsx";
import TalentPoolPage from "../pages/recruiter/TalentPoolPage/TalentPoolPage.jsx";
import CandidateProfilePage from "../pages/recruiter/CandidateProfilePage/CandidateProfilePage.jsx";
import PlacementRequestFormPage from "../pages/recruiter/PlacementRequestFormPage/PlacementRequestFormPage.jsx";
import PlacementRequestsPage from "../pages/recruiter/PlacementRequestsPage/PlacementRequestsPage.jsx";
import PlacementRequestDetailPage from "../pages/recruiter/PlacementRequestDetailPage/PlacementRequestDetailPage.jsx";
import TrainerOverviewPage from "../pages/trainer/TrainerOverviewPage/TrainerOverviewPage.jsx";
import TrainerAssignmentsPage from "../pages/trainer/TrainerAssignmentsPage/TrainerAssignmentsPage.jsx";
import AdminOverviewPage from "../pages/admin/AdminOverviewPage/AdminOverviewPage.jsx";
import AdminCandidatesPage from "../pages/admin/AdminCandidatesPage/AdminCandidatesPage.jsx";
import AdminCandidateDetailPage from "../pages/admin/AdminCandidateDetailPage/AdminCandidateDetailPage.jsx";
import AdminRecruitersPage from "../pages/admin/AdminRecruitersPage/AdminRecruitersPage.jsx";
import AdminTrainersPage from "../pages/admin/AdminTrainersPage/AdminTrainersPage.jsx";
import AdminProgramsPage from "../pages/admin/AdminProgramsPage/AdminProgramsPage.jsx";
import AdminPaymentsPage from "../pages/admin/AdminPaymentsPage/AdminPaymentsPage.jsx";
import AdminSavingsWithdrawalsPage from "../pages/admin/AdminSavingsWithdrawalsPage/AdminSavingsWithdrawalsPage.jsx";
import AdminPlacementRequestsPage from "../pages/admin/AdminPlacementRequestsPage/AdminPlacementRequestsPage.jsx";
import AdminPlacementRequestDetailPage from "../pages/admin/AdminPlacementRequestDetailPage/AdminPlacementRequestDetailPage.jsx";
import AdminContentPage from "../pages/admin/AdminContentPage/AdminContentPage.jsx";
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage.jsx";
import { USER_ROLES } from "../auth/roles.js";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="training-programs" element={<TrainingPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:id" element={<BlogPostPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Outside the guest guard: a signed-in but unverified user still
            needs to be able to open their verification link. */}
        <Route path="verify-email" element={<VerifyEmailPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.TALENT]} />}>
        <Route path="talent" element={<PortalLayout />}>
          <Route index element={<TalentOverviewPage />} />
          <Route path="profile" element={<TalentProfilePage />} />
          {/* Documents are now step 3 of the profile wizard. */}
          <Route path="documents" element={<Navigate to="/talent/profile" replace />} />
          <Route path="savings" element={<TalentSavingsPage />} />
          {/* Old path kept so existing links and bookmarks still resolve. */}
          <Route path="payments" element={<Navigate to="/talent/savings" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.RECRUITER]} />}>
        <Route path="recruiter" element={<PortalLayout />}>
          <Route index element={<RecruiterOverviewPage />} />
          <Route path="company" element={<RecruiterCompanyPage />} />
          <Route path="subscription" element={<RecruiterSubscriptionPage />} />
          <Route path="subscription/callback" element={<RecruiterSubscriptionCallbackPage />} />
          <Route path="talent-pool" element={<TalentPoolPage />} />
          <Route path="talent-pool/:reference" element={<CandidateProfilePage />} />
          <Route
            path="talent-pool/:reference/request"
            element={<PlacementRequestFormPage />}
          />
          <Route path="requests" element={<PlacementRequestsPage />} />
          <Route path="requests/:id" element={<PlacementRequestDetailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.TRAINER]} />}>
        <Route path="trainer" element={<PortalLayout />}>
          <Route index element={<TrainerOverviewPage />} />
          <Route path="assignments" element={<TrainerAssignmentsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
        <Route path="admin" element={<PortalLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="candidates" element={<AdminCandidatesPage />} />
          <Route path="candidates/:id" element={<AdminCandidateDetailPage />} />
          <Route path="recruiters" element={<AdminRecruitersPage />} />
          <Route path="trainers" element={<AdminTrainersPage />} />
          <Route path="programs" element={<AdminProgramsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="savings-withdrawals" element={<AdminSavingsWithdrawalsPage />} />
          <Route path="placement-requests" element={<AdminPlacementRequestsPage />} />
          <Route
            path="placement-requests/:id"
            element={<AdminPlacementRequestDetailPage />}
          />
          <Route path="content-studio" element={<AdminContentPage />} />
          {/* Old path kept so existing links and bookmarks still resolve. */}
          <Route path="content" element={<Navigate to="/admin/content-studio" replace />} />
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
