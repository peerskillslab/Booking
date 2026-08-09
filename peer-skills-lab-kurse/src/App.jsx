import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
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
import MyProfile from './pages/MyProfile';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Datenschutz from './pages/Datenschutz';
import Impressum from './pages/Impressum';
import FAQ from './pages/FAQ';
import MyStats from './pages/MyStats';
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

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

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
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <PageTransitionWrapper><MainPage /></PageTransitionWrapper>
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <PageTransitionWrapper><Page /></PageTransitionWrapper>
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/TutorDashboard" element={<LayoutWrapper currentPageName="TutorDashboard"><Suspense fallback={<PageLoader />}><PageTransitionWrapper><TutorDashboard /></PageTransitionWrapper></Suspense></LayoutWrapper>} />
        <Route path="/AdminUsers" element={<LayoutWrapper currentPageName="AdminUsers"><Suspense fallback={<PageLoader />}><PageTransitionWrapper><AdminUsers /></PageTransitionWrapper></Suspense></LayoutWrapper>} />
        <Route path="/AdminStats" element={<LayoutWrapper currentPageName="AdminStats"><Suspense fallback={<PageLoader />}><PageTransitionWrapper><AdminStats /></PageTransitionWrapper></Suspense></LayoutWrapper>} />
        <Route path="/AdminCourses" element={<LayoutWrapper currentPageName="AdminCourses"><Suspense fallback={<PageLoader />}><PageTransitionWrapper><AdminCourses /></PageTransitionWrapper></Suspense></LayoutWrapper>} />
        <Route path="/admin/courses" element={<LayoutWrapper currentPageName="AdminCourses"><Suspense fallback={<PageLoader />}><PageTransitionWrapper><AdminCourses /></PageTransitionWrapper></Suspense></LayoutWrapper>} />
        <Route path="/MyProfile" element={<LayoutWrapper currentPageName="MyProfile"><PageTransitionWrapper><MyProfile /></PageTransitionWrapper></LayoutWrapper>} />
        <Route path="/MyStats" element={<LayoutWrapper currentPageName="MyStats"><PageTransitionWrapper><MyStats /></PageTransitionWrapper></LayoutWrapper>} />
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
            <Route path="/AboutUs" element={<PublicLayout><Suspense fallback={<PageLoader />}><PageTransitionWrapper><AboutUs /></PageTransitionWrapper></Suspense></PublicLayout>} />
            <Route path="/Datenschutz" element={<PublicLayout><PageTransitionWrapper><Datenschutz /></PageTransitionWrapper></PublicLayout>} />
            <Route path="/Impressum" element={<PublicLayout><PageTransitionWrapper><Impressum /></PageTransitionWrapper></PublicLayout>} />
            <Route path="/FAQ" element={<PublicLayout><PageTransitionWrapper><FAQ /></PageTransitionWrapper></PublicLayout>} />
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
