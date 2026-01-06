export function MasterComponent({ ...rest }) {
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
        d="M8.36396 18.2635L11.8995 14.7279L15.435 18.2635L11.8995 21.799L8.36396 18.2635Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M2 11.8995L5.53553 8.36396L9.07107 11.8995L5.53553 15.435L2 11.8995Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14.7279 11.8995L18.2635 8.36396L21.799 11.8995L18.2635 15.435L14.7279 11.8995Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8.36396 5.53553L11.8995 2L15.435 5.53553L11.8995 9.07107L8.36396 5.53553Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default MasterComponent;
