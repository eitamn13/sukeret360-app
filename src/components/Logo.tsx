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
      <circle cx="32" cy="32" r="25" stroke="currentColor" strokeWidth="3" opacity="0.18" />
      <path
        d="M32 15C26.8 23 23 28 23 33.9C23 40.1 27.1 44.5 32 44.5C36.9 44.5 41 40.1 41 33.9C41 28 37.2 23 32 15Z"
        fill="currentColor"
      />
      <path
        d="M18 38H25L28.5 32L33 42L36.5 35.5H46"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
