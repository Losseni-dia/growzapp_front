import { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Crisp } from "crisp-sdk-web";
// === COMPONENTS (chargés immédiatement, utilisés partout) ===
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import GrowzToaster from "./components/ui/Toaster";
import CrispUserHandler from "./components/Crips-ChatBox/CrispUserHandler";
// === PROVIDERS ===
import { CurrencyProvider } from "./components/Context/CurrencyContext";
import { HelmetProvider } from "react-helmet-async";
// === GUARDS (légers, chargés immédiatement) ===
import ProtectedRoute from "./components/ProtectedRoutes/ProtectedRoutes";
import AdminRoute from "./components/ProtectedRoutes/AdminRoutes";
import AdminLayout from "./components/AdminLayout/AdminLayout";

// === PAGES — chargement différé (code splitting) ===
// Pages publiques
const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage/LoginPage"));
const ProjetsPage = lazy(
  () => import("./pages/projet/projetsPage/ProjetsPage"),
);
const ProjetsFinancesPage = lazy(
  () => import("./pages/projet/projetsFinancesPage/ProjetsFinancesPage"),
);
const ProjetDetailsPage = lazy(
  () => import("./pages/projet/projetDetails/ProjetDetailsPage"),
);
const RegisterPage = lazy(() => import("./pages/RegisterPage/RegisterPage"));
const VerifierContrat = lazy(
  () => import("./pages/VerifierContrat/VerifierContrat"),
);
const NewsForm = lazy(() => import("./pages/news/newsForm/NewsForm"));
const NewsEdit = lazy(() => import("./pages/news/newsForm/NewsForm"));
const KycSuccess = lazy(() => import("./components/kyc/KycSuccess"));
const NewsPage = lazy(() => import("./pages/news/newsPage/NewsPage"));
const NewsDetail = lazy(() => import("./pages/news/newsDetails/NewsDetails"));
const OAuth2RedirectHandler = lazy(
  () => import("./components/Context/OAuth2RedirectHandler"),
);
const ForgotPassword = lazy(
  () => import("./pages/reset-password/ForgottenPassword"),
);
const ResetPassword = lazy(
  () => import("./pages/reset-password/ResetPassword"),
);
const MentionsLegales = lazy(
  () => import("./pages/LegalPages/MentionsLegales"),
);
const CGU = lazy(() => import("./pages/LegalPages/CGU"));
const RGPD = lazy(() => import("./pages/LegalPages/RGPD"));
const CGV = lazy(() => import("./pages/LegalPages/CGV"));

// Pages utilisateur connecté
const Dashboard = lazy(() => import("./pages/MonEspace/Dashboard"));
const ProjectForm = lazy(
  () => import("./components/Projet/ProjetForm/ProjetForm"),
);
const WalletPage = lazy(() => import("./pages/Wallet/WalletPage"));
const DepotPage = lazy(() => import("./pages/Depot/DepotPage"));
const DepositCancel = lazy(() => import("./pages/Depot/Cancel/CancelPage"));
const DepositSuccess = lazy(() => import("./pages/Depot/Success/SuccessPage"));
const MesInvestissementsPage = lazy(
  () => import("./pages/MonEspace/Mes-investissements/MesInvestissementsPage"),
);
const MesDividendesPage = lazy(
  () => import("./pages/MonEspace/Mes-dividendes/MesDividendes"),
);
const MesContratsPage = lazy(
  () => import("./pages/MonEspace/MesContrats/mes-contrats"),
);
const MesFacturesPage = lazy(
  () => import("./pages/MonEspace/MesFactures/mes-factures"),
);
const MonPortefeuillePage = lazy(
  () => import("./pages/MonEspace/Mon-portefeuille/MonPortefeuillePage"),
);
const MonDashboardPorteurPage = lazy(
  () =>
    import("./pages/MonEspace/Mon-dashboard-porteur/MonDashboardPorteurPage"),
);
const ProfileUpdateForm = lazy(
  () => import("./pages/MonEspace/ProfileUpdateForm/ProfileUpdateForm"),
);
const KYCUploadForm = lazy(() => import("./components/kyc/KycUploadForm"));
const ContratPage = lazy(
  () => import("./pages/Contrat/ContratsPage/ContratPage"),
);
const ContratViewer = lazy(
  () => import("./pages/Contrat/ContratView/ContratView"),
);

