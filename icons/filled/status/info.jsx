export function Info({ ...rest }) {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 6C12.5523 6 13 6.44772 13 7V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V7C11 6.44772 11.4477 6 12 6ZM12 15C12.5523 15 13 15.4477 13 16V16.5C13 17.0523 12.5523 17.5 12 17.5C11.4477 17.5 11 17.0523 11 16.5V16C11 15.4477 11.4477 15 12 15Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Info;
