import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import LoginToken from './pages/LoginToken';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Dashboard() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>NutriTrack</h1>
      <p>Dashboard будет здесь (Спринт 6)</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login/token" element={<LoginToken />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}
