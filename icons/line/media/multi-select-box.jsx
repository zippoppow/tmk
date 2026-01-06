export function MultiSelectBox({ ...rest }) {
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
        d="M15 1H4C2.34315 1 1 2.34315 1 4V15M9 23H21C22.1046 23 23 22.1046 23 21V9C23 7.89543 22.1046 7 21 7H9C7.89543 7 7 7.89543 7 9V21C7 22.1046 7.89543 23 9 23Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default MultiSelectBox;
