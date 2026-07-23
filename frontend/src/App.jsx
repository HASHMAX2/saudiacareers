import { lazy, Suspense, useEffect } from "react";
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
import { PortalHome } from "./routes/PortalHome.jsx";

const AdminShell = lazy(() => import("./components/admin/AdminShell.jsx").then((m) => ({ default: m.AdminShell })));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling.jsx").then((m) => ({ default: m.AdminBilling })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx").then((m) => ({ default: m.AdminDashboard })));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.jsx").then((m) => ({ default: m.AdminLogin })));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans.jsx").then((m) => ({ default: m.AdminPlans })));
const ApplicationDetail = lazy(() => import("./pages/admin/ApplicationDetail.jsx").then((m) => ({ default: m.ApplicationDetail })));
const Applications = lazy(() => import("./pages/admin/Applications.jsx").then((m) => ({ default: m.Applications })));
const ChangePassword = lazy(() => import("./pages/admin/ChangePassword.jsx").then((m) => ({ default: m.ChangePassword })));
const CreateJob = lazy(() => import("./pages/admin/CreateJob.jsx").then((m) => ({ default: m.CreateJob })));
const EditJob = lazy(() => import("./pages/admin/EditJob.jsx").then((m) => ({ default: m.EditJob })));
const EmployerReviewDetail = lazy(() => import("./pages/admin/EmployerReviewDetail.jsx").then((m) => ({ default: m.EmployerReviewDetail })));
const Employers = lazy(() => import("./pages/admin/Employers.jsx").then((m) => ({ default: m.Employers })));
const ImportJobs = lazy(() => import("./pages/admin/ImportJobs.jsx").then((m) => ({ default: m.ImportJobs })));
const JobsFlagged = lazy(() => import("./pages/admin/JobsFlagged.jsx").then((m) => ({ default: m.JobsFlagged })));
const ManageJobs = lazy(() => import("./pages/admin/ManageJobs.jsx").then((m) => ({ default: m.ManageJobs })));
const Refunds = lazy(() => import("./pages/admin/Refunds.jsx").then((m) => ({ default: m.Refunds })));
const ScrapedJobs = lazy(() => import("./pages/admin/ScrapedJobs.jsx").then((m) => ({ default: m.ScrapedJobs })));
const EmployerVerifications = lazy(() => import("./pages/admin/EmployerVerifications.jsx").then((m) => ({ default: m.EmployerVerifications })));
const JobReviews = lazy(() => import("./pages/admin/JobReviews.jsx").then((m) => ({ default: m.JobReviews })));
const Invoices = lazy(() => import("./pages/admin/Invoices.jsx").then((m) => ({ default: m.Invoices })));

const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.jsx").then((m) => ({ default: m.ForgotPassword })));
const Login = lazy(() => import("./pages/auth/Login.jsx").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages/auth/Register.jsx").then((m) => ({ default: m.Register })));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword.jsx").then((m) => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import("./pages/candidate/Dashboard.jsx").then((m) => ({ default: m.Dashboard })));
const CandidateChangePassword = lazy(() => import("./pages/candidate/CandidateChangePassword.jsx").then((m) => ({ default: m.CandidateChangePassword })));
const MyApplications = lazy(() => import("./pages/candidate/MyApplications.jsx").then((m) => ({ default: m.MyApplications })));
const Profile = lazy(() => import("./pages/candidate/Profile.jsx").then((m) => ({ default: m.Profile })));
const SavedJobs = lazy(() => import("./pages/candidate/SavedJobs.jsx").then((m) => ({ default: m.SavedJobs })));

const EmployerShell = lazy(() => import("./components/employer/EmployerShell.jsx").then((m) => ({ default: m.EmployerShell })));
const EmployerLogin = lazy(() => import("./pages/employer/EmployerLogin.jsx").then((m) => ({ default: m.EmployerLogin })));
const EmployerRegister = lazy(() => import("./pages/employer/EmployerRegister.jsx").then((m) => ({ default: m.EmployerRegister })));
const EmployerContact = lazy(() => import("./pages/employer/EmployerContact.jsx").then((m) => ({ default: m.EmployerContact })));
const EmployerDashboard = lazy(() => import("./pages/employer/EmployerDashboard.jsx").then((m) => ({ default: m.EmployerDashboard })));
const EmployerJobs = lazy(() => import("./pages/employer/EmployerJobs.jsx").then((m) => ({ default: m.EmployerJobs })));
const EmployerPendingJobs = lazy(() => import("./pages/employer/EmployerPendingJobs.jsx").then((m) => ({ default: m.EmployerPendingJobs })));
const EmployerCreateJob = lazy(() => import("./pages/employer/EmployerCreateJob.jsx").then((m) => ({ default: m.EmployerCreateJob })));
const EmployerEditJob = lazy(() => import("./pages/employer/EmployerEditJob.jsx").then((m) => ({ default: m.EmployerEditJob })));
const EmployerApplications = lazy(() => import("./pages/employer/EmployerApplications.jsx").then((m) => ({ default: m.EmployerApplications })));
const EmployerApplicants = lazy(() => import("./pages/employer/EmployerApplicants.jsx").then((m) => ({ default: m.EmployerApplicants })));
const EmployerBilling = lazy(() => import("./pages/employer/EmployerBilling.jsx").then((m) => ({ default: m.EmployerBilling })));
const EmployerVerification = lazy(() => import("./pages/employer/EmployerVerification.jsx").then((m) => ({ default: m.EmployerVerification })));

const Contact = lazy(() => import("./pages/public/Contact.jsx").then((m) => ({ default: m.Contact })));
const JobDetail = lazy(() => import("./pages/public/JobDetail.jsx").then((m) => ({ default: m.JobDetail })));
const Jobs = lazy(() => import("./pages/public/Jobs.jsx").then((m) => ({ default: m.Jobs })));
const Terms = lazy(() => import("./pages/public/Terms.jsx").then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import("./pages/public/Privacy.jsx").then((m) => ({ default: m.Privacy })));
const NotFound = lazy(() => import("./pages/shared/NotFound.jsx").then((m) => ({ default: m.NotFound })));
const Unauthorized = lazy(() => import("./pages/shared/Unauthorized.jsx").then((m) => ({ default: m.Unauthorized })));

const candidateLinks = [];

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label="Loading…" />
    </div>
  );
}

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
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<PortalHome />} />
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
    </Suspense>
  );
}
