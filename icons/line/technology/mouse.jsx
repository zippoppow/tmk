export function Mouse({ ...rest }) {
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
        d="M12 9V8M12 22C8.68629 22 6 19.3137 6 16V8C6 4.68629 8.68629 2 12 2C15.3137 2 18 4.68629 18 8V16C18 19.3137 15.3137 22 12 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Mouse;
