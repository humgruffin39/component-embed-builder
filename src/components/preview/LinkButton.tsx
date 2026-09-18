import type { ButtonComponent } from "@/lib/payload";

const ExternalLinkIcon = () => (
  <svg className="dc-button__icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M10 5h9v9h-2V8.41l-9.29 9.3-1.42-1.42 9.3-9.29H10V5Z"
    />
    <path
      fill="currentColor"
      d="M5 7h4V5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4h-2v4H5V7Z"
    />
  </svg>
);

export const LinkButton = ({ label, url, emoji }: ButtonComponent) => (
  <a
    className="dc-button"
    href={url || undefined}
    target="_blank"
    rel="noopener noreferrer"
  >
    {emoji?.name && <span className="dc-button__emoji">{emoji.name}</span>}
    {label && <span>{label}</span>}
    <ExternalLinkIcon />
  </a>
);
