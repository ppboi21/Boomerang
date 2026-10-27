import { Route, Routes } from 'react-router';
import { GuestOnly, RequireVerified } from './components/RouteGuards';
import AppLayout from './layouts/AppLayout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ItemDetail from './pages/ItemDetail';
import ItemsPage from './pages/ItemsPage';
import Messages from './pages/Messages';
import MyReports from './pages/MyReports';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import { ForgotPassword, ResetPassword } from './pages/PasswordPages';
import { ChattingSafely, CommunityGuidelines, PhotoPrivacy, SafeHandovers } from './pages/GuidePages';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ReportItem from './pages/ReportItem';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import { VerifyEmail, VerifyPending } from './pages/VerifyPages';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/guidelines" element={<CommunityGuidelines />} />
      <Route path="/safety/handovers" element={<SafeHandovers />} />
      <Route path="/safety/photos" element={<PhotoPrivacy />} />
      <Route path="/safety/chat" element={<ChattingSafely />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify-pending" element={<VerifyPending />} />

      {/* Verified members only */}
      <Route element={<RequireVerified><AppLayout /></RequireVerified>}>
        <Route index element={<Dashboard />} />
        <Route path="lost" element={<ItemsPage key="lost" type="lost" />} />
        <Route path="found" element={<ItemsPage key="found" type="found" />} />
        <Route path="browse" element={<ItemsPage key="all" />} />
        <Route path="items/:id" element={<ItemDetail />} />
        <Route path="items/:id/edit" element={<ReportItem />} />
        <Route path="report/:type" element={<ReportItem />} />
        <Route path="my-reports" element={<MyReports />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:id" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users/:id" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
