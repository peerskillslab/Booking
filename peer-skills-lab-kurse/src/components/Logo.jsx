export default function Logo({ size = 56 }) {
  return (
    <img
      src="/images/PSL_Logo.svg"
      alt="Peer Skills Lab"
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}
