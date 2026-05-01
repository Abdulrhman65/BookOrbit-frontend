import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AddBook from './pages/AddBook';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import ChangePassword from './pages/ChangePassword';
import BookDetail from './pages/BookDetail';
import MyCopies from './pages/MyCopies';
import BorrowingIncomingRequests from './pages/BorrowingIncomingRequests';
import BorrowingOutgoingRequests from './pages/BorrowingOutgoingRequests';
import BorrowingTransactions from './pages/BorrowingTransactions';
import AdminStudents from './pages/AdminStudents';
import AdminBooks from './pages/AdminBooks';
import AdminDashboard from './pages/AdminDashboard';
import EmailVerified from './redirects/EmailVerified';
import ResetPassword from './redirects/ResetPassword';
import Notifications from './pages/Notifications';
import PublicProfile from './pages/PublicProfile';
import Chat from './pages/Chat';

// Effects
import Preloader from './components/effects/Preloader';
import Aurora from './components/effects/Aurora';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// ── Guards ───────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-library-paper dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-library-accent"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { isLoggedIn, loading, user } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  // تحقق من صلاحية الأدمن
  if (user?.role?.toLowerCase() !== "admin") {
    return <Navigate to="/app" replace />;
  }
  return children;
};

// حارس للصفحات العامة — يمنع المستخدم المسجل من الرجوع للهوم أو اللوجين
const GuestRoute = ({ children }) => {
  const { isLoggedIn, loading, user } = useAuth();
  if (loading) return null;
  if (isLoggedIn) {
    return <Navigate to={user?.role?.toLowerCase() === "admin" ? "/admin" : "/app"} replace />;
  }
  return children;
};

// ── Routes ──────────────────────────────────────────────────────────────────
function AppRoutes() {
  const [loading, setLoading] = useState(() => !sessionStorage.getItem("site_loaded"));

  const handlePreloaderComplete = () => {
    setLoading(false);
    sessionStorage.setItem("site_loaded", "true");
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <Preloader key="loader" onComplete={handlePreloaderComplete} />
      ) : (
        <div key="content" className="relative min-h-screen">
          <Aurora />
          <div className="App relative z-10">
            <Toaster position="top-center" reverseOrder={false} />
            
            <Routes>
              {/* ─ Public Routes (محمية من المسجلين) ─ */}
              <Route path="/" element={<GuestRoute><Home /></GuestRoute>} />
              <Route path="/login" element={<GuestRoute><AuthPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><AuthPage /></GuestRoute>} />
              <Route path="/confirm-email" element={<EmailVerified />} />
              <Route path="/email-verified" element={<EmailVerified />} />
              <Route path="/EmailVerified" element={<EmailVerified />} />
              <Route path="/EmailVerfied" element={<EmailVerified />} />
              <Route path='/reset-password' element={<GuestRoute><ResetPassword /></GuestRoute>} />
              <Route path='/ResetPassword' element={<GuestRoute><ResetPassword /></GuestRoute>} />

              {/* ── Student Protected Routes (محمية) ── */}
              <Route path="/app" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
              <Route path="/catalog/:bookId" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
              <Route path="/my-copies" element={<ProtectedRoute><MyCopies /></ProtectedRoute>} />
              <Route path="/lending/incoming" element={<ProtectedRoute><BorrowingIncomingRequests /></ProtectedRoute>} />
              <Route path="/lending/outgoing" element={<ProtectedRoute><BorrowingOutgoingRequests /></ProtectedRoute>} />
              <Route path="/lending/transactions/:type" element={<ProtectedRoute><BorrowingTransactions /></ProtectedRoute>} />
              <Route path="/addbook" element={<ProtectedRoute><AddBook /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/student/:studentId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
              <Route path="/chat/:studentId?" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

              {/* ── Admin Protected Routes (محمية) ── */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/students" element={<AdminRoute><AdminStudents /></AdminRoute>} />
              <Route path="/admin/books" element={<AdminRoute><AdminBooks /></AdminRoute>} />

              {/* ── Legacy Routes (تم حمايتها الآن) ─ */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/books" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
              
            </Routes>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;