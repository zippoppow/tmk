export function QRCode({ ...rest }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M10 1H14M10 4H14M12 12H16M18 18H10M8 10H12M0 12H4M6 12H10M10 14H12M20 20H22M22 15H24M14 10H16M19 11H24M16 16H20M10 23H18M11 1V8M13 15V22M23 19V24M19 10V16M1 1H7V7H1V1ZM1 17H7V23H1V17ZM17 1H23V7H17V1Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default QRCode;
