// src/App.tsx
import React, { Suspense, lazy, ComponentType } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { NotificationProvider } from './contexts/NotificationContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { ToastProvider } from './contexts/ToastContext.js';
import Header from './components/layout/Header.js';
import Footer from './components/layout/Footer.js';
import LoadingSpinner from './components/ui/LoadingSpinner.js';
import ToastContainer from './components/ui/ToastContainer.js';
import { UserRole } from './types.js'; // Corrected path

// Lazy load page components using relative paths from src/App.tsx
const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage.js'));
const HomePage = lazy(() => import('./pages/HomePage.js'));
const RequesterPortalPage = lazy(() => import('./pages/RequesterPortalPage.js'));
const ProviderPortalPage = lazy(() => import('./pages/ProviderPortalPage.js'));
const TaskPortalPage = lazy(() => import('./pages/TaskPortalPage.js'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage.js'));
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage.js'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.js'));


interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><LoadingSpinner text="Authenticating..." /></div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is admin and tries to access a non-admin protected route, redirect to admin portal IF it's not already an admin route.
    if (user.role === UserRole.ADMIN && !window.location.hash.startsWith('#/admin-portal') && !allowedRoles.includes(UserRole.ADMIN)) {
        return <Navigate to="/admin-portal" replace />;
    }
    // If route requires admin and user is not admin, redirect to home
    if (allowedRoles.includes(UserRole.ADMIN) && user.role !== UserRole.ADMIN) {
        return <Navigate to="/" replace />;
    }
    // If route has specific non-admin roles and user's role is not among them
    if (!allowedRoles.includes(UserRole.ADMIN) && !allowedRoles.includes(user.role)) { // this condition might be too broad
        return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<div className="flex justify-center items-center h-[calc(100vh-128px)]"><LoadingSpinner text="Loading page..." /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <HashRouter>
              <ToastContainer />
              <Routes>
                <Route element={<AppLayout />}>
                  <Route element={<ProtectedRoute />}>
                    <Route index element={<HomePage />} />
                    <Route path="requester-portal" element={<RequesterPortalPage />} />
                    <Route path="provider-portal" element={<ProviderPortalPage />} />
                    <Route path="task-portal" element={<TaskPortalPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                    <Route path="admin-portal" element={<AdminPortalPage />} />
                  </Route>
                  <Route path="/changelog" element={<ChangelogPage />} />
                </Route>

                <Route path="/login" element={<Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingSpinner text="Loading..." /></div>}><LoginPage /></Suspense>} />
                <Route path="/register" element={<Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingSpinner text="Loading..." /></div>}><RegistrationPage /></Suspense>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </HashRouter>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;