export function FullScreen({ ...rest }) {
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
        d="M16 1H23V8M23 16V23H16M8 1H1V8M1 16L1 23H8"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default FullScreen;