// Pages Admin
const DashboardAdmin = lazy(() => import("./pages/Admin/AdminDashboard"));
const ContratsAdmin = lazy(
  () => import("./pages/Admin/Contrats/ContratAdminPage"),
);
const InvestissementsAdminPage = lazy(
  () => import("./pages/Admin/Investissements/InvestissementsAdminPage"),
);
const EditProjetPage = lazy(
  () => import("./pages/Admin/Projets/EditProjet/EditProjetsPage"),
);
const UsersAdminPage = lazy(() => import("./pages/Admin/Users/AdminUsersPage"));
const ProjectWalletDetailPage = lazy(
  () =>
    import("./pages/Admin/WalletsProjets/WalletProjetDetails/WalletProjetDetails"),
);
const ProjectWalletsAdminPage = lazy(
  () => import("./pages/Admin/WalletsProjets/WalletsProjetsAdminPage"),
);
const ProjetAdminDetail = lazy(
  () => import("./pages/Admin/Projets/ProjetDetails/ProjetAdminDetail"),
);
const AdminProjetsList = lazy(
  () => import("./pages/Admin/Projets/AdminProjetsList"),
);
const KycAdminPanel = lazy(() =>
  import("./pages/Admin/Kyc/KycAdminPanel").then((m) => ({
    default: m.KycAdminPanel,
  })),
);
const ProjectSettingsPanel = lazy(
  () => import("./pages/Admin/Projets/ProjectSettings/ProjectsSettingsPanel"),
);
const ProjetsProches = lazy(
  () => import("./pages/projet/gps-projetProche/ProjetsProches"),
);
const NewsAdminPage = lazy(() => import("./pages/Admin/News/NewsAdminPage"));
const DividendesAdminPage = lazy(
  () => import("./pages/Admin/Dividendes/DividendesAdminPage"),
);
const FacturesAdminPage = lazy(
  () => import("./pages/Admin/Factures/FacturesAdminPage"),
);
const TransactionsAdminPage = lazy(
  () => import("./pages/Admin/Transactions/TransactionsAdminPage"),
);
const NotificationsAdminPage = lazy(
  () => import("./pages/Admin/Notifications/NotificationsAdminPage"),
);
const DocumentsAdminPage = lazy(
  () => import("./pages/Admin/Documents/DocumentsAdminPage"),
);
const ParametresAdminPage = lazy(
  () => import("./pages/Admin/Parametres/ParametresAdminPage"),
);
const CommentairesAdminPage = lazy(
  () => import("./pages/Admin/Commentaires/CommentairesAdminPage"),
);
const ContactAdminPage = lazy(
  () => import("./pages/Admin/Contact/ContactAdminPage"),
);

