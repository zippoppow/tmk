export function Chip({ ...rest }) {
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
        d="M15 1V4M23 9H20M23 15H20M4 9H1M4 15H1M9 1V4M15 20V23M9 20V23M7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20ZM9.5 15H14.5C14.7761 15 15 14.7761 15 14.5V9.5C15 9.22386 14.7761 9 14.5 9H9.5C9.22386 9 9 9.22386 9 9.5V14.5C9 14.7761 9.22386 15 9.5 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Chip;
