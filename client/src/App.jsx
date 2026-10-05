import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Layout } from './components/Layout/Layout';

import { DashboardPage } from './pages/DashboardPage';
import { GroupsPage } from './pages/GroupsPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

import { AddExpenseModal } from './components/Expenses/AddExpenseModal';
import { CreateGroupModal } from './components/Groups/CreateGroupModal';
import { LoadingSpinner } from './components/Common/EmptyState';

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addExpenseGroupId, setAddExpenseGroupId] = useState(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace />;

  const handleOpenAddExpense = (groupId = null) => {
    setAddExpenseGroupId(groupId);
    setAddExpenseOpen(true);
  };

  return (
    <SocketProvider>
      <Layout onOpenAddExpense={handleOpenAddExpense}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                onOpenAddExpense={handleOpenAddExpense}
                onOpenCreateGroup={() => setCreateGroupOpen(true)}
              />
            }
          />
          <Route
            path="/groups"
            element={<GroupsPage onOpenCreateGroup={() => setCreateGroupOpen(true)} />}
          />
          <Route
            path="/groups/:id"
            element={<GroupDetailPage onOpenAddExpense={handleOpenAddExpense} />}
          />
          <Route
            path="/expenses"
            element={<ExpensesPage onOpenAddExpense={handleOpenAddExpense} />}
          />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Global Modals */}
        <AddExpenseModal
          isOpen={addExpenseOpen}
          onClose={() => setAddExpenseOpen(false)}
          defaultGroupId={addExpenseGroupId}
          onExpenseAdded={() => {
            // refresh trigger if on current page
          }}
        />

        <CreateGroupModal
          isOpen={createGroupOpen}
          onClose={() => setCreateGroupOpen(false)}
          onGroupCreated={() => {
            window.location.href = '/groups';
          }}
        />
      </Layout>
    </SocketProvider>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
