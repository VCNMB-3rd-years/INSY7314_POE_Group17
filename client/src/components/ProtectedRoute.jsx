import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  console.log('🔐 ProtectedRoute check:', { user, allowedRole });

  // Check if user is authenticated (NO TOKEN CHECK - using sessions now)
  if (!user) {
    console.log('❌ No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user has the correct role
  if (allowedRole && user.role !== allowedRole) {
    console.log('❌ Wrong role, redirecting');
    return <Navigate to={user.role === 'employee' ? '/employee' : '/customer'} replace />;
  }

  console.log('✅ Access granted');
  return children;
};

export default ProtectedRoute;