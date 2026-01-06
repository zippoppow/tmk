export function Wind({ ...rest }) {
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
        d="M23 12H4.5C2.5 12 1 10.5 1 8.5C1 6.5 2.5 5.5 4.5 5.5C6.5 5.5 7.5 6.5 8 8M23 16.5H8.5C6.5 16.5 5 18 5 20C5 22 6.5 23 8.5 23C10.5 23 11.5 22 12 20.5M23 7.5H14.5C12.5 7.5 11 6 11 4C11 2 12.5 1 14.5 1C16.5 1 17.5 2 18 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Wind;
