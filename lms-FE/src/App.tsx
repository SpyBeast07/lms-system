import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import './App.css'

// A placeholder components for Admin Dashboard
const AdminDashboard = () => <h2>Welcome to the Super Admin Dashboard!</h2>;

function App() {
  const { isAuthenticated, name, role, logout } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />

      {/* Basic authenticated route */}
      <Route path="/" element={
        <ProtectedRoute>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
            <h1>LMS Dashboard</h1>
            <div>
              <p>Welcome back, <b>{name}</b>! Your role is <b>{role}</b>.</p>
              <button
                onClick={logout}
                style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}
              >
                Logout
              </button>
            </div>
          </div>
        </ProtectedRoute>
      } />

      {/* Role-based Protected Route example */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['super_admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
