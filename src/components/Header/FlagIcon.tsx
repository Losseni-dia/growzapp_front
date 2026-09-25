// SVG inline plutôt qu'emoji drapeau — Windows ne rend pas les emoji
// drapeau nativement (faute de police adaptée) et affiche à la place le
// code pays en lettres (FR, GB, ES), ce qui n'était pas l'effet voulu.
const FLAGS: Record<string, JSX.Element> = {
  fr: (
    <svg viewBox="0 0 3 2" width="18" height="12" aria-hidden="true">
      <rect width="1" height="2" x="0" fill="#0055A4" />
      <rect width="1" height="2" x="1" fill="#FFFFFF" />
      <rect width="1" height="2" x="2" fill="#EF4135" />
    </svg>
  ),
  gb: (
    <svg viewBox="0 0 60 30" width="18" height="12" aria-hidden="true">
      <clipPath id="flagIconGbClip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#flagIconGbClip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" strokeWidth="2" />
        <path d="M30,0 30,30 M0,15 60,15" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 30,30 M0,15 60,15" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  ),
  es: (
    <svg viewBox="0 0 3 2" width="18" height="12" aria-hidden="true">
      <rect width="3" height="2" fill="#AA151B" />
      <rect width="3" height="1" y="0.5" fill="#F1BF00" />
    </svg>
  ),
};

export default function FlagIcon({ code }: { code: string }) {
  return FLAGS[code] ?? null;
}
