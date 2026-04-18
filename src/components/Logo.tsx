interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <img
      src="/brand/logo-sukeret.svg"
      alt={'\u05d4\u05dc\u05d5\u05d2\u05d5 \u05e9\u05dc \u05d4\u05e1\u05d5\u05db\u05e8\u05ea \u05e9\u05dc\u05d9'}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  );
}
