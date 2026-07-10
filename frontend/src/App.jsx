import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { restoreSession } from "./api/client.js";
import { useAuthStore } from "./store/authStore.js";
import { Spinner } from "./components/common/Spinner.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { DashboardLayout } from "./components/layout/DashboardLayout.jsx";
import { AdminRoute } from "./routes/AdminRoute.jsx";
import { EmployerRoute } from "./routes/EmployerRoute.jsx";
import { PrivateRoute } from "./routes/PrivateRoute.jsx";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute.jsx";
import { AdminShell } from "./components/admin/AdminShell.jsx";
import { AdminBilling } from "./pages/admin/AdminBilling.jsx";
import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { AdminLogin } from "./pages/admin/AdminLogin.jsx";
import { AdminPlans } from "./pages/admin/AdminPlans.jsx";
import { ApplicationDetail } from "./pages/admin/ApplicationDetail.jsx";
import { Applications } from "./pages/admin/Applications.jsx";
import { ChangePassword } from "./pages/admin/ChangePassword.jsx";
import { CreateJob } from "./pages/admin/CreateJob.jsx";
import { EditJob } from "./pages/admin/EditJob.jsx";
import { EmployerReviewDetail } from "./pages/admin/EmployerReviewDetail.jsx";
import { Employers } from "./pages/admin/Employers.jsx";
import { ImportJobs } from "./pages/admin/ImportJobs.jsx";
import { JobsFlagged } from "./pages/admin/JobsFlagged.jsx";
import { ManageJobs } from "./pages/admin/ManageJobs.jsx";
import { Refunds } from "./pages/admin/Refunds.jsx";
import { ScrapedJobs } from "./pages/admin/ScrapedJobs.jsx";
import { ForgotPassword } from "./pages/auth/ForgotPassword.jsx";
import { Login } from "./pages/auth/Login.jsx";
import { Register } from "./pages/auth/Register.jsx";
import { ResetPassword } from "./pages/auth/ResetPassword.jsx";
import { Dashboard } from "./pages/candidate/Dashboard.jsx";
import { CandidateChangePassword } from "./pages/candidate/CandidateChangePassword.jsx";
import { MyApplications } from "./pages/candidate/MyApplications.jsx";
import { Profile } from "./pages/candidate/Profile.jsx";
import { SavedJobs } from "./pages/candidate/SavedJobs.jsx";
import { EmployerShell } from "./components/employer/EmployerShell.jsx";
import { EmployerLogin } from "./pages/employer/EmployerLogin.jsx";
import { EmployerRegister } from "./pages/employer/EmployerRegister.jsx";
import { EmployerContact } from "./pages/employer/EmployerContact.jsx";
import { EmployerDashboard } from "./pages/employer/EmployerDashboard.jsx";
import { EmployerJobs } from "./pages/employer/EmployerJobs.jsx";
import { EmployerPendingJobs } from "./pages/employer/EmployerPendingJobs.jsx";
import { EmployerCreateJob } from "./pages/employer/EmployerCreateJob.jsx";
import { EmployerEditJob } from "./pages/employer/EmployerEditJob.jsx";
import { EmployerApplications } from "./pages/employer/EmployerApplications.jsx";
import { EmployerApplicants } from "./pages/employer/EmployerApplicants.jsx";
import { EmployerBilling } from "./pages/employer/EmployerBilling.jsx";
import { EmployerVerification } from "./pages/employer/EmployerVerification.jsx";
import { EmployerVerifications } from "./pages/admin/EmployerVerifications.jsx";
import { JobReviews } from "./pages/admin/JobReviews.jsx";
import { Invoices } from "./pages/admin/Invoices.jsx";
import { Contact } from "./pages/public/Contact.jsx";
import { JobDetail } from "./pages/public/JobDetail.jsx";
import { Jobs } from "./pages/public/Jobs.jsx";
import { Landing } from "./pages/public/Landing.jsx";
import { Terms } from "./pages/public/Terms.jsx";
import { Privacy } from "./pages/public/Privacy.jsx";
import { NotFound } from "./pages/shared/NotFound.jsx";
import { Unauthorized } from "./pages/shared/Unauthorized.jsx";

const candidateLinks = [];

export default function App() {
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    restoreSession();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Landing />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />

        <Route path="employer/contact" element={<EmployerContact />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="employer/login" element={<EmployerLogin />} />
          <Route path="employer/register" element={<EmployerRegister />} />
          <Route path="admin/login" element={<AdminLogin />} />
        </Route>
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />

        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout links={candidateLinks} hideSidebar />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/profile" element={<Profile />} />
            <Route path="dashboard/saved-jobs" element={<SavedJobs />} />
            <Route path="dashboard/applications" element={<MyApplications />} />
            <Route path="dashboard/change-password" element={<CandidateChangePassword />} />
          </Route>
        </Route>

        <Route path="unauthorized" element={<Unauthorized />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate replace to="/404" />} />
      </Route>

      <Route element={<EmployerRoute />}>
        <Route element={<EmployerShell />}>
          <Route path="employer/dashboard" element={<EmployerDashboard />} />
          <Route path="employer/jobs" element={<EmployerJobs />} />
          <Route path="employer/jobs/pending" element={<EmployerPendingJobs />} />
          <Route path="employer/jobs/create" element={<EmployerCreateJob />} />
          <Route path="employer/jobs/:id/edit" element={<EmployerEditJob />} />
          <Route path="employer/jobs/:id/applications" element={<EmployerApplications />} />
          <Route path="employer/applicants" element={<EmployerApplicants />} />
          <Route path="employer/billing" element={<EmployerBilling />} />
          <Route path="employer/verification" element={<EmployerVerification />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="admin/change-password" element={<ChangePassword />} />
        <Route element={<AdminShell />}>
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/employers" element={<Employers />} />
          <Route path="admin/verifications" element={<EmployerVerifications />} />
          <Route path="admin/verifications/:id" element={<EmployerReviewDetail />} />
          <Route path="admin/jobs" element={<ManageJobs />} />
          <Route path="admin/jobs/create" element={<CreateJob />} />
          <Route path="admin/jobs/import" element={<ImportJobs />} />
          <Route path="admin/jobs/:id/edit" element={<EditJob />} />
          <Route path="admin/job-reviews" element={<JobReviews />} />
          <Route path="admin/jobs-flagged" element={<JobsFlagged />} />
          <Route path="admin/scraped-jobs" element={<ScrapedJobs />} />
          <Route path="admin/applications" element={<Applications />} />
          <Route path="admin/applications/:id" element={<ApplicationDetail />} />
          <Route path="admin/billing" element={<AdminBilling />} />
          <Route path="admin/plans" element={<AdminPlans />} />
          <Route path="admin/invoices" element={<Invoices />} />
          <Route path="admin/refunds" element={<Refunds />} />
        </Route>
      </Route>
    </Routes>
  );
}