function App() {
  const location = useLocation();

  useEffect(() => {
    // 1. Initialisation simple (Le français sera automatique car c'est la seule langue restant)
    Crisp.configure("5437aabc-9202-40af-9d91-9901c5bb0271");

    // 2. Gestion de la visibilité sur les pages Admin
    if (location.pathname.startsWith("/admin")) {
      Crisp.chat.hide();
    } else {
      Crisp.chat.show();
    }
  }, [location]);

  return (
    <HelmetProvider>
      <CurrencyProvider>
        <Header />
        {/* Gère l'identification du nom et de l'email de l'investisseur */}
        <CrispUserHandler />
        <GrowzToaster />

        <main className="growzAppMain">
          <Suspense
            fallback={<div className="growzAppLoading">Chargement...</div>}
          >
            <Routes>
              {/* ==================== ROUTES PUBLIQUES ==================== */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/projets" element={<ProjetsPage />} />
              <Route
                path="/projets-finances"
                element={<ProjetsFinancesPage />}
              />
              <Route path="/projet/:id" element={<ProjetDetailsPage />} />
              <Route path="/verifier-contrat" element={<VerifierContrat />} />
              <Route
                path="/verifier-contrat/:code"
                element={<VerifierContrat />}
              />
              <Route path="/kyc/success" element={<KycSuccess />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route
                path="/oauth2/redirect"
                element={<OAuth2RedirectHandler />}
              />

              {/* Étape 1 : Demander le reset */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              {/* Étape 2 : Changer le mdp (Lien reçu par email) */}
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Routes Légales */}
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/rgpd" element={<RGPD />} />
              <Route path="/cgv" element={<CGV />} />

              {/* ==================== ROUTES UTILISATEUR CONNECTÉ ==================== */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mon-espace" element={<Dashboard />} />
                <Route path="/profile/edit" element={<ProfileUpdateForm />} />
                <Route path="/profile/kyc" element={<KYCUploadForm />} />
                <Route path="/projet/creer" element={<ProjectForm />} />
                <Route path="/projet/edit/:id" element={<ProjectForm />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/depot" element={<DepotPage />} />
                <Route path="/depot/success" element={<DepositSuccess />} />
                <Route path="/depot/cancel" element={<DepositCancel />} />
                <Route
                  path="/mes-investissements"
                  element={<MesInvestissementsPage />}
                />
                <Route
                  path="/mes-projets"
                  element={<Navigate to="/mon-dashboard-porteur" replace />}
                />
                <Route path="/mes-dividendes" element={<MesDividendesPage />} />
                <Route path="/mes-contrats" element={<MesContratsPage />} />
                <Route
                  path="/mon-dashboard-porteur"
                  element={<MonDashboardPorteurPage />}
                />
                <Route path="/mes-factures" element={<MesFacturesPage />} />
                <Route
                  path="/mon-portefeuille"
                  element={<MonPortefeuillePage />}
                />
                <Route path="/contrat/:numero" element={<ContratPage />} />
                <Route
                  path="/contrat/:numero/viewer"
                  element={<ContratViewer />}
                />
                <Route path="/projets/proximite" element={<ProjetsProches />} />
              </Route>

              {/* ==================== ROUTES ADMIN ==================== */}
              {/* Le layout (sidebar) est partagé par ADMIN et COMMUNICANT ;
                  chaque page à l'intérieur affine ensuite l'accès (AdminRoute
                  = ADMIN uniquement, ou ADMIN+COMMUNICANT pour les actualités). */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["ADMIN", "COMMUNICANT"]} />
                }
              >
                <Route element={<AdminLayout />}>
                  {/* --- ADMIN + COMMUNICANT : gestion des actualités --- */}
                  <Route path="/admin/news" element={<NewsAdminPage />} />
                  <Route path="/admin/news/new" element={<NewsForm />} />
                  <Route path="/admin/news/edit/:id" element={<NewsEdit />} />

                  {/* --- ADMIN UNIQUEMENT --- */}
                  <Route element={<AdminRoute />}>
                    {/* 1. LE HUB : Statistiques et KPIs */}
                    <Route path="/admin" element={<DashboardAdmin />} />

                    {/* 2. GESTION DES PROJETS */}
                    <Route
                      path="/admin/projets"
                      element={<AdminProjetsList />}
                    />
                    <Route
                      path="/admin/projets/detail/:id"
                      element={<ProjetAdminDetail />}
                    />
                    <Route
                      path="/admin/projets/edit/:id"
                      element={<EditProjetPage />}
                    />

                    {/* 3. UTILISATEURS & KYC */}
                    <Route path="/admin/users" element={<UsersAdminPage />} />
                    <Route path="/admin/kyc" element={<KycAdminPanel />} />

                    {/* 4. INVESTISSEMENTS & DIVIDENDES */}
                    <Route
                      path="/admin/investissements"
                      element={<InvestissementsAdminPage />}
                    />
                    <Route
                      path="/admin/dividendes"
                      element={<DividendesAdminPage />}
                    />

                    {/* 5. FINANCES : WALLETS, CONTRATS, FACTURES */}
                    <Route
                      path="/admin/project-wallets"
                      element={<ProjectWalletsAdminPage />}
                    />
                    <Route
                      path="/admin/project-wallets/:projetId"
                      element={<ProjectWalletDetailPage />}
                    />
                    <Route path="/admin/contrats" element={<ContratsAdmin />} />
                    <Route
                      path="/admin/factures"
                      element={<FacturesAdminPage />}
                    />
                    <Route
                      path="/admin/transactions"
                      element={<TransactionsAdminPage />}
                    />

                    {/* 6. CONTENU : COMMENTAIRES ET CONTACT (placeholders) */}
                    <Route
                      path="/admin/commentaires"
                      element={<CommentairesAdminPage />}
                    />
                    <Route
                      path="/admin/contact"
                      element={<ContactAdminPage />}
                    />
                    <Route
                      path="/admin/notifications"
                      element={<NotificationsAdminPage />}
                    />
                    <Route
                      path="/admin/documents"
                      element={<DocumentsAdminPage />}
                    />
                    
                    {/* 7. RÉFÉRENTIELS & PARAMÈTRES */}
                    <Route
                      path="/admin/settings"
                      element={<ProjectSettingsPanel />}
                    />
                    <Route
                      path="/admin/parametres"
                      element={<ParametresAdminPage />}
                    />
                  </Route>
                </Route>
              </Route>

              {/* ==================== REDIRECTIONS ==================== */}
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route
                path="/admin/*"
                element={<Navigate to="/admin" replace />}
              />

              {/* ==================== 404 ==================== */}
              <Route
                path="*"
                element={
                  <div className="growzNotFound">
                    <strong>404</strong>
                    <span>Page non trouvée</span>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </CurrencyProvider>
    </HelmetProvider>
  );
}

export default App;
