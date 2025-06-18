// src/App.tsx
import React, { Suspense, lazy } from 'react'; 
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { NotificationProvider } from './contexts/NotificationContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { ToastProvider } from './contexts/ToastContext.js';
import Header from './components/layout/Header.js'; 
import Footer from './components/layout/Footer.js'; 
import LoadingSpinner from './components/ui/LoadingSpinner.js'; 
import ToastContainer from './components/ui/ToastContainer.js'; 

// Lazy load page components from src/pages/ directory
const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage.js'));
const HomePage = lazy(() => import('./pages/HomePage.js'));
const RequesterPortalPage = lazy(() => import('./pages/RequesterPortalPage.js'));
const ProviderPortalPage = lazy(() => import('./pages/ProviderPortalPage.js'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage.js')); 
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage.js')); 
const SettingsPage = lazy(() => import('./pages/SettingsPage.js')); 


interface ProtectedRouteProps {
  allowedRoles?: string[]; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><LoadingSpinner text="Authenticating..." /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin' && !window.location.hash.startsWith('#/admin-portal')) {
        return <Navigate to="/admin-portal" replace />;
    }
    if (allowedRoles.includes('admin') && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    if (!allowedRoles.includes('admin')) { 
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
                    <Route path="settings" element={<SettingsPage />} /> 
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
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