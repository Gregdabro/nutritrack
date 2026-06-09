import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import LoginToken from './pages/LoginToken';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Diary from './pages/Diary';
import Workouts from './pages/Workouts';
import WorkoutDetail from './pages/Workouts/WorkoutDetail';
import Wellbeing from './pages/Wellbeing';
import Weight from './pages/Weight';

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

      {/* All protected pages share the Layout (Sidebar + Topbar) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/products" element={<Products />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/workouts/:id" element={<WorkoutDetail />} />
        <Route path="/wellbeing" element={<Wellbeing />} />
        <Route path="/weight" element={<Weight />} />
      </Route>
    </Routes>
  );
}
