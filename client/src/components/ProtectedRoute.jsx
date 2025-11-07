import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Check if user is authenticated
  if (!token || !user) {
    // Redirect employees/admins to employee login
    if (allowedRole === 'employee' || allowedRole === 'admin') {
      return <Navigate to="/employee-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Check if user has the correct role
  if (allowedRole && user.role !== allowedRole) {
    // Redirect to appropriate dashboard based on actual role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'employee') {
      return <Navigate to="/employee" replace />;
    } else {
      return <Navigate to="/customer" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;