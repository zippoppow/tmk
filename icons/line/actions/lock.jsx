export function Lock({ ...rest }) {
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
        d="M7 10V6C7 4.67392 7.52678 3.40215 8.46447 2.46447C9.40215 1.52678 10.6739 1 12 1C13.3261 1 14.5979 1.52678 15.5355 2.46447C16.4732 3.40215 17 4.67392 17 6V10M2 12C2 10.3431 3.34315 9 5 9H19C20.6569 9 22 10.3431 22 12V20C22 21.6569 20.6569 23 19 23H5C3.34315 23 2 21.6569 2 20V12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Lock;
