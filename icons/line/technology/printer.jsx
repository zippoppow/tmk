export function Printer({ ...rest }) {
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
        d="M6 17H1V8C1 6.89543 1.89543 6 3 6H21C22.1046 6 23 6.89543 23 8V17H18M6 14H18V23H6V14ZM6 1H18V6H6V1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Printer;
