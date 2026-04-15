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
      <path
        d="M32 10C25.2 18 19 25.2 19 35C19 43.3 24.9 50 32 50C39.1 50 45 43.3 45 35C45 25.2 38.8 18 32 10Z"
        fill="currentColor"
      />
      <path
        d="M25.5 36H29.5L31.6 32.3L34 39L36.2 34.8H39.8"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 25.8C28.5 23.7 30.1 21.8 32 19.5"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
