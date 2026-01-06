export function BulletsNumbered({ ...rest }) {
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
        d="M10 5H22M10 12H22M10 19H22M2 3H3.5V7M2 17H4.5V19M4.5 19H3M4.5 19V21H2M2 10H4.5L2.5 13.5H5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default BulletsNumbered;
