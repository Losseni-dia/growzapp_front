import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiCheckCircle,
  FiFolder,
  FiTrendingUp,
  FiGift,
  FiCreditCard,
  FiFileText,
  FiClipboard,
  FiRss,
  FiMessageSquare,
  FiMail,
  FiMap,
  FiSettings,
  FiBell,
  FiActivity,
} from "react-icons/fi";
import styles from "./AdminLayout.module.css";

interface AdminSidebarProps {
  isAdmin: boolean;
  isCommunicant: boolean;
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

export default function AdminSidebar({
  isAdmin,
  isCommunicant,
  onNavigate,
}: AdminSidebarProps) {
  const { t } = useTranslation();

  const sections: SidebarSection[] = [];

  if (isAdmin) {
    sections.push({
      title: t("admin.sidebar.section_overview"),
      links: [
        {
          to: "/admin",
          end: true,
          label: t("admin.sidebar.dashboard"),
          icon: <FiGrid size={16} />,
        },
      ],
    });

    sections.push({
      title: t("admin.sidebar.section_users"),
      links: [
        {
          to: "/admin/users",
          label: t("admin.sidebar.users"),
          icon: <FiUsers size={16} />,
        },
        {
          to: "/admin/kyc",
          label: t("admin.sidebar.kyc"),
          icon: <FiCheckCircle size={16} />,
        },
      ],
    });

    sections.push({
      title: t("admin.sidebar.section_projects"),
      links: [
        {
          to: "/admin/projets",
          label: t("admin.sidebar.projects"),
          icon: <FiFolder size={16} />,
        },
        {
          to: "/admin/investissements",
          label: t("admin.sidebar.investments"),
          icon: <FiTrendingUp size={16} />,
        },
        {
          to: "/admin/dividendes",
          label: t("admin.sidebar.dividends"),
          icon: <FiGift size={16} />,
        },
      ],
    });

    sections.push({
      title: t("admin.sidebar.section_finance"),
      links: [
        {
          to: "/admin/project-wallets",
          label: t("admin.sidebar.project_wallets"),
          icon: <FiCreditCard size={16} />,
        },
        {
          to: "/admin/transactions",
          label: t("admin.sidebar.transactions"),
          icon: <FiActivity size={16} />,
        },
        {
          to: "/admin/contrats",
          label: t("admin.sidebar.contracts"),
          icon: <FiFileText size={16} />,
        },
        {
          to: "/admin/factures",
          label: t("admin.sidebar.invoices"),
          icon: <FiClipboard size={16} />,
        },
      ],
    });
  }

  const contentLinks: SidebarLink[] = [];
  if (isAdmin || isCommunicant) {
    contentLinks.push({
      to: "/admin/news",
      label: t("admin.sidebar.news"),
      icon: <FiRss size={16} />,
    });
  }
  if (isAdmin) {
    contentLinks.push(
      {
        to: "/admin/commentaires",
        label: t("admin.sidebar.comments"),
        icon: <FiMessageSquare size={16} />,
      },
      {
        to: "/admin/contact",
        label: t("admin.sidebar.contact"),
        icon: <FiMail size={16} />,
      },
      {
        to: "/admin/notifications",
        label: t("admin.sidebar.notifications"),
        icon: <FiBell size={16} />,
      },
    );
  }
  if (contentLinks.length > 0) {
    sections.push({
      title: t("admin.sidebar.section_content"),
      links: contentLinks,
    });
  }

  if (isAdmin) {
    sections.push({
      title: t("admin.sidebar.section_referentiels"),
      links: [
        {
          to: "/admin/settings",
          label: t("admin.sidebar.referentiels"),
          icon: <FiMap size={16} />,
        },
      ],
    });

    sections.push({
      title: t("admin.sidebar.section_config"),
      links: [
        {
          to: "/admin/parametres",
          label: t("admin.sidebar.parameters"),
          icon: <FiSettings size={16} />,
        },
      ],
    });
  }

  return (
    <nav className={styles.sidebar} aria-label={t("admin.sidebar.aria_label")}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        <span className={styles.brandLabel}>{t("admin.sidebar.brand")}</span>
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
