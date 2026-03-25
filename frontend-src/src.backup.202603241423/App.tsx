import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AgencyFilterProvider } from '@/contexts/AgencyFilterContext';
import { ContractsProvider } from '@/contexts/ContractsContext';
import { BudgetProvider } from '@/contexts/BudgetContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ContractsPage from '@/pages/ContractsPage';
import ContractDetailPage from '@/pages/ContractDetailPage';
import ContractFormPage from '@/pages/ContractFormPage';
import AgenciesPage from '@/pages/AgenciesPage';
import CalendrierPage from '@/pages/placeholders/CalendrierPage';
import BudgetSynthesePage from '@/pages/placeholders/BudgetSynthesePage';
import BudgetAgencesPage from '@/pages/placeholders/BudgetAgencesPage';
import BudgetLignesPage from '@/pages/placeholders/BudgetLignesPage';
import FournisseursPage from '@/pages/placeholders/FournisseursPage';
import ParametresPage from '@/pages/placeholders/ParametresPage';
import UsersPage from '@/pages/placeholders/UsersPage';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AgencyFilterProvider>
          <ContractsProvider>
            <BudgetProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="contrats" element={<ContractsPage />} />
                  <Route path="contrats/nouveau" element={<ContractFormPage />} />
                  <Route path="contrats/:id" element={<ContractDetailPage />} />
                  <Route path="contrats/:id/modifier" element={<ContractFormPage />} />
                  <Route path="calendrier" element={<CalendrierPage />} />
                  <Route path="budget/synthese" element={<BudgetSynthesePage />} />
                  <Route path="budget/agences" element={<BudgetAgencesPage />} />
                  <Route path="budget/lignes" element={<BudgetLignesPage />} />
                  <Route path="fournisseurs" element={<FournisseursPage />} />
                  <Route path="agences" element={<AgenciesPage />} />
                  <Route path="parametres" element={<ParametresPage />} />
                  <Route path="utilisateurs" element={<UsersPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <Toaster />
            </BudgetProvider>
          </ContractsProvider>
        </AgencyFilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
