import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout/PublicLayout.jsx";
import PortalLayout from "../layouts/PortalLayout/PortalLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";
import HomePage from "../pages/public/HomePage/HomePage.jsx";
import LoginPage from "../pages/auth/LoginPage/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage/ResetPasswordPage.jsx";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage/VerifyEmailPage.jsx";
import TalentOverviewPage from "../pages/talent/TalentOverviewPage/TalentOverviewPage.jsx";
import TalentProfilePage from "../pages/talent/TalentProfilePage/TalentProfilePage.jsx";
import TalentPaymentsPage from "../pages/talent/TalentPaymentsPage/TalentPaymentsPage.jsx";
import PaymentCallbackPage from "../pages/talent/PaymentCallbackPage/PaymentCallbackPage.jsx";
import RecruiterOverviewPage from "../pages/recruiter/RecruiterOverviewPage/RecruiterOverviewPage.jsx";
import RecruiterCompanyPage from "../pages/recruiter/RecruiterCompanyPage/RecruiterCompanyPage.jsx";
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
import AdminPlacementRequestsPage from "../pages/admin/AdminPlacementRequestsPage/AdminPlacementRequestsPage.jsx";
import AdminPlacementRequestDetailPage from "../pages/admin/AdminPlacementRequestDetailPage/AdminPlacementRequestDetailPage.jsx";
import AdminContentPage from "../pages/admin/AdminContentPage/AdminContentPage.jsx";
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage.jsx";
import PlaceholderPage from "../pages/PlaceholderPage/PlaceholderPage.jsx";
import { USER_ROLES } from "../auth/roles.js";

// Routes still rendering <PlaceholderPage> are in scope but unbuilt. Swap each
// one for its real page as the milestone lands.
const stub = (title, description, milestone) => (
  <PlaceholderPage
    title={title}
    description={description}
    milestone={milestone}
  />
);

const M2 = "Milestone 2 — public website";
const M3 = "Milestone 3 — talent onboarding";
const M4 = "Milestone 4 — recruiter portal";
const M5 = "Milestone 5 — admin and trainer portals";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="about"
          element={stub("About us", "Company background and mission.", M2)}
        />
        <Route
          path="services"
          element={stub("Services", "What we offer talents and employers.", M2)}
        />
        <Route
          path="training-programs"
          element={stub(
            "Training programs",
            "The programmes candidates can enrol in.",
            M2,
          )}
        />
        <Route
          path="gallery"
          element={stub(
            "Gallery",
            "Photos from our training sessions and events.",
            M2,
          )}
        />
        <Route
          path="events"
          element={stub("Events", "Upcoming and past events.", M2)}
        />
        <Route
          path="testimonials"
          element={stub(
            "Testimonials",
            "What our talents and employers say.",
            M2,
          )}
        />
        <Route
          path="faq"
          element={stub(
            "Frequently asked questions",
            "Answers to common questions.",
            M2,
          )}
        />
        <Route
          path="contact"
          element={stub("Contact us", "How to reach the team.", M2)}
        />

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
          <Route
            path="documents"
            element={stub(
              "Documents",
              "Upload your passport photograph, resume, certificates, and national ID.",
              "Milestone 3 — blocked on the cloud file-storage decision",
            )}
          />
          <Route path="payments" element={<TalentPaymentsPage />} />
          <Route path="payment/callback" element={<PaymentCallbackPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.RECRUITER]} />}>
        <Route path="recruiter" element={<PortalLayout />}>
          <Route index element={<RecruiterOverviewPage />} />
          <Route path="company" element={<RecruiterCompanyPage />} />
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
          <Route path="placement-requests" element={<AdminPlacementRequestsPage />} />
          <Route
            path="placement-requests/:id"
            element={<AdminPlacementRequestDetailPage />}
          />
          <Route path="content" element={<AdminContentPage />} />
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
