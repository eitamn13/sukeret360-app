interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="הסוכרת שלי"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <rect x="10" y="10" width="44" height="44" rx="16" stroke="currentColor" strokeWidth="3" opacity="0.18" />
      <path
        d="M32 16C27.3 22.1 24 26.8 24 32.6C24 38.2 27.6 42.2 32 42.2C36.4 42.2 40 38.2 40 32.6C40 26.8 36.7 22.1 32 16Z"
        fill="currentColor"
      />
      <path
        d="M32 24V34"
        stroke="#FFFFFF"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M27 29H37"
        stroke="#FFFFFF"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
