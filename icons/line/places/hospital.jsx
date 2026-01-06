export function Hospital({ ...rest }) {
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
        d="M19 23V5H5V23M19 23H5M19 23V15H23V23H19ZM5 23H1V15H5V23ZM12 17H16V23H12M12 17V23M12 17H8V23H12M12 8V14M9 11H15M8 5H16V1H8V5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Hospital;
