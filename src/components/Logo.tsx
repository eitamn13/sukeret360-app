interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <img
      src="https://i.postimg.cc/FrmVmf7S/16p-Kq.jpg"
      alt="לוגו הסוכרת של לאה"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
  );
}
