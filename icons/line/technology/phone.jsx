export function Phone({ ...rest }) {
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
        d="M11 19H13M8 23H16C17.6569 23 19 21.6569 19 20V4C19 2.34315 17.6569 1 16 1H8C6.34315 1 5 2.34315 5 4V20C5 21.6569 6.34315 23 8 23Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Phone;
