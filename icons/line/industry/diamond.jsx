export function Diamond({ ...rest }) {
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
        d="M11.9998 22L22.9976 9L18.9998 2H4.99995L1.00232 9L11.9998 22ZM11.9998 22L8 9L9 2M11.9998 22L16 9L15 2M1 9H23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Diamond;
