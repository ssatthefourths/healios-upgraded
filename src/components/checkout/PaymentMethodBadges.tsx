const VisaLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto" aria-label="Visa" role="img" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#1A1F71" />
    <path
      d="M20.3 21.2l1.6-10h2.6l-1.6 10h-2.6zm12-9.8c-.5-.2-1.3-.4-2.3-.4-2.6 0-4.4 1.4-4.4 3.3 0 1.4 1.3 2.2 2.3 2.7 1 .5 1.4.8 1.4 1.3 0 .7-.8 1-1.6 1-1.1 0-1.6-.2-2.5-.5l-.3-.2-.4 2.2c.7.3 1.9.6 3.1.6 2.8 0 4.5-1.4 4.5-3.4 0-1.1-.6-1.9-2.1-2.6-.9-.5-1.4-.8-1.4-1.3 0-.5.5-.9 1.7-.9 1 0 1.7.2 2.2.4l.3.1.4-2.3zm6.6-.2h-2c-.6 0-1.1.2-1.3.9l-3.8 9.1h2.7s.4-1.2.5-1.5H38c.1.4.3 1.5.3 1.5h2.4l-2.1-10zm-3.1 6.5c.2-.6 1-2.8 1-2.8s.2-.6.4-1l.2.9s.5 2.4.6 2.9h-2.2zm-19-6.5l-2.5 6.8-.3-1.4c-.5-1.7-2-3.4-3.7-4.3l2.3 8.9h2.7l4.1-10h-2.6z"
      fill="#fff"
    />
  </svg>
);

const MastercardLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto" aria-label="Mastercard" role="img" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#fff" stroke="#e5e7eb" />
    <circle cx="20" cy="16" r="8" fill="#EB001B" />
    <circle cx="28" cy="16" r="8" fill="#F79E1B" />
    <path d="M24 9.5a8 8 0 000 13 8 8 0 000-13z" fill="#FF5F00" />
  </svg>
);

const AmexLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto" aria-label="American Express" role="img" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#006FCF" />
    <text x="24" y="20" textAnchor="middle" fill="#fff" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="7" fontWeight="700" letterSpacing="0.5">AMEX</text>
  </svg>
);

const StripeBadge = () => (
  <svg viewBox="0 0 60 24" className="h-5 w-auto opacity-70" aria-label="Powered by Stripe" role="img" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="16" fill="currentColor" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="10" fontWeight="500">Powered by</text>
    <text x="42" y="16" fill="#635BFF" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="11" fontWeight="700">Stripe</text>
  </svg>
);

interface Props {
  showAmex?: boolean;
}

export const PaymentMethodBadges = ({ showAmex = false }: Props) => (
  <div className="flex items-center justify-center gap-3 py-2">
    <VisaLogo />
    <MastercardLogo />
    {showAmex && <AmexLogo />}
    <span className="ml-2 text-muted-foreground">
      <StripeBadge />
    </span>
  </div>
);

export default PaymentMethodBadges;
