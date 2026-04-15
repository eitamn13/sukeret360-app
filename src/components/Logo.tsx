interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sukeret360 logo"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="heartStroke" x1="8" y1="16" x2="96" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB299" />
          <stop offset="1" stopColor="#F08A8A" />
        </linearGradient>
        <linearGradient id="dropFill" x1="41" y1="38" x2="60" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D97777" />
          <stop offset="1" stopColor="#B64E58" />
        </linearGradient>
        <linearGradient id="leafFill" x1="71" y1="22" x2="104" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#CF6A67" />
          <stop offset="1" stopColor="#B84952" />
        </linearGradient>
      </defs>

      <path
        d="M23 28C13.4 28 6 35.7 6 45.2C6 57.2 16.4 67.5 31.7 81.2C42.9 91.1 53.7 99.5 56.4 101.6C59.2 99.6 70 91.2 81.2 81.2C96.5 67.5 107 57.2 107 45.2C107 35.7 99.5 28 90 28C83.9 28 78.1 30.8 74.4 35.3C71.5 38.8 67.6 42.4 62.8 46.2C60.5 48 58.2 49.7 56.2 51.1C52.4 48.2 47.4 44.2 42.1 38.6C37.5 31.7 30.8 28 23 28Z"
        stroke="url(#heartStroke)"
        strokeWidth="6.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <path
        d="M50.8 42.3C44.2 52.8 39.5 57.5 39.5 68.1C39.5 79 47 87.2 56.9 87.2C66.8 87.2 74.3 79 74.3 68.1C74.3 57.5 69.7 52.9 63.1 42.3C61.9 40.5 60 37.8 56.9 34.5C53.9 37.8 51.9 40.5 50.8 42.3Z"
        fill="url(#dropFill)"
      />

      <path
        d="M51.4 68.7C51.4 64.2 53.5 60 56.8 56.7C57.5 56 58.7 56.5 58.7 57.5C58.7 64.4 55.4 70.7 50.5 74.7C49.8 75.3 48.7 74.8 48.9 73.8C49.2 72.1 49.9 70.4 51.4 68.7Z"
        fill="white"
      />

      <path
        d="M83.4 23.2C80.3 28.1 79.8 34.5 82.1 40.7C86.4 37.5 89.3 32.9 90 27.1C90.4 23.8 86.4 20.3 83.4 23.2Z"
        fill="url(#leafFill)"
      />
      <path
        d="M76.2 32.7C69.4 34.7 64 39.8 61 46.6C67.2 48.2 73.1 46.7 78.2 42.1C81.1 39.4 80.3 31.8 76.2 32.7Z"
        fill="url(#leafFill)"
      />
      <path
        d="M90.2 34.3C84.2 37 79.7 42.5 77.9 49.6C84.3 50.2 90 47.7 94.7 42.5C97.3 39.5 95 32.2 90.2 34.3Z"
        fill="url(#leafFill)"
      />
      <path
        d="M94.2 49.8C88.4 52.2 84.2 57.1 82.6 63.6C88.5 64.4 93.7 62.2 98.1 57.7C100.8 54.9 98.8 47.9 94.2 49.8Z"
        fill="url(#leafFill)"
      />
      <path
        d="M83.3 56.1C78.4 57.8 74.6 61.4 72.5 66.5C77.3 67.5 81.8 66.3 85.7 62.9C88.2 60.7 87.2 54.8 83.3 56.1Z"
        fill="url(#leafFill)"
      />
      <path
        d="M70.4 27.7C64.9 29.7 60.8 34.2 58.9 39.8C64.4 40.6 69.2 38.8 73 34.7C75.4 32.2 74.4 26.5 70.4 27.7Z"
        fill="url(#leafFill)"
      />
      <path
        d="M63 38.8C56.8 39.7 51.8 43.3 48.7 48.8C54.4 50.5 59.8 49.6 64.5 46.1C67.3 44.1 67.1 38.2 63 38.8Z"
        fill="url(#leafFill)"
      />
      <path
        d="M67.2 51.9C61 52.7 55.8 56.3 52.5 61.9C58.2 63.8 63.7 62.8 68.6 59.2C71.4 57.1 71.3 51.4 67.2 51.9Z"
        fill="url(#leafFill)"
      />

      <path
        d="M74.8 22C77.8 37.5 78.7 53.2 77.6 69.1C76.9 79.8 75.6 90.2 73.9 99.8"
        stroke="url(#leafFill)"
        strokeWidth="4.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
