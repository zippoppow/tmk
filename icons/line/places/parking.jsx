export function Parking({ ...rest }) {
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
        d="M9 18V14M9 14V7H12.3704C14.375 7 16 8.56698 16 10.5C16 12.433 14.375 14 12.3704 14H9ZM23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Parking;
