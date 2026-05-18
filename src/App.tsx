import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";

import GoalsPage from "./pages/employee/GoalsPage";
import CreateGoalPage from "./pages/employee/CreateGoalPage";
import CheckInsPage from "./pages/employee/CheckInsPage";

import TeamApprovalsPage from "./pages/manager/TeamApprovalsPage";
import AllTeamGoalsPage from "./pages/manager/AllTeamGoalsPage";
import TeamCheckInsPage from "./pages/manager/TeamCheckInsPage";

import UsersPage from "./pages/admin/UsersPage";
import CyclesPage from "./pages/admin/CyclesPage";
import AdminGoalsPage from "./pages/admin/AdminGoalsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AuditPage from "./pages/admin/AuditPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

const roleDashboard = {
  EMPLOYEE: "/employee/goals",
  MANAGER: "/manager/team",
  ADMIN: "/admin/users",
};

function RootRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <Navigate to={roleDashboard[user!.role]} replace />;
}

function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Employee */}
        <Route
          path="/employee/goals"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <GoalsPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/employee/goals/new"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <CreateGoalPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/employee/goals/edit/:id"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <CreateGoalPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/employee/checkins"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <CheckInsPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />

        {/* Manager */}
        <Route
          path="/manager/team"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
                <TeamApprovalsPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/manager/team/all"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
                <AllTeamGoalsPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/manager/checkins"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["MANAGER", "ADMIN"]}>
                <TeamCheckInsPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/users"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["ADMIN"]}>
                <UsersPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/admin/cycles"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["ADMIN"]}>
                <CyclesPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/admin/goals"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminGoalsPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
                <ReportsPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["ADMIN"]}>
                <AuditPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />

        {/* Analytics */}
        <Route
          path="/analytics"
          element={
            <AuthedLayout>
              <ProtectedRoute roles={["ADMIN"]}>
                <AnalyticsPage />
              </ProtectedRoute>
            </AuthedLayout>
          }
        />

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
