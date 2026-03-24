/** Ícones estilizados para reforço de confiança (marcas genéricas / estilo). */
export function VisaMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path
        d="M20.5 11.2h-3.2l-2 9.6h3.2l2-9.6zm8.3 6.2c0-2-.9-3.6-3.5-3.6-1.7 0-2.8.8-3.2 2l2.5.1c.1-.4.5-.7 1-.7.6 0 .9.3.9.8v.7h-1.2c-2.8 0-4.3 1.2-4.3 3 0 1.5 1.1 2.4 2.6 2.4 1 0 1.9-.4 2.4-1.1v.9h2.8v-5.5zm-2.8 1.3c0 .9-.7 1.5-1.7 1.5-.7 0-1.1-.3-1.1-.8 0-.7.6-1 1.6-1h1.2v.3zm-9.5-7.5l-2.4 6.3-.3-1.5c-.4-1.4-1.7-2.6-3.2-2.9l2.2 8.2h3.1l4.6-10.1h-3zm12.8 0h-2.8l-2 9.6h2.7l.4-2h1.5c2.8 0 4.4-1.4 4.4-3.8 0-2.3-1.4-3.8-4.2-3.8zm-.3 5.5h-.9l.6-3.1c.1 0 .2-.1.4-.1.9 0 1.4.4 1.4 1.2 0 1.1-.7 2-1.5 2z"
        fill="#fff"
      />
    </svg>
  );
}

export function MastercardMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="32" rx="4" fill="#1a1a1a" />
      <circle cx="19" cy="16" r="9" fill="#EB001B" />
      <circle cx="29" cy="16" r="9" fill="#F79E1B" />
      <path
        d="M24 10.2a8.9 8.9 0 000 11.6 8.9 8.9 0 000-11.6z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function PixMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="32" rx="4" fill="#0d3b2c" />
      <path
        d="M24 8.5l-6.2 6.2a2.8 2.8 0 000 4l6.2 6.2 6.2-6.2a2.8 2.8 0 000-4L24 8.5z"
        stroke="#32BCAD"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M20.5 16h7"
        stroke="#32BCAD"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
