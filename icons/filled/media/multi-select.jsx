export function MultiSelect({ ...rest }) {
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
        d="M4 0C1.79086 0 0 1.79086 0 4V20C0 22.2091 1.79086 24 4 24H20C22.2091 24 24 22.2091 24 20V4C24 1.79086 22.2091 0 20 0H4ZM7 11C6.44772 11 6 11.4477 6 12C6 12.5523 6.44771 13 7 13H17C17.5523 13 18 12.5523 18 12C18 11.4477 17.5523 11 17 11H7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default MultiSelect;
