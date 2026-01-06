export function Money({ ...rest }) {
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
        d="M17 9V7C17 5.89543 16.1046 5 15 5H3C1.89543 5 1 5.89543 1 7V13C1 14.1046 1.89543 15 3 15H6.85714M9 19H21C22.1046 19 23 18.1046 23 17V11C23 9.89543 22.1046 9 21 9H9C7.89543 9 7 9.89543 7 11V17C7 18.1046 7.89543 19 9 19ZM17 14C17 15.1046 16.1046 16 15 16C13.8954 16 13 15.1046 13 14C13 12.8954 13.8954 12 15 12C16.1046 12 17 12.8954 17 14Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Money;
