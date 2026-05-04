import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/layout/PrivateRoute';
import DisclaimerFooter from './components/layout/DisclaimerFooter';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MetricsPage from './pages/MetricsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import NutritionPage from './pages/NutritionPage';
import GoalsPage from './pages/GoalsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ProfilePage from './pages/ProfilePage';
import FoodScanPage from './pages/FoodScanPage';
import PrivacyPage from './pages/PrivacyPage';
import OnboardingPage from './pages/OnboardingPage';
import ExerciseReviewPage from './pages/ExerciseReviewPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '60px', minHeight: 'calc(100vh - 40px)', backgroundColor: 'var(--bg)' }}>
        {children}
      </main>
      <DisclaimerFooter />
    </>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.age) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><AppLayout><DashboardPage /></AppLayout></PrivateRoute>} />
          <Route path="/metrics" element={<PrivateRoute><AppLayout><MetricsPage /></AppLayout></PrivateRoute>} />
          <Route path="/activities" element={<PrivateRoute><AppLayout><ActivitiesPage /></AppLayout></PrivateRoute>} />
          <Route path="/nutrition" element={<PrivateRoute><AppLayout><NutritionPage /></AppLayout></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><AppLayout><GoalsPage /></AppLayout></PrivateRoute>} />
          <Route path="/recommendations" element={<PrivateRoute><AppLayout><RecommendationsPage /></AppLayout></PrivateRoute>} />
          <Route path="/food-scan" element={<PrivateRoute><AppLayout><FoodScanPage /></AppLayout></PrivateRoute>} />
          <Route path="/form-coach" element={<PrivateRoute><AppLayout><ExerciseReviewPage /></AppLayout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><AppLayout><ProfilePage /></AppLayout></PrivateRoute>} />
          <Route path="/privacy" element={<AppLayout><PrivacyPage /></AppLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
