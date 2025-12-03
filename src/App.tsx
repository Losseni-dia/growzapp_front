// src/App.tsx → VERSION ULTIME & PARFAITE 2025

import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import GrowzToaster from "./components/ui/Toaster";

// Pages publiques
import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import ProjetsPage from "./pages/ProjetsPage/ProjetsPage";
import ProjetDetailsPage from "./pages/ProjetDetails/ProjetDetailsPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";

// Pages utilisateur connecté
import Dashboard from "./pages/MonEspace/Dashboard";
import ProjectForm from "./components/Projet/ProjetForm/ProjetForm";
import DividendesPage from "./pages/DividendesPage/DividendesPage";
import WalletPage from "./pages/Wallet/WalletPage";
import DepotPage from "./pages/Depot/DepotPage";
import RetraitPage from "./pages/Retrait/RetraitPage";
import DepositCancel from "./pages/Depot/Cancel/CancelPage";
import DepositSuccess from "./pages/Depot/Success/SuccessPage";
import WithdrawCancelPage from "./pages/Retrait/Cancel/CancelPage";
import WithdrawSuccessPage from "./pages/Retrait/Success/SuccessPage";
import MesInvestissementsPage from "./pages/MonEspace/Mes-investissements/MesInvestissementsPage";
import MesProjetsPage from "./pages/MonEspace/Mes-projets/MesProjetsPage";
import ProfileUpdateForm from "./components/ProfileUpdateForm/ProfileUpdateForm";

// Pages Admin


// Composants


// Guards
import ProtectedRoute from "./components/ProtectedRoutes/ProtectedRoutes";
import DashboardAdmin from "./pages/Admin/AdminDashboard";
import AdminWithdrawalsPage from "./pages/Admin/AdminRetraitWalletPage/AdminRetraitWalletPage";
import ContratsAdmin from "./pages/Admin/Contrats/ContratAdminPage";
import InvestissementsAdminPage from "./pages/Admin/Investissements/InvestissementsAdminPage";
import EditProjetPage from "./pages/Admin/Projets/EditProjet/EditProjetsPage";
import UsersAdminPage from "./pages/Admin/Users/AdminUsersPage";
import ProjectWalletDetailPage from "./pages/Admin/WalletsProjets/WalletProjetDetails/WalletProjetDetails";
import ProjectWalletsAdminPage from "./pages/Admin/WalletsProjets/WalletsProjetsAdminPage";
import AdminRoute from "./components/ProtectedRoutes/AdminRoutes";
import ContratPage from "./pages/Contrat/ContratPage";
import VerifierContrat from "./pages/VerifierContrat/VerifierContrat";

function App() {
  return (
    <>
      <Header />
      <GrowzToaster />

      <main style={{ minHeight: "80vh" }}>
        <Routes>
          {/* ==================== ROUTES PUBLIQUES ==================== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/projets" element={<ProjetsPage />} />
          <Route path="/projet/:id" element={<ProjetDetailsPage />} />
          <Route path="/verifier-contrat" element={<VerifierContrat />} />
          <Route path="/verifier-contrat/:code" element={<VerifierContrat />} />

          {/* ==================== ROUTES UTILISATEUR CONNECTÉ ==================== */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mon-espace" element={<Dashboard />} />
            <Route path="/profile/edit" element={<ProfileUpdateForm />} />
            <Route path="/dividendes" element={<DividendesPage />} />
            <Route path="/projet/creer" element={<ProjectForm />} />
            <Route path="/projet/edit/:id" element={<ProjectForm />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/depot" element={<DepotPage />} />
            <Route path="/retrait" element={<RetraitPage />} />
            <Route path="/depot/success" element={<DepositSuccess />} />
            <Route path="/depot/cancel" element={<DepositCancel />} />
            <Route path="/retrait/success" element={<WithdrawSuccessPage />} />
            <Route path="/retrait/cancel" element={<WithdrawCancelPage />} />
            <Route
              path="/mes-investissements"
              element={<MesInvestissementsPage />}
            />
            <Route path="/mes-projets" element={<MesProjetsPage />} />

            {/* LA ROUTE QUI POSAIT PROBLÈME — CORRIGÉE À 100% */}
            <Route path="/contrat/:numero" element={<ContratPage />} />
          </Route>

          {/* ==================== ROUTES ADMIN ==================== */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<DashboardAdmin />} />
              <Route path="/admin/users" element={<UsersAdminPage />} />
              <Route path="/admin/projets" element={<ProjetsPage />} />
              <Route path="/admin/contrats" element={<ContratsAdmin />} />
              <Route
                path="/admin/investissements"
                element={<InvestissementsAdminPage />}
              />
              <Route
                path="/admin/project-wallets"
                element={<ProjectWalletsAdminPage />}
              />
              <Route
                path="/admin/project-wallets/:projetId"
                element={<ProjectWalletDetailPage />}
              />
              <Route
                path="/admin/retraits"
                element={<AdminWithdrawalsPage />}
              />
              <Route
                path="/admin/projets/edit/:id"
                element={<EditProjetPage />}
              />
            </Route>
          </Route>

          {/* ==================== REDIRECTIONS ==================== */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

          {/* ==================== 404 ==================== */}
          <Route
            path="*"
            element={
              <div
                style={{
                  textAlign: "center",
                  padding: "100px",
                  fontSize: "2rem",
                  color: "#666",
                }}
              >
                404 – Page non trouvée
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;
