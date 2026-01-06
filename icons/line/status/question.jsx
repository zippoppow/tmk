export function Question({ ...rest }) {
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
        d="M12 14V13.2295C12 12.2364 12.7627 11.4167 13.6133 10.9041C14.4344 10.4092 15.2185 9.5295 15 7.99999C14.5714 4.99997 10.5 6.5 10.5 6.5M12 17V17.5M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Question;
