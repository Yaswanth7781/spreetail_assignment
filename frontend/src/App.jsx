import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateGroup from './pages/CreateGroup';
import GroupDetail from './pages/GroupDetail';
import CreateExpense from './pages/CreateExpense';
import ExpenseDetail from './pages/ExpenseDetail';
import Settle from './pages/Settle';
import ImportCSV from './pages/ImportCSV';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/groups/new" element={<ProtectedRoute><Layout><CreateGroup /></Layout></ProtectedRoute>} />
      <Route path="/groups/:id" element={<ProtectedRoute><Layout><GroupDetail /></Layout></ProtectedRoute>} />
      <Route path="/groups/:id/expenses/new" element={<ProtectedRoute><Layout><CreateExpense /></Layout></ProtectedRoute>} />
      <Route path="/groups/:id/expenses/:eid" element={<ProtectedRoute><Layout><ExpenseDetail /></Layout></ProtectedRoute>} />
      <Route path="/groups/:id/settle" element={<ProtectedRoute><Layout><Settle /></Layout></ProtectedRoute>} />
      <Route path="/groups/:id/import" element={<ProtectedRoute><Layout><ImportCSV /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
