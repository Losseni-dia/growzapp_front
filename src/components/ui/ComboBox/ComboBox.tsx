// src/components/ui/ComboBox/ComboBox.tsx
import { useEffect, useRef, useState } from "react";
import styles from "./ComboBox.module.css";

interface ComboBoxProps {
  label: string;
  icon?: React.ReactNode;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  loading?: boolean;
  required?: boolean;
}

// ─── Sécurité : sanitise la saisie libre ─────────────────────────────────────
// Supprime les caractères dangereux pour éviter XSS et injections
// Les caractères autorisés : lettres (toutes langues), chiffres, espaces,
// apostrophes, tirets, points, virgules — tout le reste est retiré.
function sanitize(raw: string): string {
  return raw
    .replace(/[<>{}[\]\\|^`"]/g, "") // balises HTML, JSON, shell
    .replace(/javascript:/gi, "") // protocole XSS
    .replace(/on\w+\s*=/gi, "") // event handlers inline (onclick=...)
    .slice(0, 100); // longueur max 100 caractères
}

// Normalise les apostrophes pour comparer sans se soucier du type
// ' (U+2019) → ' (U+0027)
function normalizeApostrophe(str: string): string {
  return str.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035`]/g, "'");
}

function matchesQuery(option: string, query: string): boolean {
  const normOption = normalizeApostrophe(option).toLowerCase();
  const normQuery = normalizeApostrophe(query).toLowerCase();
  return normOption.includes(normQuery);
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ComboBox({
  label,
  icon,
  placeholder,
  value,
  onChange,
  options,
  loading = false,
  required = false,
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync si valeur externe change (ex: reset du formulaire)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        onChange(query);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query, onChange]);

  const filtered = options.filter((o) => matchesQuery(o, query));

  const handleSelect = (opt: string) => {
    setQuery(opt);
    onChange(opt);
    setOpen(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = sanitize(e.target.value);
    setQuery(clean);
    onChange(clean);
    setOpen(true);
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <label className={styles.label}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {label}
      </label>

      <div className={styles.inputWrap}>
        <input
          type="text"
          className={styles.input}
          placeholder={loading ? "Chargement..." : placeholder}
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          required={required}
          disabled={loading}
          autoComplete="off"
          maxLength={100}
        />
        <button
          type="button"
          className={styles.chevron}
          onClick={() => setOpen((prev) => !prev)}
          tabIndex={-1}
          aria-label="Ouvrir la liste"
        >
          {open ? "▲" : "▼"}
        </button>
      </div>

      {open && (
        <ul className={styles.dropdown} role="listbox">
          {loading && <li className={styles.info}>Chargement...</li>}

          {!loading && filtered.length === 0 && query.length > 0 && (
            <li className={styles.infoNew}>
              ✎ &nbsp;« <strong>{query}</strong> » sera enregistré comme
              nouvelle valeur
            </li>
          )}

          {!loading && filtered.length === 0 && query.length === 0 && (
            <li className={styles.info}>
              Commencez à taper ou choisissez dans la liste
            </li>
          )}

          {!loading &&
            filtered.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={opt === value}
                className={`${styles.option} ${opt === value ? styles.selected : ""}`}
                onMouseDown={() => handleSelect(opt)}
              >
                {opt}
                {opt === value && <span className={styles.check}>✓</span>}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
