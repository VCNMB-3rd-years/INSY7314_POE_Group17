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

// References:
//GeeksforGeeks. (2025). How to Create a Protected Route with react-router-dom? [online] Available at: https://www.geeksforgeeks.org/reactjs/how-to-create-a-protected-route-with-react-router-dom/ [Accessed 1 Nov. 2025]
//freeCodeCamp. (2023). How to create protected routes in React using react-router-dom. [online] Available at: https://www.freecodecamp.org/news/how-to-create-protected-routes-in-react/ [Accessed 1 Nov. 2025]
