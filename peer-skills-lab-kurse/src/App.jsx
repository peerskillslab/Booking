import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';

// Lazy-load heavy components for code splitting
const TutorDashboard = lazy(() => import('./pages/TutorDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminStats = lazy(() => import('./pages/AdminStats'));
const AdminCourses = lazy(() => import('./pages/AdminCourses'));
const AboutUs = lazy(() => import('./pages/AboutUs'));

// Regular imports for frequently used pages
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import MyBookings from './pages/MyBookings';
import MeineKurse from './pages/MeineKurse';
import MyProfile from './pages/MyProfile';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Datenschutz from './pages/Datenschutz';
import Impressum from './pages/Impressum';
import FAQ from './pages/FAQ';
import MyStats from './pages/MyStats';
import Layout from './Layout.jsx';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useInactivityLogout } from '@/lib/useInactivityLogout';
import PublicLayout from './PublicLayout';
import ErrorBoundary from '@/components/ErrorBoundary';

// Page loader component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const PageTransitionWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -12 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

/**
 * Wraps a page in the app shell. `lazy` pages additionally get a Suspense
 * boundary; the ErrorBoundary means a failed chunk fetch doesn't blank the
 * whole app.
 */
const page = (name, Component, { lazy: isLazy = false } = {}) => {
  const content = <PageTransitionWrapper><Component /></PageTransitionWrapper>;
  return (
    <Layout currentPageName={name}>
      <ErrorBoundary>
        {isLazy ? <Suspense fallback={<PageLoader />}>{content}</Suspense> : content}
      </ErrorBoundary>
    </Layout>
  );
};

const publicPage = (Component, { lazy: isLazy = false } = {}) => {
  const content = <PageTransitionWrapper><Component /></PageTransitionWrapper>;
  return (
    <PublicLayout>
      <ErrorBoundary>
        {isLazy ? <Suspense fallback={<PageLoader />}>{content}</Suspense> : content}
      </ErrorBoundary>
    </PublicLayout>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, logout } = useAuth();
  const location = useLocation();
  useInactivityLogout(logout);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === 'auth_required') {
    return <Navigate to="/AboutUs" replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={page('Home', Home)} />
        <Route path="/CourseDetail" element={page('CourseDetail', CourseDetail)} />
        <Route path="/MyBookings" element={page('MyBookings', MyBookings)} />
        <Route path="/MyStats" element={page('MyStats', MyStats)} />
        <Route path="/MyProfile" element={page('MyProfile', MyProfile)} />
        <Route path="/MeineKurse" element={page('MeineKurse', MeineKurse)} />
        <Route path="/TutorDashboard" element={page('TutorDashboard', TutorDashboard, { lazy: true })} />
        <Route path="/AdminCourses" element={page('AdminCourses', AdminCourses, { lazy: true })} />
        <Route path="/AdminUsers" element={page('AdminUsers', AdminUsers, { lazy: true })} />
        <Route path="/AdminStats" element={page('AdminStats', AdminStats, { lazy: true })} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              {/* Public routes — accessible without login */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/AboutUs" element={publicPage(AboutUs, { lazy: true })} />
              <Route path="/Datenschutz" element={publicPage(Datenschutz)} />
              <Route path="/Impressum" element={publicPage(Impressum)} />
              <Route path="/FAQ" element={publicPage(FAQ)} />
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
