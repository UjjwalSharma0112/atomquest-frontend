import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

const roleDashboard: Record<Role, string> = {
  EMPLOYEE: '/employee/goals',
  MANAGER: '/manager/team',
  ADMIN: '/admin/users',
};

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={roleDashboard[user.role]} replace />;
  }

  return <>{children}</>;
}
