import { useEffect } from "react";
import { FileText, LayoutDashboard, LockKeyhole, Search, UserRound } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { restoreSession } from "./api/client.js";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { DashboardLayout } from "./components/layout/DashboardLayout.jsx";
import { AdminRoute } from "./routes/AdminRoute.jsx";
import { PrivateRoute } from "./routes/PrivateRoute.jsx";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute.jsx";
import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { ApplicationDetail } from "./pages/admin/ApplicationDetail.jsx";
import { Applications } from "./pages/admin/Applications.jsx";
import { ChangePassword } from "./pages/admin/ChangePassword.jsx";
import { CreateJob } from "./pages/admin/CreateJob.jsx";
import { EditJob } from "./pages/admin/EditJob.jsx";
import { ManageJobs } from "./pages/admin/ManageJobs.jsx";
import { ForgotPassword } from "./pages/auth/ForgotPassword.jsx";
import { Login } from "./pages/auth/Login.jsx";
import { Register } from "./pages/auth/Register.jsx";
import { ResetPassword } from "./pages/auth/ResetPassword.jsx";
import { Dashboard } from "./pages/candidate/Dashboard.jsx";
import { CandidateChangePassword } from "./pages/candidate/CandidateChangePassword.jsx";
import { MyApplications } from "./pages/candidate/MyApplications.jsx";
import { Profile } from "./pages/candidate/Profile.jsx";
import { JobDetail } from "./pages/public/JobDetail.jsx";
import { Jobs } from "./pages/public/Jobs.jsx";
import { Landing } from "./pages/public/Landing.jsx";
import { NotFound } from "./pages/shared/NotFound.jsx";
import { Unauthorized } from "./pages/shared/Unauthorized.jsx";

const candidateLinks = [
  { label: "Overview",         to: "/dashboard",                  end: true, icon: LayoutDashboard },
  { label: "Profile",          to: "/dashboard/profile",                     icon: UserRound       },
  { label: "Browse Jobs",      to: "/jobs",                                  icon: Search          },
  { label: "Applications",     to: "/dashboard/applications",                icon: FileText        },
  { label: "Change Password",  to: "/dashboard/change-password",             icon: LockKeyhole     },
];

const adminLinks = [
  { label: "Overview", to: "/admin/dashboard", end: true },
  { label: "Jobs", to: "/admin/jobs" },
  { label: "Applications", to: "/admin/applications" },
];

export default function App() {
  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Landing />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="admin/login" element={<Login admin />} />
        </Route>
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />

        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout links={candidateLinks} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/profile" element={<Profile />} />
            <Route path="dashboard/applications" element={<MyApplications />} />
            <Route path="dashboard/change-password" element={<CandidateChangePassword />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin/change-password" element={<ChangePassword />} />
          <Route element={<DashboardLayout links={adminLinks} />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/jobs" element={<ManageJobs />} />
            <Route path="admin/jobs/create" element={<CreateJob />} />
            <Route path="admin/jobs/:id/edit" element={<EditJob />} />
            <Route path="admin/applications" element={<Applications />} />
            <Route path="admin/applications/:id" element={<ApplicationDetail />} />
          </Route>
        </Route>

        <Route path="unauthorized" element={<Unauthorized />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate replace to="/404" />} />
      </Route>
    </Routes>
  );
}

