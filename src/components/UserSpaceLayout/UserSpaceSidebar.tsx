import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUser,
  FiCheckCircle,
  FiTrendingUp,
  FiGift,
  FiCreditCard,
  FiFileText,
  FiClipboard,
  FiBriefcase,
  FiPlusCircle,
  FiDownload,
  FiArrowUpCircle,
  FiRepeat,
  FiMail,
  FiTruck,
  FiShoppingBag,
} from "react-icons/fi";
import styles from "./UserSpaceLayout.module.css";

interface UserSpaceSidebarProps {
  isInvestisseur: boolean;
  onNavigate?: () => void;
}

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

export default function UserSpaceSidebar({
  isInvestisseur,
  onNavigate,
}: UserSpaceSidebarProps) {
  const { t } = useTranslation();

  const sections: SidebarSection[] = [];

  sections.push({
    title: t("user_sidebar.section_overview", "Vue d'ensemble"),
    links: [
      {
        to: "/mon-espace",
        end: true,
        label: t("user_sidebar.dashboard", "Tableau de bord"),
        icon: <FiGrid size={16} />,
      },
    ],
  });

  // Section porteur — toujours visible (permet de créer un premier projet
  // même avant d'avoir le rôle PORTEUR, qui n'est attribué qu'à la
  // validation du premier projet).
  sections.push({
    title: t("user_sidebar.section_porteur", "Porteur de projet"),
    links: [
      {
        to: "/mon-dashboard-porteur",
        label: t("user_sidebar.my_projects", "Mes projets"),
        icon: <FiBriefcase size={16} />,
      },
      {
        to: "/projet/creer",
        label: t("user_sidebar.create_project", "Créer un projet"),
        icon: <FiPlusCircle size={16} />,
      },
      {
        to: "/profile/fiche-porteur",
        label: t("user_sidebar.fiche_porteur", "Ma fiche porteur"),
        icon: <FiCheckCircle size={16} />,
      },
      {
        to: "/fournisseurs",
        label: t("user_sidebar.fournisseurs", "Trouver un fournisseur"),
        icon: <FiTruck size={16} />,
      },
      {
        to: "/mes-commandes",
        label: t("user_sidebar.mes_commandes", "Mes commandes"),
        icon: <FiShoppingBag size={16} />,
      },
      {
        to: "/mon-espace/ma-boutique",
        label: t("user_sidebar.ma_boutique", "Ma Boutique GrowzMarket"),
        icon: <FiShoppingBag size={16} />,
      },
      {
        to: "/mon-espace/mes-ventes-market",
        label: t("user_sidebar.mes_ventes_market", "Mes ventes GrowzMarket"),
        icon: <FiShoppingBag size={16} />,
      },
    ],
  });

  if (isInvestisseur) {
    sections.push({
      title: t("user_sidebar.section_investisseur", "Investisseur"),
      links: [
        {
          to: "/mes-investissements",
          label: t("user_sidebar.my_investments", "Mes investissements"),
          icon: <FiTrendingUp size={16} />,
        },
        {
          to: "/mon-portefeuille",
          label: t("user_sidebar.my_portfolio", "Mon portefeuille"),
          icon: <FiBriefcase size={16} />,
        },
        {
          to: "/mes-dividendes",
          label: t("user_sidebar.my_dividends", "Mes dividendes"),
          icon: <FiGift size={16} />,
        },
      ],
    });
  }

  sections.push({
    title: t("user_sidebar.section_finance", "Finance"),
    links: [
      {
        to: "/wallet",
        end: true,
        label: t("user_sidebar.wallet", "Mon portefeuille GrowzApp"),
        icon: <FiCreditCard size={16} />,
      },
      {
        to: "/depot",
        label: t("user_sidebar.deposit", "Déposer des fonds"),
        icon: <FiDownload size={16} />,
      },
      {
        to: "/wallet?tab=withdraw",
        label: t("user_sidebar.withdraw", "Retirer des fonds"),
        icon: <FiArrowUpCircle size={16} />,
      },
      {
        to: "/wallet?tab=transfer",
        label: t("user_sidebar.transfer", "Transférer des fonds"),
        icon: <FiRepeat size={16} />,
      },
      {
        to: "/mon-espace/mes-achats-market",
        label: t("user_sidebar.mes_achats_market", "Mes achats GrowzMarket"),
        icon: <FiShoppingBag size={16} />,
      },
    ],
  });

  sections.push({
    title: t("user_sidebar.section_documents", "Documents"),
    links: [
      {
        to: "/mes-contrats",
        label: t("user_sidebar.my_contracts", "Mes contrats"),
        icon: <FiFileText size={16} />,
      },
      {
        to: "/mes-factures",
        label: t("user_sidebar.my_invoices", "Mes factures"),
        icon: <FiClipboard size={16} />,
      },
    ],
  });

  sections.push({
    title: t("user_sidebar.section_account", "Compte"),
    links: [
      {
        to: "/profile/edit",
        label: t("user_sidebar.profile", "Mon profil"),
        icon: <FiUser size={16} />,
      },
      {
        to: "/profile/kyc",
        label: t("user_sidebar.kyc", "Vérification d'identité (KYC)"),
        icon: <FiCheckCircle size={16} />,
      },
      {
        to: "/mon-espace/contact",
        label: t("user_sidebar.contact", "Contact / Support"),
        icon: <FiMail size={16} />,
      },
      {
        to: "/mon-espace/fournisseur",
        label: t("user_sidebar.mon_espace_fournisseur", "Mon espace fournisseur"),
        icon: <FiTruck size={16} />,
      },
    ],
  });

  return (
    <nav className={styles.sidebar} aria-label={t("user_sidebar.aria_label", "Menu de mon espace")}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        <span className={styles.brandLabel}>{t("user_sidebar.brand", "Mon espace")}</span>
      </div>

      {sections.map((section) => (
        <div key={section.title} className={styles.section}>
          <span className={styles.sectionTitle}>{section.title}</span>
          {section.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.linkActive : ""}`
              }
            >
              <span className={styles.linkIcon}>{link.icon}</span>
              <span className={styles.linkLabel}>{link.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
