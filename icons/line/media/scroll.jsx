export function Scroll({ ...rest }) {
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
        d="M20 2C22 2 22 4 22 4V7H18M20 2C18 2 18 4 18 4V7M20 2H7C5 2 5 4 5 4V17M18 7V20C18 20 18 22 16 22M16 22C14 22 14 20 14 20V17H2V20C2 20 2 22 4 22H16ZM9 8H14M9 12H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Scroll;
