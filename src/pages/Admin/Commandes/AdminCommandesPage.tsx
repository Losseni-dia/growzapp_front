import AdminCommandesList from "./AdminCommandesList";

export default function AdminCommandesPage() {
  return <AdminCommandesList allowedOnglets={["EN_ATTENTE", "A_PAYER"]} />;
}
