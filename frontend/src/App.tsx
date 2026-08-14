import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDirectoryPage from './pages/AdminDirectoryPage';
import SuperAdminPanel from './pages/SuperAdminPanel';
import Layout from './components/Layout';
import type { Booking, Notification } from './types';

function AppRoutes() {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { addNotification } = useNotifications();

  const handleBookingUpdate = (_booking: Booking) => {
    // Booking updates trigger re-fetches in Dashboard via state
  };

  const handleNotification = (notification: Notification) => {
    addNotification(notification);
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <WebSocketProvider
      onBookingUpdate={handleBookingUpdate}
      onNotification={handleNotification}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/admin-directory" element={<AdminDirectoryPage />} />
          {isSuperAdmin && (
            <Route path="/super-admin" element={<SuperAdminPanel />} />
          )}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </WebSocketProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
