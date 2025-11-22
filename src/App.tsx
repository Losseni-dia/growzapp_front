// src/App.tsx → VERSION ULTIME, PROPRE, SÉCURISÉE & OPTIMISÉE (19 novembre 2025)

import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import GrowzToaster from "./components/ui/Toaster";

// Pages publiques
import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import ProjetsPage from "./pages/ProjetsPage/ProjetsPage";
import ProjetDetailsPage from "./pages/ProjetDetails/ProjetDetailsPage";

// Pages utilisateur connecté
import Dashboard from "./pages/MonEspace/Dashboard";
import ProjectForm from "./components/Projet/ProjetForm/ProjetForm";
import DividendesPage from "./pages/DividendesPage/DividendesPage";

// Pages ADMIN
import DashboardAdmin from "./pages/Admin/Dashboard"; // ← Corrige le typo "Dashbord"
import UsersAdminPage from "./pages/Admin/Users/AdminUsersPage";
import ProjetsAdminPage from "./pages/Admin/Projets/AdminProjetsPage";
import InvestissementsAdminPage from "./pages/Admin/Investissements/InvestissementsAdminPage";

// Guards
import ProtectedRoute from "./components/ProtectedRoutes/ProtectedRoutes"; // ← Route connecté only
import AdminRoute from "./components/ProtectedRoutes/ProtectedRoutes"; // ← NOUVEAU : Admin only
import EditProjetPage from "./pages/Admin/Projets/EditProjet/EditProjetsPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import ProfileUpdateForm from "./components/ProfileUpdateForm/ProfileUpdateForm";

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
          <Route path="/projets" element={<ProjetsPage />} />
          <Route path="/projet/:id" element={<ProjetDetailsPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ==================== ROUTES UTILISATEUR CONNECTÉ ==================== */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mon-espace" element={<Dashboard />} />
            <Route path="/profile/edit" element={<ProfileUpdateForm />} />
            <Route path="/dividendes" element={<DividendesPage />} />
            <Route path="/projet/creer" element={<ProjectForm />} />
            <Route path="/projet/edit/:id" element={<ProjectForm />} />
          </Route>

          {/* ==================== ESPACE ADMIN (double protection) ==================== */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<DashboardAdmin />} />
              <Route path="/admin/users" element={<UsersAdminPage />} />
              <Route path="/admin/projets" element={<ProjetsAdminPage />} />
              // Dans la section admin
              <Route
                path="/admin/projets/edit/:id"
                element={<EditProjetPage />}
              />
              <Route
                path="/admin/investissements"
                element={<InvestissementsAdminPage />}
              />
              {/* Tu pourras ajouter plus tard :
              <Route path="/admin/dividendes" element={<AdminDividendesPage />} />
              <Route path="/admin/contrats" element={<AdminContratsPage />} /> */}
            </Route>
          </Route>

          {/* ==================== REDIRECTIONS INTELLIGENTES ==================== */}
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          <Route path="/home" element={<Navigate to="/" replace />} />

          {/* ==================== 404 ==================== */}
          <Route
            path="*"
            element={
              <div
                style={{
                  textAlign: "center",
                  padding: "100px 20px",
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
