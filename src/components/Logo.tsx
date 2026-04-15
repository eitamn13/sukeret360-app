interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  const radius = Math.round(size * 0.28);

  return (
    <img
      src="/brand/logo-heart-tree.jpeg"
      alt="הלוגו של הסוכרת שלי"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: 'cover',
        boxShadow: '0 18px 36px rgba(141, 111, 98, 0.18)',
        border: '1px solid rgba(236, 224, 215, 0.9)',
        flexShrink: 0,
      }}
    />
  );
}
