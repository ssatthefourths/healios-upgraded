interface Props {
  code: string;
  className?: string;
}

const FLAG_SIZE = "h-4 w-[22px] rounded-sm overflow-hidden shrink-0 ring-1 ring-black/10";

const GB = () => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
    <clipPath id="gb-t"><path d="M0 0v30h60V0z" /></clipPath>
    <clipPath id="gb-s"><path d="M30 15h30v15zM0 15v15h30zM30 15H0V0zM30 15V0h30z" /></clipPath>
    <g clipPath="url(#gb-t)">
      <path d="M0 0v30h60V0z" fill="#012169" />
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l60 30m0-30L0 30" clipPath="url(#gb-s)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

const ZA = () => (
  <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
    <path fill="#007A4D" d="M0 0h60v40H0z" />
    <path fill="#fff" d="M0 0l30 20L0 40z" />
    <path fill="#000" d="M0 5l22 15L0 35z" />
    <path fill="#DE3831" d="M10 0h50v13L30 20 10 10z" />
    <path fill="#002395" d="M10 40h50V27L30 20 10 30z" />
    <path fill="#FFB612" d="M0 0h4l32 20L4 40H0v-5l25-15L0 5z" />
  </svg>
);

const US = () => (
  <svg viewBox="0 0 60 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
    <path fill="#B22234" d="M0 0h60v32H0z" />
    <path stroke="#fff" strokeWidth="2.46" d="M0 3.69h60M0 8.62h60M0 13.54h60M0 18.46h60M0 23.38h60M0 28.31h60" />
    <path fill="#3C3B6E" d="M0 0h24v17H0z" />
  </svg>
);

const EU = () => (
  <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
    <path fill="#003399" d="M0 0h60v40H0z" />
    <g fill="#FFCC00">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const cx = 30 + Math.cos(angle) * 12;
        const cy = 20 + Math.sin(angle) * 12;
        return <circle key={i} cx={cx} cy={cy} r="1.6" />;
      })}
    </g>
  </svg>
);

const CA = () => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
    <path fill="#FF0000" d="M0 0h15v30H0zM45 0h15v30H45z" />
    <path fill="#fff" d="M15 0h30v30H15z" />
    <path fill="#FF0000" d="M30 6l2 4 4-1-2 4 4 2-4 1 1 4-5-3-5 3 1-4-4-1 4-2-2-4 4 1z" />
  </svg>
);

const AU = () => (
  <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
    <path fill="#00247D" d="M0 0h60v30H0z" />
    <path stroke="#fff" strokeWidth="3" d="M0 0l30 15M30 0L0 15" />
    <path stroke="#CF142B" strokeWidth="1.5" d="M0 0l30 15M30 0L0 15" />
    <path stroke="#fff" strokeWidth="5" d="M15 0v15M0 7.5h30" />
    <path stroke="#CF142B" strokeWidth="2.5" d="M15 0v15M0 7.5h30" />
    <g fill="#fff">
      <circle cx="48" cy="22" r="1.5" />
      <circle cx="52" cy="17" r="1.5" />
      <circle cx="44" cy="14" r="1.5" />
      <circle cx="55" cy="24" r="1.5" />
      <circle cx="40" cy="20" r="1.5" />
      <circle cx="12" cy="22" r="2" />
    </g>
  </svg>
);

export const CurrencyFlag = ({ code, className = "" }: Props) => {
  const Flag = (() => {
    switch (code) {
      case "GBP": return GB;
      case "ZAR": return ZA;
      case "USD": return US;
      case "EUR": return EU;
      case "CAD": return CA;
      case "AUD": return AU;
      default: return null;
    }
  })();
  if (!Flag) return null;
  return (
    <span className={`${FLAG_SIZE} ${className}`} aria-label={code}>
      <Flag />
    </span>
  );
};

export default CurrencyFlag;
