export function Ticket({ ...rest }) {
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
        d="M15 4V6M15 11V13M15 18V20M1 6C1 4.89543 1.89543 4 3 4H21C22.1046 4 23 4.89543 23 6V9.17071C21.8348 9.58254 21 10.6938 21 12C21 13.3062 21.8348 14.4175 23 14.8293V18C23 19.1046 22.1046 20 21 20H3C1.89543 20 1 19.1046 1 18V14.8293C2.16519 14.4175 3 13.3062 3 12C3 10.6938 2.16519 9.58254 1 9.17071V6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Ticket;
