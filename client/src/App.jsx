import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import CustomerPay from './pages/CustomerPay';
import EmployeePortal from './pages/EmployeePortal';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={user ? (user.role === 'employee' ? '/employee' : '/customer') : '/login'} 
              replace 
            />
          } 
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Customer Routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRole="customer">
              <CustomerPay />
            </ProtectedRoute>
          }
        />

        {/* Protected Employee Routes */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRole="employee">
              <EmployeePortal />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;